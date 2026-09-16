'use strict';
// GET /api/admin/users?search=&status=&limit=40&offset=0
const { requireAdmin } = require('../../lib/adminAuth');
const { supabase }     = require('../../lib/supabase');
const { cors }         = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const search = (req.query.search || '').trim();
  const status = req.query.status || '';          // 'active' | 'suspended' | 'banned' | ''
  const limit  = Math.min(parseInt(req.query.limit  || '40', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);

  try {
    let q = supabase
      .from('users')
      .select('id, telegram_id, username, first_name, last_name, pfp_url, status, hits, attempts, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);

    if (search) {
      // Search by name, username, or exact telegram_id
      q = q.or(
        `username.ilike.%${search}%,first_name.ilike.%${search}%,telegram_id.eq.${search}`
      );
    }

    const { data, count, error } = await q;
    if (error) throw error;

    return res.json({ success: true, users: data || [], total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/users]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};
