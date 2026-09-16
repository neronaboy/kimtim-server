'use strict';
// GET  /api/bins              — list all BINs
// POST /api/bins              — add a BIN  { bin, site, credit }
// POST /api/bins/vote         — vote         { bin_id, vote: 'like'|'dislike' }
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../lib/auth');
const { supabase }    = require('../lib/supabase');
const { cors }        = require('../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // ── GET — list BINs ─────────────────────────────────────
  if (req.method === 'GET') {
    const { data: bins, error } = await supabase
      .from('bins')
      .select('id, bin, site, credit, likes, dislikes, added_at')
      .order('added_at', { ascending: false });

    if (error) {
      console.error('[bins GET]', error);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
    return res.json({ success: true, bins: bins || [] });
  }

  // ── POST — add BIN ──────────────────────────────────────
  if (req.method === 'POST') {
    const { bin, site, credit, action, bin_id, vote } = req.body || {};

    // Handle vote action
    if (action === 'vote' || (bin_id && vote)) {
      if (!bin_id || !['like', 'dislike'].includes(vote)) {
        return res.status(400).json({ success: false, error: 'Invalid vote params' });
      }
      const col = vote === 'like' ? 'likes' : 'dislikes';
      // Increment atomically via RPC or raw update
      const { data: cur } = await supabase.from('bins').select(col).eq('id', bin_id).single();
      if (!cur) return res.status(404).json({ success: false, error: 'BIN not found' });

      await supabase.from('bins').update({ [col]: (cur[col] || 0) + 1 }).eq('id', bin_id);
      return res.json({ success: true });
    }

    // Add new BIN
    if (!bin || !site) {
      return res.status(400).json({ success: false, error: 'bin and site are required' });
    }

    const { data, error } = await supabase
      .from('bins')
      .insert({ bin, site, credit: credit || null, added_by: user.id })
      .select('id, bin, site, credit, likes, dislikes, added_at')
      .single();

    if (error) {
      console.error('[bins POST]', error);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
    return res.json({ success: true, bin: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
