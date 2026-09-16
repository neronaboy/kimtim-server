'use strict';
// ─────────────────────────────────────────────────────────
// CONSOLIDATED PROXY ROUTER
// Replaces 3 files (save/list/check) with ONE function.
//
// Routes:
//   POST /api/proxy/save   { proxy_string, label? }
//   GET  /api/proxy/list
//   POST /api/proxy/check  { proxy_string } | { proxy_id }
// ─────────────────────────────────────────────────────────
const { requireAuth } = require('../../lib/auth');
const { encrypt, decrypt } = require('../../lib/crypto');
const { supabase }    = require('../../lib/supabase');
const { cors }        = require('../../lib/cors');

// ── shared proxy metadata parser ─────────────────────────
function parseMeta(raw) {
  try {
    const s = raw.trim().replace(/^https?:\/\//i, '');
    if (s.includes('@')) {
      const atIdx    = s.lastIndexOf('@');
      const hostPart = s.slice(atIdx + 1);
      const col      = hostPart.lastIndexOf(':');
      return { host: hostPart.slice(0, col), port: parseInt(hostPart.slice(col + 1)), hasAuth: true };
    }
    const parts = s.split(':');
    if (parts.length >= 4) {
      if (/^\d+$/.test(parts[1])) return { host: parts[0], port: parseInt(parts[1]), hasAuth: true };
      return { host: parts[parts.length - 2], port: parseInt(parts[parts.length - 1]), hasAuth: true };
    }
    if (parts.length === 2) return { host: parts[0], port: parseInt(parts[1]), hasAuth: false };
    return null;
  } catch { return null; }
}

// ── save ─────────────────────────────────────────────────
async function save(req, res) {
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
        user_id: user.id, proxy_encrypted: encrypted,
        proxy_iv: iv, proxy_tag: tag, label: label || null,
        host: meta.host, port: meta.port, has_auth: meta.hasAuth, is_active: true
      })
      .select('id, label, host, port, has_auth, is_active, created_at')
      .single();

    if (error) throw error;
    return res.json({ success: true, proxy: data });
  } catch (err) {
    console.error('[proxy/save]', err);
    return res.status(500).json({ success: false, error: 'Failed to save proxy' });
  }
}

// ── list ─────────────────────────────────────────────────
async function list(req, res) {
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

    const proxies = (rows || []).map(p => {
      let proxy_string = null;
      try { proxy_string = decrypt(p.proxy_encrypted, p.proxy_iv, p.proxy_tag); } catch {}
      return {
        id: p.id, label: p.label, host: p.host, port: p.port,
        has_auth: p.has_auth, proxy_string, created_at: p.created_at
      };
    });

    return res.json({ success: true, proxies });
  } catch (err) {
    console.error('[proxy/list]', err);
    return res.status(500).json({ success: false, error: 'Failed to list proxies' });
  }
}

// ── check ────────────────────────────────────────────────
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
        success: true, status: 'success',
        proxy_ip: r.ip || '', response_time_ms: r.response_time_ms || 0,
        country_name: r.country_name || '', country_code: r.country_code || '',
        ip_type: r.ip_type || 'Unknown', types: r.types || ['HTTP'],
        proxy_host: r.proxy_host || '', proxy_port: r.proxy_port || ''
      };
    }
    return { success: false, status: 'fail', error: r.error || 'Proxy dead' };
  } catch (e) {
    return { success: false, status: 'fail', error: e.message };
  }
}

async function check(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let { proxy_string, proxy_id } = req.body || {};

  if (proxy_id && !proxy_string) {
    const { data: row } = await supabase
      .from('proxies')
      .select('proxy_encrypted, proxy_iv, proxy_tag')
      .eq('id', proxy_id).eq('user_id', user.id).single();

    if (!row) return res.status(404).json({ success: false, error: 'Proxy not found' });
    try { proxy_string = decrypt(row.proxy_encrypted, row.proxy_iv, row.proxy_tag); }
    catch { return res.status(500).json({ success: false, error: 'Decrypt failed' }); }
  }

  if (!proxy_string) return res.status(400).json({ success: false, error: 'Missing proxy' });

  const result = await checkViaProxyShare(proxy_string);
  return res.json(result || { success: false, status: 'fail', error: 'Check failed' });
}

// ── router ───────────────────────────────────────────────
module.exports = async (req, res) => {
  const action = (req.query && Array.isArray(req.query.path) && req.query.path[0]) || '';
  switch (action) {
    case 'save':  return save(req, res);
    case 'list':  return list(req, res);
    case 'check': return check(req, res);
    default:      return res.status(404).json({ error: 'Not found' });
  }
};
