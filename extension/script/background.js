'use strict';
// ═══════════════════════════════════════════════════════════
//  kimtim background.js  —  v2 (server-based)
//
//  ALL credentials, hit recording and Telegram notifications
//  now go through the Vercel server.
//  The extension only stores a bearer token locally.
// ═══════════════════════════════════════════════════════════

// ── Server endpoints ─────────────────────────────────────────
// Replace these placeholders after deployment:
//   API_BASE         → your Vercel project URL
//   CF_RELAY_URL     → your Cloudflare Worker URL
//   CF_RELAY_KEY     → the WORKER_SECRET value set in wrangler
const API_BASE     = 'https://kimtim-server.vercel.app';
const CF_RELAY_URL = 'https://kimtim-proxy-relay.YOUR-WORKER.workers.dev';
const CF_RELAY_KEY = 'YOUR_WORKER_SECRET';

// ── Chrome API guard ──────────────────────────────────────────
const hasApi = (path) => {
  try {
    return path.split('.').reduce(
      (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
      chrome
    ) !== undefined;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────
//  Token helper  —  reads the stored bearer token
// ─────────────────────────────────────────────────────────────
function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['kimtim_token'], r => resolve((r && r.kimtim_token) || ''));
  });
}

// ─────────────────────────────────────────────────────────────
//  Generic server fetch  (adds Authorization header)
// ─────────────────────────────────────────────────────────────
async function apiFetch(method, path, body, overrideToken) {
  const token   = overrideToken || await getStoredToken();
  const headers = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opts = { method: method.toUpperCase(), headers };
  if (body && (method === 'POST' || method === 'PUT')) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const tid        = setTimeout(() => controller.abort(), 25000);

  try {
    const res  = await fetch(API_BASE + path, { ...opts, signal: controller.signal });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return res.ok ? json : { success: false, error: json.error || `HTTP ${res.status}`, status: res.status };
    } catch {
      return { success: false, error: 'Invalid JSON: ' + text.slice(0, 120) };
    }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, error: 'Request timed out' };
    return { success: false, error: err.message };
  } finally {
    clearTimeout(tid);
  }
}

// ─────────────────────────────────────────────────────────────
//  Proxy management
// ─────────────────────────────────────────────────────────────
let currentProxyAuth = null;

// Load persisted proxy auth on startup
chrome.storage.local.get(['proxyAuth'], result => {
  const saved = result && result.proxyAuth;
  if (saved && saved.username && saved.password) {
    currentProxyAuth = { username: saved.username, password: saved.password };
  }
});

// Intercept proxy auth challenges
if (hasApi('webRequest.onAuthRequired.addListener')) {
  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      if (!details || !details.isProxy || !currentProxyAuth) { callback({}); return; }
      callback({ authCredentials: currentProxyAuth });
    },
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  );
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ── Proxy string parsing ────────────────────────────────────
function parseProxyString(proxyStr) {
  if (!proxyStr || !proxyStr.trim()) return null;
  proxyStr = proxyStr.trim();
  let scheme = 'http', host = '', port = 0, username = null, password = null;

  try {
    const schemeMatch = proxyStr.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (schemeMatch) {
      const ns = schemeMatch[1].toLowerCase();
      if (ns !== 'http' && ns !== 'https') return null;
      scheme   = ns;
      proxyStr = proxyStr.substring(schemeMatch[0].length);
    }

    if (proxyStr.includes('@')) {
      const atIdx    = proxyStr.lastIndexOf('@');
      const authPart = proxyStr.substring(0, atIdx);
      const hostPart = proxyStr.substring(atIdx + 1);
      const fc       = authPart.indexOf(':');
      if (fc <= 0) return null;
      username = authPart.substring(0, fc);
      password = authPart.substring(fc + 1);
      const lc = hostPart.lastIndexOf(':');
      if (lc <= 0) return null;
      host = hostPart.substring(0, lc).trim();
      port = parseInt(hostPart.substring(lc + 1), 10);
    } else {
      const parts = proxyStr.split(':');
      if (parts.length >= 4) {
        if (/^\d+$/.test(parts[1])) {
          host = parts[0].trim(); port = parseInt(parts[1], 10);
          username = parts[2]; password = parts.slice(3).join(':');
        } else {
          username = parts[0]; password = parts.slice(1, -2).join(':');
          host = parts[parts.length - 2].trim();
          port = parseInt(parts[parts.length - 1], 10);
        }
      } else if (parts.length === 2) {
        host = parts[0].trim(); port = parseInt(parts[1], 10);
      }
    }
  } catch { return null; }

  if (!host || !port || isNaN(port) || port <= 0 || port > 65535) return null;
  return { host, port, username, password, scheme };
}

function normalizeProxyString(proxyStr) {
  const parsed = parseProxyString(proxyStr);
  if (!parsed) return null;
  if (parsed.username) return `${parsed.host}:${parsed.port}:${parsed.username}:${parsed.password || ''}`;
  return `${parsed.host}:${parsed.port}`;
}

function updateProxyAuthStorage(auth) {
  return new Promise(resolve => {
    currentProxyAuth = (auth && auth.username && auth.password) ? auth : null;
    if (currentProxyAuth) {
      chrome.storage.local.set({ proxyAuth: currentProxyAuth }, () => resolve());
    } else {
      chrome.storage.local.remove('proxyAuth', () => resolve());
    }
  });
}

function applyProxy(proxyStr) {
  return new Promise(resolve => {
    if (!hasApi('proxy.settings.set')) {
      resolve({ success: false, error: 'Proxy API not supported.' });
      return;
    }
    const parsed = parseProxyString(proxyStr);
    if (!parsed) { resolve({ success: false, error: 'Invalid proxy format' }); return; }

    const cfg = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: { scheme: parsed.scheme || 'http', host: parsed.host, port: parsed.port },
        bypassList:  ['<local>']
      }
    };

    chrome.proxy.settings.set({ value: cfg, scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      currentProxyAuth = null;
      if (parsed.username && parsed.password) {
        currentProxyAuth = { username: parsed.username, password: parsed.password };
        chrome.storage.local.set({ proxyAuth: currentProxyAuth }, () => resolve({ success: true }));
      } else {
        chrome.storage.local.remove('proxyAuth', () => resolve({ success: true }));
      }
    });
  });
}

function clearProxy() {
  return new Promise(resolve => {
    if (!hasApi('proxy.settings.clear')) {
      resolve({ success: false, error: 'Proxy API not supported.' }); return;
    }
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message }); return;
      }
      currentProxyAuth = null;
      chrome.storage.local.remove('proxyAuth', () => resolve({ success: true }));
    });
  });
}

function getProxySnapshot() {
  return new Promise(resolve => {
    if (!hasApi('proxy.settings.get')) {
      resolve({ config: null, auth: currentProxyAuth ? { ...currentProxyAuth } : null });
      return;
    }
    chrome.proxy.settings.get({ incognito: false }, details => {
      resolve({
        config: details && details.value ? details.value : null,
        auth:   currentProxyAuth ? { ...currentProxyAuth } : null
      });
    });
  });
}

async function restoreProxySnapshot(snapshot) {
  if (!snapshot) { await clearProxy(); return; }
  if (!hasApi('proxy.settings.set')) { await updateProxyAuthStorage(snapshot.auth || null); return; }
  const cfg = snapshot.config;
  if (!cfg || !cfg.mode || cfg.mode === 'system') { await clearProxy(); return; }
  await new Promise(resolve => {
    chrome.proxy.settings.set({ value: cfg, scope: 'regular' }, async () => {
      await updateProxyAuthStorage(snapshot.auth || null);
      resolve();
    });
  });
}

// ── Proxy identity check (used after applying proxy) ────────
async function fetchProxyIdentity() {
  const services = [
    async () => {
      const r = await fetch('https://api.ip.sb/geoip', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!r.ok) return null;
      const d = await r.json();
      if (!d || !d.ip) return null;
      return { success: true, proxy_ip: d.ip, country_name: d.country || '', country_code: d.country_code || '', ip_type: d.ip_type || 'Unknown' };
    },
    async () => {
      const r = await fetch('https://ipwho.is/', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!r.ok) return null;
      const d = await r.json();
      if (!d || d.success === false || !d.ip) return null;
      return { success: true, proxy_ip: d.ip, country_name: d.country || '', country_code: d.country_code || '', ip_type: d.type || 'Unknown' };
    }
  ];

  for (const run of services) {
    try {
      const result = await run();
      if (result && result.success) return result;
    } catch { /* try next */ }
  }
  return { success: false, error: 'Could not verify proxy IP' };
}

// ── Check proxy live (server-relay preferred) ────────────────
async function checkProxyLive(proxyStr) {
  const normalized = normalizeProxyString(proxyStr);
  if (!normalized) return { success: false, status: 'fail', error: 'Invalid proxy format' };

  const parsed = parseProxyString(normalized);
  const hasAuth = !!(parsed && parsed.username && parsed.password);

  // Try Cloudflare Worker relay first (server-side, hides credentials)
  if (CF_RELAY_URL && CF_RELAY_URL !== 'https://kimtim-proxy-relay.YOUR-WORKER.workers.dev') {
    try {
      const res = await fetch(`${CF_RELAY_URL}/check`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': CF_RELAY_KEY },
        body:    JSON.stringify({ proxy: normalized }),
        signal:  AbortSignal.timeout(58000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) return data;
      }
    } catch { /* fall through */ }
  }

  // Fallback: server-side check via Vercel API
  try {
    const result = await apiFetch('POST', '/api/proxy/check', { proxy_string: normalized });
    if (result && result.success) return result;
  } catch { /* fall through */ }

  // Last resort: direct local check (extension applies proxy then checks IP)
  return await checkProxyLiveDirect(normalized);
}

async function checkProxyLiveDirect(proxyStr) {
  if (!hasApi('proxy.settings.set')) return { success: false, status: 'fail', error: 'Proxy API not supported.' };
  const snapshot  = await getProxySnapshot();
  const startedAt = Date.now();
  try {
    const applied = await applyProxy(proxyStr);
    if (!applied || !applied.success) return { success: false, status: 'fail', error: applied?.error || 'Apply failed' };
    await sleep(900);
    const identity = await fetchProxyIdentity();
    if (!identity || !identity.success) return { success: false, status: 'fail', error: identity?.error || 'Validation failed' };
    const parsed = parseProxyString(proxyStr);
    return {
      success: true, status: 'success',
      proxy_ip: identity.proxy_ip || '',
      response_time_ms: Date.now() - startedAt,
      country_name: identity.country_name || '',
      country_code: identity.country_code || '',
      ip_type: identity.ip_type || 'Unknown',
      types: ['HTTP'],
      proxy_host: parsed ? parsed.host : '',
      proxy_port: parsed ? String(parsed.port) : ''
    };
  } finally {
    await restoreProxySnapshot(snapshot);
  }
}

// ─────────────────────────────────────────────────────────────
//  Token validation  (replaces old checkLicenseKey)
// ─────────────────────────────────────────────────────────────
async function validateToken(token) {
  try {
    const data = await apiFetch('POST', '/api/auth/validate', null, token);
    if (data && data.success) {
      return {
        success:    true,
        user_id:    data.user_id    || '',
        username:   data.username   || '',
        first_name: data.first_name || '',
        pfp_url:    data.pfp_url    || '',
        hits:       data.hits       || 0,
        attempts:   data.attempts   || 0
      };
    }
    if (data.status === 401) return { success: false, error: 'Invalid Token' };
    if (data.status === 403) return { success: false, error: data.error || 'Account suspended' };
    return { success: false, error: data.error || 'Server error' };
  } catch (e) {
    if (e.name === 'AbortError') return { success: false, error: 'Request timed out' };
    return { success: false, error: 'Connection failed' };
  }
}

// ─────────────────────────────────────────────────────────────
//  Hit recording  (server handles Telegram notification)
// ─────────────────────────────────────────────────────────────
async function recordHitOnServer(hitData) {
  try {
    // Add user-configured custom TG forward if set
    const stored = await new Promise(resolve => {
      chrome.storage.local.get(['kimtim_tg_bot_token', 'kimtim_tg_chat_id'], r => resolve(r || {}));
    });

    const payload = {
      ...hitData,
      tg_bot_token: stored.kimtim_tg_bot_token || null,
      tg_chat_id:   stored.kimtim_tg_chat_id   || null
    };

    await apiFetch('POST', '/api/hits/record', payload);
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────
//  Proxy server sync  (called when user saves a proxy)
// ─────────────────────────────────────────────────────────────
async function saveProxyToServer(proxyStr, label) {
  try {
    return await apiFetch('POST', '/api/proxy/save', { proxy_string: proxyStr, label: label || null });
  } catch { return { success: false, error: 'Network error' }; }
}

// ─────────────────────────────────────────────────────────────
//  Fraud / IP check  (local fallback, no server needed)
// ─────────────────────────────────────────────────────────────
async function fetchRealIp() {
  for (const url of ['https://api.ipify.org?format=json', 'https://api.ip.sb/ip']) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json, text/plain' } });
      if (!r.ok) continue;
      const text = await r.text();
      try { const j = JSON.parse(text); if (j.ip) return { success: true, ip: j.ip }; } catch { /* text IP */ }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(text.trim())) return { success: true, ip: text.trim() };
    } catch { /* try next */ }
  }
  return { success: false, error: 'Could not fetch IP' };
}

function clampFraudScore(s) { s = parseInt(s, 10); if (isNaN(s)) return 0; return Math.max(0, Math.min(100, s)); }
function buildFraudRisk(s) { s = clampFraudScore(s); if (s >= 75) return 'VERY HIGH'; if (s >= 50) return 'HIGH'; if (s >= 25) return 'MEDIUM'; return 'LOW'; }

async function getIpFraudCheck(ip, apiKey) {
  if (!ip) return { success: false, error: 'Missing IP' };

  if (apiKey) {
    try {
      const r = await fetch(
        `https://www.ipqualityscore.com/api/json/ip/${encodeURIComponent(apiKey)}/${encodeURIComponent(ip)}?strictness=1&allow_public_access_points=true`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.success !== false) {
          const score = clampFraudScore(d.fraud_score ?? d.risk_score ?? 0);
          return {
            success: true, ip: d.ip_address || ip,
            score, risk: buildFraudRisk(score),
            country: d.country_code || 'N/A', country_code: d.country_code || '',
            state: d.region || 'N/A', city: d.city || 'N/A',
            isp: d.ISP || d.organization || 'N/A',
            source: 'ipqualityscore',
            notes: [d.proxy && 'Proxy', d.vpn && 'VPN', d.tor && 'Tor', d.recent_abuse && 'Recent Abuse'].filter(Boolean).join(', ') || `Connection: ${d.connection_type || 'Unknown'}`,
            is_proxy: !!d.proxy, is_vpn: !!d.vpn, is_tor: !!d.tor
          };
        }
      }
    } catch { /* fall through */ }
  }

  // Fallback: proxycheck.io (free, no key needed)
  try {
    const r = await fetch(`https://proxycheck.io/v3/${encodeURIComponent(ip)}?vpn=1&risk=1&asn=1&days=7`, { signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const data = await r.json();
      if (data.status === 'ok' && data[ip]) {
        const row  = data[ip] || {};
        const score = clampFraudScore(row.risk || 0);
        return {
          success: true, ip,
          score, risk: buildFraudRisk(score),
          country: row.country || 'N/A', country_code: row.isocode || '',
          state: row.region || 'N/A', city: row.city || 'N/A',
          isp: row.provider || 'N/A', source: 'proxycheck.io',
          notes: [row.proxy === 'yes' && 'Proxy', row.vpn === 'yes' && 'VPN', row.tor === 'yes' && 'Tor'].filter(Boolean).join(', '),
          is_proxy: row.proxy === 'yes', is_vpn: row.vpn === 'yes', is_tor: row.tor === 'yes'
        };
      }
    }
  } catch { /* give up */ }

  return { success: false, error: 'Fraud check failed' };
}

// ─────────────────────────────────────────────────────────────
//  Telegram test  (user-configured custom bot only)
// ─────────────────────────────────────────────────────────────
async function testTelegramConfig(payload) {
  const stored = await new Promise(resolve => {
    chrome.storage.local.get(['kimtim_tg_bot_token', 'kimtim_tg_chat_id'], r => resolve(r || {}));
  });
  const botToken = String((payload && payload.botToken) || stored.kimtim_tg_bot_token || '').trim();
  const chatId   = String((payload && payload.chatId)   || stored.kimtim_tg_chat_id   || '').trim();

  if (!botToken) return { success: false, error: 'Bot token is required.' };
  if (!chatId)   return { success: false, error: 'Chat ID is required.' };

  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    chatId,
        parse_mode: 'HTML',
        text:       `<b>Telegram Forward Test</b>\n\nYour bot is working!\n<b>Time:</b> ${new Date().toLocaleString('en-US', { hour12: false })}`
      })
    });
    const body = await r.json().catch(() => null);
    if (!r.ok || (body && body.ok === false)) {
      return { success: false, error: (body && body.description) || `HTTP ${r.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Request failed.' };
  }
}

// ─────────────────────────────────────────────────────────────
//  Keep-alive alarm
// ─────────────────────────────────────────────────────────────
async function registerServiceWorker() {
  try {
    if (!hasApi('declarativeNetRequest.updateDynamicRules')) return;
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
      addRules: [{
        id: 1, priority: 1,
        action: { type: 'modifyHeaders', requestHeaders: [{ header: 'content-type', operation: 'set', value: 'application/x-www-form-urlencoded' }] },
        condition: { urlFilter: '||api.stripe.com/', resourceTypes: ['xmlhttprequest'] }
      }]
    });
  } catch { /* ignore */ }
}

function setupKeepAlive() {
  if (!hasApi('alarms.create')) return;
  chrome.alarms.create('kimtim-keepalive', { periodInMinutes: 0.33 });
}
if (hasApi('alarms.onAlarm.addListener')) {
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'kimtim-keepalive') chrome.runtime.getPlatformInfo(() => {});
  });
}
setInterval(() => { chrome.runtime.getPlatformInfo(() => {}); }, 20000);

chrome.runtime.onStartup.addListener(async () => { await registerServiceWorker(); setupKeepAlive(); });
chrome.runtime.onInstalled.addListener(async () => { await registerServiceWorker(); setupKeepAlive(); });
setupKeepAlive();

// ─────────────────────────────────────────────────────────────
//  Port connections (keep SW alive)
// ─────────────────────────────────────────────────────────────
const ports = new Set();
chrome.runtime.onConnect.addListener(port => {
  ports.add(port);
  registerServiceWorker();
  port.onDisconnect.addListener(() => ports.delete(port));
  const pi = setInterval(() => { try { port.postMessage({ type: 'PING' }); } catch { clearInterval(pi); } }, 25000);
});

// ─────────────────────────────────────────────────────────────
//  Offscreen document (audio playback)
// ─────────────────────────────────────────────────────────────
let offscreenCreated = false;
async function ensureOffscreenDocument() {
  if (offscreenCreated) return true;
  if (!hasApi('runtime.getContexts') || !hasApi('offscreen.createDocument')) return false;
  try {
    const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existing.length > 0) { offscreenCreated = true; return true; }
    await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Play hit sound' });
    offscreenCreated = true;
    return true;
  } catch (err) {
    if (err.message?.includes('already exists')) { offscreenCreated = true; return true; }
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
//  Screenshot helper
// ─────────────────────────────────────────────────────────────
const capturedHits = new Map();
async function captureScreenshot(tabId) {
  try {
    if (!hasApi('tabs.captureVisibleTab') || !hasApi('downloads.download')) return null;
    const res = await chrome.storage.local.get(['kimtim_toggle_auto_ss']);
    if (res.kimtim_toggle_auto_ss === false) return null;
    const now = Date.now();
    if (capturedHits.has(tabId) && now - capturedHits.get(tabId) < 5000) return null;
    capturedHits.set(tabId, now);
    setTimeout(() => capturedHits.delete(tabId), 10000);
    await sleep(500);
    let tab;
    if (tabId) { tab = await chrome.tabs.get(tabId); }
    else { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); }
    if (!tab || !tab.windowId) return null;
    if (hasApi('windows.update')) await chrome.windows.update(tab.windowId, { focused: true });
    if (hasApi('tabs.update')) await chrome.tabs.update(tab.id, { active: true });
    await sleep(100);
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 });
    if (!dataUrl) return null;
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', dataUrl }).catch(() => {});
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    await chrome.downloads.download({ url: dataUrl, filename: `kimtim_${ts}.png`, saveAs: false });
    return dataUrl;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────
//  Message handler
// ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Auth ──────────────────────────────────────────────────
  if (message.type === 'VALIDATE_TOKEN') {
    validateToken(message.token)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Legacy — kept for compatibility with inject.js check-key flow
  if (message.type === 'CHECK_LICENSE_KEY') {
    validateToken(message.key)
      .then(r => sendResponse({ success: true, valid: r.success, ...r }))
      .catch(() => sendResponse({ success: true, valid: true, offline: true }));
    return true;
  }

  // ── API passthrough ───────────────────────────────────────
  if (message.type === 'API_REQUEST') {
    const { endpoint, payload = {} } = message;
    const method = (payload._method || 'POST').toUpperCase();
    delete payload._method;
    const path = '/api/' + endpoint;
    apiFetch(method, path, method === 'POST' || method === 'PUT' ? payload : null)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── Proxy ─────────────────────────────────────────────────
  if (message.type === 'CHECK_PROXY_LIVE') {
    checkProxyLive(message.proxy)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, status: 'fail', error: err.message }));
    return true;
  }

  if (message.type === 'APPLY_PROXY') {
    applyProxy(message.proxy)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CLEAR_PROXY') {
    clearProxy()
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Save proxy locally AND sync to server
  if (message.type === 'SAVE_PROXY_TO_SERVER') {
    saveProxyToServer(message.proxy, message.label || null)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Load proxies from server
  if (message.type === 'LOAD_SERVER_PROXIES') {
    apiFetch('GET', '/api/proxy/list')
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── Hit recording (server-side, server sends TG) ─────────
  if (message.type === 'SEND_TELEGRAM_NOTIFICATION') {
    // Record on server (non-blocking — don't block extension)
    recordHitOnServer(message.data).catch(() => {});
    return false;
  }

  if (message.type === 'RECORD_HIT') {
    recordHitOnServer(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── Telegram custom-bot test ──────────────────────────────
  if (message.type === 'TEST_TELEGRAM_CONFIG') {
    testTelegramConfig(message.payload || {})
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── IP / fraud check ──────────────────────────────────────
  if (message.type === 'FETCH_REAL_IP') {
    fetchRealIp().then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_IP_FRAUD_CHECK') {
    getIpFraudCheck(message.ip, message.endpoint || '')
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── Screenshot ────────────────────────────────────────────
  if (message.type === 'CAPTURE_SCREENSHOT') {
    captureScreenshot(sender && sender.tab ? sender.tab.id : null)
      .then(dataUrl => sendResponse({ dataUrl }));
    return true;
  }

  // ── Image fetch (for PFP) ─────────────────────────────────
  if (message.type === 'FETCH_IMAGE') {
    (async () => {
      try {
        const r = await fetch(message.url);
        if (!r.ok) { sendResponse({ success: false }); return; }
        const blob   = await r.blob();
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ success: true, dataUrl: reader.result });
        reader.onerror   = () => sendResponse({ success: false });
        reader.readAsDataURL(blob);
      } catch { sendResponse({ success: false }); }
    })();
    return true;
  }

  // ── Audio ─────────────────────────────────────────────────
  if (message.type === 'PLAY_SUCCESS_SOUND_OFFSCREEN') {
    ensureOffscreenDocument().then(ok => {
      if (ok) setTimeout(() => chrome.runtime.sendMessage({ type: 'PLAY_SUCCESS_SOUND', volume: message.volume || 1.0 }).catch(() => {}), 100);
    });
    return false;
  }

  if (message.type === 'PLAY_BACKGROUND_MUSIC') {
    chrome.storage.local.get(['kimtim_music_data'], r => {
      if (r.kimtim_music_data) {
        ensureOffscreenDocument().then(ok => {
          if (ok) setTimeout(() => chrome.runtime.sendMessage({ type: 'PLAY_BACKGROUND_MUSIC', audioData: r.kimtim_music_data, volume: message.volume }).catch(() => {}), 100);
        });
      }
    });
    return false;
  }

  if (message.type === 'STOP_BACKGROUND_MUSIC') {
    ensureOffscreenDocument().then(ok => {
      if (ok) chrome.runtime.sendMessage({ type: 'STOP_BACKGROUND_MUSIC' }).catch(() => {});
    });
    return false;
  }

  if (message.type === 'PLAY_CUSTOM_PREVIEW') {
    chrome.storage.local.get(['kimtim_music_data'], r => {
      if (r.kimtim_music_data) {
        ensureOffscreenDocument().then(ok => {
          if (ok) setTimeout(() => chrome.runtime.sendMessage({ type: 'PLAY_CUSTOM_PREVIEW', audioData: r.kimtim_music_data }).catch(() => {}), 100);
        });
      }
    });
    return false;
  }

  if (message.type === 'STOP_CUSTOM_PREVIEW') {
    ensureOffscreenDocument().then(ok => {
      if (ok) chrome.runtime.sendMessage({ type: 'STOP_CUSTOM_PREVIEW' }).catch(() => {});
    });
    return false;
  }

  // ── Local stats cache ─────────────────────────────────────
  if (message.type === 'UPDATE_LOCAL_STATS') {
    const { hit, attempt, historyEntry } = message.payload;
    chrome.storage.local.get(['kim_local_hits', 'kim_local_attempts', 'kim_local_history'], r => {
      const updates = {};
      if (hit)          updates.kim_local_hits     = (r.kim_local_hits     || 0) + 1;
      if (attempt)      updates.kim_local_attempts  = (r.kim_local_attempts || 0) + 1;
      if (historyEntry) {
        const history = r.kim_local_history || [];
        history.unshift(historyEntry);
        updates.kim_local_history = history.slice(0, 100);
      }
      chrome.storage.local.set(updates, () => sendResponse({ success: true }));
    });
    return true;
  }

  return false;
});
