'use strict';
// POST /api/proxy/check   { proxy_string } | { proxy_id }
// ─────────────────────────────────────────────────────────
// Server-side proxy checker — completely hides credentials
// from the client. Uses proxyshare.com as the backend.
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../../lib/auth');
const { decrypt }     = require('../../lib/crypto');
const { supabase }    = require('../../lib/supabase');
const { cors }        = require('../../lib/cors');

async function checkViaProxyShare(proxyStr) {
  try {
    const res = await fetch('https://www.proxyshare.com/detection/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
      },
      body: JSON.stringify({ list: [proxyStr] }),
      signal: AbortSignal.timeout(55000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;

    const r = data[0];
    if (r.available === true) {
      return {
        success:         true,
        status:          'success',
        proxy_ip:        r.ip               || '',
        response_time_ms:r.response_time_ms || 0,
        country_name:    r.country_name     || '',
        country_code:    r.country_code     || '',
        ip_type:         r.ip_type          || 'Unknown',
        types:           r.types            || ['HTTP'],
        proxy_host:      r.proxy_host       || '',
        proxy_port:      r.proxy_port       || ''
      };
    }
    return { success: false, status: 'fail', error: r.error || 'Proxy dead' };
  } catch (e) {
    return { success: false, status: 'fail', error: e.message };
  }
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let { proxy_string, proxy_id } = req.body || {};

  // If a proxy_id was given, decrypt it from the DB
  if (proxy_id && !proxy_string) {
    const { data: row } = await supabase
      .from('proxies')
      .select('proxy_encrypted, proxy_iv, proxy_tag')
      .eq('id', proxy_id)
      .eq('user_id', user.id)
      .single();

    if (!row) return res.status(404).json({ success: false, error: 'Proxy not found' });

    try {
      proxy_string = decrypt(row.proxy_encrypted, row.proxy_iv, row.proxy_tag);
    } catch {
      return res.status(500).json({ success: false, error: 'Decrypt failed' });
    }
  }

  if (!proxy_string) return res.status(400).json({ success: false, error: 'Missing proxy' });

  const result = await checkViaProxyShare(proxy_string);
  return res.json(result || { success: false, status: 'fail', error: 'Check failed' });
};
