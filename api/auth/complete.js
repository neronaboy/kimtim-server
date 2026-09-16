'use strict';
// POST /api/auth/complete
// ─────────────────────────────────────────────────────────
// Called by the Vercel-hosted auth.html page (Telegram Login
// Widget flow). Verifies the Telegram auth data hash,
// upserts the user, creates a session and completes the
// pending state so the polling endpoint can hand back a token.
// ─────────────────────────────────────────────────────────
const crypto                   = require('crypto');
const { supabase }             = require('../../lib/supabase');
const { verifyTelegramAuth }   = require('../../lib/telegram');
const { cors }                 = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    state, id, first_name, last_name, username, photo_url, auth_date, hash
  } = req.body || {};

  if (!state || !id || !hash) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Build auth-data object (skip undefined values)
  const authData = { id, first_name, last_name, username, photo_url, auth_date, hash };
  Object.keys(authData).forEach(k => authData[k] == null && delete authData[k]);

  if (!verifyTelegramAuth(authData)) {
    return res.status(401).json({ success: false, error: 'Invalid Telegram auth data' });
  }

  // Validate pending state
  const { data: pending } = await supabase
    .from('auth_pending')
    .select('*')
    .eq('state', state)
    .single();

  if (!pending || pending.completed) {
    return res.status(400).json({ success: false, error: 'Invalid or already-used state' });
  }
  if (new Date(pending.expires_at) < new Date()) {
    return res.status(400).json({ success: false, error: 'Auth state expired' });
  }

  try {
    // Upsert user record
    const { data: user, error: uErr } = await supabase
      .from('users')
      .upsert({
        telegram_id: String(id),
        username:    username   || null,
        first_name:  first_name || null,
        last_name:   last_name  || null,
        pfp_url:     photo_url  || null,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'telegram_id' })
      .select()
      .single();

    if (uErr) throw uErr;

    // Create session
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: sErr } = await supabase.from('sessions').insert({
      user_id:    user.id,
      token,
      expires_at: expiresAt
    });
    if (sErr) throw sErr;

    // Mark pending as complete
    await supabase.from('auth_pending').update({
      completed:     true,
      session_token: token,
      user_id:       user.id
    }).eq('state', state);

    return res.json({ success: true });
  } catch (err) {
    console.error('[auth/complete]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
