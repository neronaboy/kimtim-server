'use strict';
// POST /api/proxy/save   { proxy_string, label? }
// ─────────────────────────────────────────────────────────
// Encrypts and stores a proxy string server-side.
// Credentials never appear in the response — only metadata.
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../../lib/auth');
const { encrypt }     = require('../../lib/crypto');
const { supabase }    = require('../../lib/supabase');
const { cors }        = require('../../lib/cors');

/** Parse host/port (and whether auth is present) without storing credentials. */
function parseMeta(raw) {
  try {
    const s = raw.trim().replace(/^https?:\/\//i, '');
    if (s.includes('@')) {
      const atIdx   = s.lastIndexOf('@');
      const hostPart = s.slice(atIdx + 1);
      const col      = hostPart.lastIndexOf(':');
      return { host: hostPart.slice(0, col), port: parseInt(hostPart.slice(col + 1)), hasAuth: true };
    }
    const parts = s.split(':');
    if (parts.length >= 4) {
      // host:port:user:pass
      if (/^\d+$/.test(parts[1])) return { host: parts[0], port: parseInt(parts[1]), hasAuth: true };
      // user:pass:host:port
      return { host: parts[parts.length - 2], port: parseInt(parts[parts.length - 1]), hasAuth: true };
    }
    if (parts.length === 2) return { host: parts[0], port: parseInt(parts[1]), hasAuth: false };
    return null;
  } catch { return null; }
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { proxy_string, label } = req.body || {};
  if (!proxy_string) return res.status(400).json({ success: false, error: 'Missing proxy_string' });

  const meta = parseMeta(proxy_string);
  if (!meta || !meta.host || !meta.port) {
    return res.status(400).json({ success: false, error: 'Invalid proxy format' });
  }

  try {
    const { encrypted, iv, tag } = encrypt(proxy_string.trim());

    const { data, error } = await supabase
      .from('proxies')
      .insert({
        user_id:         user.id,
        proxy_encrypted: encrypted,
        proxy_iv:        iv,
        proxy_tag:       tag,
        label:           label || null,
        host:            meta.host,
        port:            meta.port,
        has_auth:        meta.hasAuth,
        is_active:       true
      })
      .select('id, label, host, port, has_auth, is_active, created_at')
      .single();

    if (error) throw error;

    return res.json({ success: true, proxy: data });
  } catch (err) {
    console.error('[proxy/save]', err);
    return res.status(500).json({ success: false, error: 'Failed to save proxy' });
  }
};
