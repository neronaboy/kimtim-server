'use strict';
// GET /api/admin/proxies?limit=40&offset=0&user_id=
// Returns proxy metadata (host/port/has_auth) — credentials
// are NEVER returned, even to admin.
const { requireAdmin } = require('../../lib/adminAuth');
const { supabase }     = require('../../lib/supabase');
const { cors }         = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const limit  = Math.min(parseInt(req.query.limit  || '40', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);
  const userId = req.query.user_id || '';

  try {
    let q = supabase
      .from('proxies')
      .select('id, user_id, label, host, port, has_auth, is_active, created_at, users(first_name, username, telegram_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) q = q.eq('user_id', userId);

    const { data, count, error } = await q;
    if (error) throw error;

    const proxies = (data || []).map(p => ({
      id:          p.id,
      user_id:     p.user_id,
      user_name:   p.users?.first_name || p.users?.username || 'Unknown',
      telegram_id: p.users?.telegram_id || '',
      label:       p.label || null,
      display:     `${p.host}:${p.port}`,
      has_auth:    p.has_auth,
      is_active:   p.is_active,
      created_at:  p.created_at
    }));

    return res.json({ success: true, proxies, total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/proxies]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch proxies' });
  }
};
