'use strict';
// GET /api/stats   (Authorization: Bearer TOKEN)
// ─────────────────────────────────────────────────────────
// Returns global stats + leaderboard.
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../lib/auth');
const { supabase }    = require('../lib/supabase');
const { cors }        = require('../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now - 7 * 864e5).toISOString();

    const [uCnt, hAll, hToday, hWeek, lb] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('hits').select('id',  { count: 'exact', head: true }),
      supabase.from('hits').select('id',  { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('hits').select('id',  { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('users')
        .select('id, first_name, username, pfp_url, hits')
        .order('hits', { ascending: false })
        .limit(10)
    ]);

    return res.json({
      success: true,
      stats: {
        total_users: uCnt.count  || 0,
        total_hits:  hAll.count  || 0,
        hits_today:  hToday.count|| 0,
        hits_week:   hWeek.count || 0
      },
      leaderboard: (lb.data || []).map(u => ({
        user_id:  u.id,
        name:     u.first_name || u.username || 'Unknown',
        pfp_url:  u.pfp_url || '',
        hits:     u.hits    || 0
      }))
    });
  } catch (err) {
    console.error('[stats]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
