'use strict';
// GET /api/hit-counts
// ─────────────────────────────────────────────────────────
// Lightweight live-counter poll used by the extension.
// Returns the global hit total (from the `hits` table) and,
// when a valid token is supplied, the caller's own hit count.
// Auth is OPTIONAL here: global_hits is always returned so the
// dashboard badge works even for a not-yet-authed poll.
// ─────────────────────────────────────────────────────────
const { getAuthUser, extractToken } = require('../lib/auth');
const { supabase } = require('../lib/supabase');
const { cors }     = require('../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  try {
    const gAll = await supabase
      .from('hits')
      .select('id', { count: 'exact', head: true });
    const global_hits = gAll.count || 0;

    let user_hits = 0;
    const user = await getAuthUser(extractToken(req));
    if (user) user_hits = user.hits || 0;

    return res.json({ success: true, global_hits, user_hits });
  } catch (err) {
    console.error('[hit-counts]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
