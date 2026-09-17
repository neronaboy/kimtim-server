'use strict';
// ─────────────────────────────────────────────────────────
// CONSOLIDATED ADMIN ROUTER
// Replaces 6 files with ONE serverless function.
//
// Routes:
//   POST /api/admin/login        { password }
//   GET  /api/admin/stats
//   GET  /api/admin/users?search=&status=&limit=&offset=
//   POST /api/admin/user-action  { user_id, action }
//   GET  /api/admin/hits?limit=&offset=&user_id=
//   GET  /api/admin/proxies?limit=&offset=&user_id=
// ─────────────────────────────────────────────────────────
const crypto                  = require('crypto');
const { createAdminToken, requireAdmin } = require('../../lib/adminAuth');
const { supabase }            = require('../../lib/supabase');
const { cors }                = require('../../lib/cors');

// ── login ────────────────────────────────────────────────
async function login(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) {
    return res.status(500).json({ success: false, error: 'ADMIN_PASSWORD is not configured on the server' });
  }

  const provided = String((req.body && req.body.password) || '');
  const a = Buffer.alloc(64); Buffer.from(adminPassword).copy(a);
  const b = Buffer.alloc(64); Buffer.from(provided).copy(b);
  const match = crypto.timingSafeEqual(a, b) && provided === adminPassword;

  if (!match) return res.status(401).json({ success: false, error: 'Invalid password' });

  return res.json({ success: true, token: createAdminToken() });
}

// ── stats ────────────────────────────────────────────────
async function stats(req, res) {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;

  try {
    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now - 7 * 864e5).toISOString();

    const [totalUsers, activeUsers, suspendedUsers, bannedUsers,
           totalHits, todayHits, weekHits, totalProxies] = await Promise.all([
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
        total_users: totalUsers.count || 0, active_users: activeUsers.count || 0,
        suspended_users: suspendedUsers.count || 0, banned_users: bannedUsers.count || 0,
        total_hits: totalHits.count || 0, hits_today: todayHits.count || 0,
        hits_week: weekHits.count || 0, total_proxies: totalProxies.count || 0
      }
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── users ────────────────────────────────────────────────
async function users(req, res) {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const search = (req.query.search || '').trim();
  const status = req.query.status || '';
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
      q = q.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,telegram_id.eq.${search}`);
    }

    const { data, count, error } = await q;
    if (error) throw error;
    return res.json({ success: true, users: data || [], total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/users]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
}

// ── user-action ──────────────────────────────────────────
const VALID_ACTIONS = { ban: 'banned', suspend: 'suspended', activate: 'active' };

async function userAction(req, res) {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, action } = req.body || {};
  if (!user_id) return res.status(400).json({ success: false, error: 'Missing user_id' });
  if (!VALID_ACTIONS[action]) {
    return res.status(400).json({ success: false, error: 'action must be ban | suspend | activate' });
  }

  const newStatus = VALID_ACTIONS[action];

  try {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', user_id)
      .select('id, username, first_name, status')
      .single();

    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (newStatus !== 'active') {
      await supabase.from('sessions').update({ is_valid: false }).eq('user_id', user_id);
    }

    return res.json({
      success: true, user_id, new_status: newStatus,
      message: `User ${user.first_name || user.username || user_id} has been ${newStatus}.`
    });
  } catch (err) {
    console.error('[admin/user-action]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ── hits ─────────────────────────────────────────────────
function maskCard(card) {
  if (!card) return '----';
  const parts = String(card).split('|');
  const num = parts[0] || '';
  const masked = num.length > 6 ? num.slice(0, 6) + '••••••' + num.slice(-4) : num;
  return [masked, parts[1] || '--', parts[2] || '--', parts[3] || '***'].join(' | ');
}

async function hits(req, res) {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const limit  = Math.min(parseInt(req.query.limit  || '40', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);
  const userId = req.query.user_id || '';

  try {
    let q = supabase
      .from('hits')
      .select('id, user_id, card_number, bin, site, business_url, amount, currency, attempt_count, time_taken, created_at, users(first_name, username, telegram_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) q = q.eq('user_id', userId);
    const { data, count, error } = await q;
    if (error) throw error;

    const hitsArr = (data || []).map(h => ({
      id: h.id, user_id: h.user_id,
      user_name: h.users?.first_name || h.users?.username || 'Unknown',
      telegram_id: h.users?.telegram_id || '',
      card_masked: maskCard(h.card_number), bin: h.bin || '------',
      site: h.site || 'N/A', business_url: h.business_url || '',
      amount: h.amount || '0', currency: (h.currency || 'usd').toUpperCase(),
      attempt_count: h.attempt_count || 0, time_taken: h.time_taken || 'N/A',
      created_at: h.created_at
    }));

    return res.json({ success: true, hits: hitsArr, total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/hits]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch hits' });
  }
}

// ── proxies ──────────────────────────────────────────────
async function proxies(req, res) {
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

    const proxiesArr = (data || []).map(p => ({
      id: p.id, user_id: p.user_id,
      user_name: p.users?.first_name || p.users?.username || 'Unknown',
      telegram_id: p.users?.telegram_id || '',
      label: p.label || null, display: `${p.host}:${p.port}`,
      has_auth: p.has_auth, is_active: p.is_active, created_at: p.created_at
    }));

    return res.json({ success: true, proxies: proxiesArr, total: count || 0, offset, limit });
  } catch (err) {
    console.error('[admin/proxies]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch proxies' });
  }
}

// ── router ───────────────────────────────────────────────
module.exports = async (req, res) => {
  const _qp = req.query && req.query.path;
  let action = Array.isArray(_qp) ? (_qp[0] || '') : (typeof _qp === 'string' ? _qp : '');
  if (!action) {
    try {
      const _segs = String(req.url || '').split('?')[0].split('/').filter(Boolean);
      action = _segs[_segs.length - 1] || '';
    } catch (_e) { action = ''; }
  }
  switch (action) {
    case 'login':       return login(req, res);
    case 'stats':       return stats(req, res);
    case 'users':       return users(req, res);
    case 'user-action': return userAction(req, res);
    case 'hits':        return hits(req, res);
    case 'proxies':     return proxies(req, res);
    default:            return res.status(404).json({ error: 'Not found' });
  }
};
