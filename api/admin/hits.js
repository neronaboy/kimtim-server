'use strict';
// GET /api/admin/hits?limit=40&offset=0&user_id=
const { requireAdmin } = require('../../lib/adminAuth');
const { supabase }     = require('../../lib/supabase');
const { cors }         = require('../../lib/cors');

function maskCard(card) {
  if (!card) return '----';
  const parts = String(card).split('|');
  const num = parts[0] || '';
  const masked = num.length > 6
    ? num.slice(0, 6) + '••••••' + num.slice(-4)
    : num;
  return [masked, parts[1] || '--', parts[2] || '--', parts[3] || '***'].join(' | ');
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const limit   = Math.min(parseInt(req.query.limit  || '40', 10), 100);
  const offset  = parseInt(req.query.offset  || '0', 10);
  const userId  = req.query.user_id || '';

  try {
    let q = supabase
      .from('hits')
      .select('id, user_id, card_number, bin, site, business_url, amount, currency, attempt_count, time_taken, created_at, users(first_name, username, telegram_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) q = q.eq('user_id', userId);

    const { data, count, error } = await q;
    if (error) throw error;

    const hits = (data || []).map(h => ({
      id:            h.id,
      user_id:       h.user_id,
      user_name:     h.users?.first_name || h.users?.username || 'Unknown',
      telegram_id:   h.users?.telegram_id || '',
      card_masked:   maskCard(h.card_number),
      bin:           h.bin || '------',
      site:          h.site || 'N/A',
      business_url:  h.business_url || '',
      amount:        h.amount || '0',
      currency:      (h.currency || 'usd').toUpperCase(),
      attempt_count: h.attempt_count || 0,
      time_taken:    h.time_taken || 'N/A',
      created_at:    h.created_at
    }));

    return res.json({ success: true, hits, total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/hits]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch hits' });
  }
};
