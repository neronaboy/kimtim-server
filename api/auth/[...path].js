'use strict';
// ─────────────────────────────────────────────────────────
// CONSOLIDATED AUTH ROUTER
// Replaces 4 files (login/poll/complete/validate) with ONE
// serverless function to stay under Vercel's 12-function cap.
//
// Routes:
//   POST /api/auth/login     — create pending state + bot URL
//   POST /api/auth/poll      — poll for auth completion
//   POST /api/auth/complete  — Telegram Widget callback
//   POST /api/auth/validate  — validate bearer token
// ─────────────────────────────────────────────────────────
const crypto                   = require('crypto');
const { supabase }             = require('../../lib/supabase');
const { getBotUrl, verifyTelegramAuth } = require('../../lib/telegram');
const { requireAuth }          = require('../../lib/auth');
const { cors }                 = require('../../lib/cors');

// ── login ────────────────────────────────────────────────
async function login(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const state     = crypto.randomBytes(18).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error } = await supabase.from('auth_pending').insert({
      state, expires_at: expiresAt, completed: false
    });
    if (error) throw error;

    return res.json({
      success: true, state,
      bot_url: getBotUrl(`auth_${state}`),
      expires_in: 600
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── poll ─────────────────────────────────────────────────
async function poll(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { state } = req.body || {};
  if (!state) return res.status(400).json({ success: false, error: 'Missing state' });

  try {
    const { data: pending, error } = await supabase
      .from('auth_pending').select('*').eq('state', state).single();

    if (error || !pending) {
      return res.json({ success: false, error: 'Invalid or expired state' });
    }
    if (new Date(pending.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Auth expired — please try again' });
    }
    if (!pending.completed) return res.json({ pending: true });

    const { data: session } = await supabase
      .from('sessions').select('token, users(*)')
      .eq('user_id', pending.user_id)
      .eq('token', pending.session_token)
      .single();

    if (!session) return res.json({ success: false, error: 'Session not found' });

    await supabase.from('auth_pending').delete().eq('state', state);

    const u = session.users;
    return res.json({
      success: true,
      token: session.token,
      user: {
        user_id: u.id, username: u.username || '',
        first_name: u.first_name || '', pfp_url: u.pfp_url || '',
        hits: u.hits || 0, attempts: u.attempts || 0
      }
    });
  } catch (err) {
    console.error('[auth/poll]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── complete ─────────────────────────────────────────────
async function complete(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { state, id, first_name, last_name, username, photo_url, auth_date, hash } = req.body || {};
  if (!state || !id || !hash) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const authData = { id, first_name, last_name, username, photo_url, auth_date, hash };
  Object.keys(authData).forEach(k => authData[k] == null && delete authData[k]);

  if (!verifyTelegramAuth(authData)) {
    return res.status(401).json({ success: false, error: 'Invalid Telegram auth data' });
  }

  const { data: pending } = await supabase
    .from('auth_pending').select('*').eq('state', state).single();

  if (!pending || pending.completed) {
    return res.status(400).json({ success: false, error: 'Invalid or already-used state' });
  }
  if (new Date(pending.expires_at) < new Date()) {
    return res.status(400).json({ success: false, error: 'Auth state expired' });
  }

  try {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .upsert({
        telegram_id: String(id), username: username || null,
        first_name: first_name || null, last_name: last_name || null,
        pfp_url: photo_url || null, updated_at: new Date().toISOString()
      }, { onConflict: 'telegram_id' })
      .select().single();
    if (uErr) throw uErr;

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: sErr } = await supabase.from('sessions').insert({
      user_id: user.id, token, expires_at: expiresAt
    });
    if (sErr) throw sErr;

    await supabase.from('auth_pending').update({
      completed: true, session_token: token, user_id: user.id
    }).eq('state', state);

    return res.json({ success: true });
  } catch (err) {
    console.error('[auth/complete]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── validate ─────────────────────────────────────────────
async function validate(req, res) {
  if (cors(req, res)) return;
  try {
    const { user } = await requireAuth(req);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid Token' });
    if (user.status === 'banned')    return res.status(403).json({ success: false, error: 'Account banned' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, error: 'Account suspended' });

    return res.json({
      success: true, user_id: user.id,
      username: user.username || '', first_name: user.first_name || '',
      pfp_url: user.pfp_url || '', hits: user.hits || 0, attempts: user.attempts || 0
    });
  } catch (err) {
    console.error('[auth/validate]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── router ───────────────────────────────────────────────
module.exports = async (req, res) => {
  const action = (req.query && Array.isArray(req.query.path) && req.query.path[0]) || '';
  switch (action) {
    case 'login':    return login(req, res);
    case 'poll':     return poll(req, res);
    case 'complete': return complete(req, res);
    case 'validate': return validate(req, res);
    default:         return res.status(404).json({ error: 'Not found' });
  }
};
