'use strict';
// POST /api/auth/validate    (Authorization: Bearer TOKEN)
// ─────────────────────────────────────────────────────────
// Validates a bearer token and returns the user profile.
// Replaces the old PHP validate action.
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../../lib/auth');
const { cors }        = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  try {
    const { user } = await requireAuth(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid Token' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Account banned' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account suspended' });
    }

    return res.json({
      success:    true,
      user_id:    user.id,
      username:   user.username   || '',
      first_name: user.first_name || '',
      pfp_url:    user.pfp_url    || '',
      hits:       user.hits       || 0,
      attempts:   user.attempts   || 0
    });
  } catch (err) {
    console.error('[auth/validate]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
