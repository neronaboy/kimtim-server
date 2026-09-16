'use strict';
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
// Creates a short-lived auth-pending state and returns
// the Telegram deep-link the extension opens so the user
// can authorise via the bot.
//
// Response:
//   { success: true, state, bot_url, expires_in }
// ─────────────────────────────────────────────────────────
const crypto           = require('crypto');
const { supabase }     = require('../../lib/supabase');
const { getBotUrl }    = require('../../lib/telegram');
const { cors }         = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const state      = crypto.randomBytes(18).toString('hex');
    const expiresAt  = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error } = await supabase.from('auth_pending').insert({
      state,
      expires_at: expiresAt,
      completed:  false
    });

    if (error) throw error;

    res.json({
      success:    true,
      state,
      bot_url:    getBotUrl(`auth_${state}`),
      expires_in: 600
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
