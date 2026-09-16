'use strict';
// POST /api/auth/poll   { state }
// ─────────────────────────────────────────────────────────
// Extension polls this every 3 s after opening the bot URL.
//
// Responses:
//   { pending: true }                  — still waiting
//   { success: true, token, user }     — auth complete
//   { success: false, error }          — expired / invalid
// ─────────────────────────────────────────────────────────
const { supabase } = require('../../lib/supabase');
const { cors }     = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { state } = req.body || {};
  if (!state) return res.status(400).json({ success: false, error: 'Missing state' });

  try {
    const { data: pending, error } = await supabase
      .from('auth_pending')
      .select('*')
      .eq('state', state)
      .single();

    if (error || !pending) {
      return res.json({ success: false, error: 'Invalid or expired state' });
    }

    if (new Date(pending.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Auth expired — please try again' });
    }

    if (!pending.completed) {
      return res.json({ pending: true });
    }

    // Auth is complete — fetch session + user
    const { data: session } = await supabase
      .from('sessions')
      .select('token, users(*)')
      .eq('user_id', pending.user_id)
      .eq('token', pending.session_token)
      .single();

    if (!session) {
      return res.json({ success: false, error: 'Session not found' });
    }

    // Cleanup pending record
    await supabase.from('auth_pending').delete().eq('state', state);

    const u = session.users;
    return res.json({
      success: true,
      token:   session.token,
      user: {
        user_id:    u.id,
        username:   u.username   || '',
        first_name: u.first_name || '',
        pfp_url:    u.pfp_url    || '',
        hits:       u.hits       || 0,
        attempts:   u.attempts   || 0
      }
    });
  } catch (err) {
    console.error('[auth/poll]', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
