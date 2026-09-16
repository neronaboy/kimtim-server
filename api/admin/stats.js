'use strict';
// GET /api/admin/stats
// Returns overview counts: users, hits (total / today / week),
// active proxies, banned/suspended counts.
const { requireAdmin } = require('../../lib/adminAuth');
const { supabase }     = require('../../lib/supabase');
const { cors }         = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;

  try {
    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now - 7 * 864e5).toISOString();

    const [
      totalUsers, activeUsers, suspendedUsers, bannedUsers,
      totalHits, todayHits, weekHits,
      totalProxies
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'banned'),
      supabase.from('hits').select('id',  { count: 'exact', head: true }),
      supabase.from('hits').select('id',  { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('hits').select('id',  { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('proxies').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return res.json({
      success: true,
      stats: {
        total_users:     totalUsers.count     || 0,
        active_users:    activeUsers.count    || 0,
        suspended_users: suspendedUsers.count || 0,
        banned_users:    bannedUsers.count    || 0,
        total_hits:      totalHits.count      || 0,
        hits_today:      todayHits.count      || 0,
        hits_week:       weekHits.count       || 0,
        total_proxies:   totalProxies.count   || 0
      }
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
