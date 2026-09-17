'use strict';
// GET /api/history   (Authorization: Bearer TOKEN)
// ─────────────────────────────────────────────────────────
// Returns the authenticated user's most recent hits so the
// History / Stats panels survive logout & device changes.
// ─────────────────────────────────────────────────────────
const { getAuthUser, extractToken } = require('../lib/auth');
const { supabase } = require('../lib/supabase');
const { cors }     = require('../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  const user = await getAuthUser(extractToken(req));
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { data, error } = await supabase
      .from('hits')
      .select('card_number, bin, site, business_url, amount, currency, attempt_count, time_taken, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const hits = (data || []).map(h => ({
      time:     h.created_at,
      site:     h.site || h.business_url || '',
      card:     h.card_number || '',
      amount:   h.amount || '0',
      currency: h.currency || 'usd'
    }));

    return res.json({ success: true, count: hits.length, hits });
  } catch (err) {
    console.error('[history]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
