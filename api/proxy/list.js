'use strict';
// GET /api/proxy/list   (Authorization: Bearer TOKEN)
// ─────────────────────────────────────────────────────────
// Returns the authenticated user's saved proxies.
// The full proxy_string (decrypted) is included so the
// extension can apply it locally.
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../../lib/auth');
const { decrypt }     = require('../../lib/crypto');
const { supabase }    = require('../../lib/supabase');
const { cors }        = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { data: rows, error } = await supabase
      .from('proxies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const proxies = rows.map(p => {
      let proxy_string = null;
      try {
        proxy_string = decrypt(p.proxy_encrypted, p.proxy_iv, p.proxy_tag);
      } catch { /* decryption failed — skip */ }

      return {
        id:           p.id,
        label:        p.label,
        host:         p.host,
        port:         p.port,
        has_auth:     p.has_auth,
        proxy_string,         // full string for local Chrome proxy API
        created_at:   p.created_at
      };
    });

    return res.json({ success: true, proxies });
  } catch (err) {
    console.error('[proxy/list]', err);
    return res.status(500).json({ success: false, error: 'Failed to list proxies' });
  }
};
