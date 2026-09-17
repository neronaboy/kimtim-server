'use strict';
// ────────────────────────────────────────────────────────────
// login.js  —  kimtim v2 server-based login
//
// Two flows:
//   1. Telegram login  → opens bot deep-link, polls server
//   2. Manual token    → validates token against server
// ────────────────────────────────────────────────────────────

// Replaced by the real Vercel URL at deploy time.
// Must match background.js API_BASE.
const API_BASE = 'https://kimtim-server.vercel.app';

let pollTimer = null;
let authState = null;

// ── on load ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in → redirect
  chrome.storage.local.get(['kimtim_token'], result => {
    if (result.kimtim_token) {
      validateExistingToken(result.kimtim_token);
    }
  });

  const tgBtn       = document.getElementById('tgLoginBtn');
  const tokenInput  = document.getElementById('tokenInput');
  const tokenSubmit = document.getElementById('tokenSubmit');

  tgBtn.addEventListener('click',  startTelegramLogin);
  tokenSubmit.addEventListener('click', submitManualToken);
  tokenInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitManualToken();
  });
});

// ── Validate existing token on startup ───────────────────────
async function validateExistingToken(token) {
  try {
    const res = await serverFetch('POST', '/api/auth/validate', null, token);
    if (res && res.success) {
      storeAndRedirect(token, res);
    }
    // If invalid → just stay on login page
  } catch { /* network error — stay on login page */ }
}

// ── Flow 1: Telegram login ────────────────────────────────────
async function startTelegramLogin() {
  const btn = document.getElementById('tgLoginBtn');
  btn.disabled = true;
  showMsg('<span class="spin"></span>Connecting to server…', 'info');

  try {
    // 1. Create auth state on server
    const data = await serverFetch('POST', '/api/auth/login');
    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to start login');
    }

    authState = data.state;

    // 2. Open Telegram deep-link in a new tab
    chrome.tabs.create({ url: data.bot_url }, () => {});

    // 3. Start polling
    showMsg(
      '<span class="spin"></span>Waiting for Telegram auth… ' +
      '<br><small>Send <code>/start</code> to the bot if it didn\'t open.</small>',
      'info'
    );

    startPolling(authState, data.expires_in || 600);

  } catch (err) {
    showMsg('❌ ' + (err.message || 'Connection failed'), 'error');
    btn.disabled = false;
  }
}

function startPolling(state, expiresIn) {
  let elapsed = 0;
  const INTERVAL = 3000;

  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    elapsed += INTERVAL;
    if (elapsed > expiresIn * 1000) {
      clearInterval(pollTimer);
      showMsg('⏱ Login timed out. Please try again.', 'error');
      document.getElementById('tgLoginBtn').disabled = false;
      return;
    }

    try {
      const data = await serverFetch('POST', '/api/auth/poll', { state });
      if (!data) return;

      if (data.success && data.token) {
        clearInterval(pollTimer);
        storeAndRedirect(data.token, data.user || {});
      } else if (data.success === false) {
        clearInterval(pollTimer);
        showMsg('❌ ' + (data.error || 'Auth failed'), 'error');
        document.getElementById('tgLoginBtn').disabled = false;
      }
      // If data.pending === true → keep polling
    } catch { /* ignore transient network errors */ }
  }, INTERVAL);
}

// ── Flow 2: Manual token ──────────────────────────────────────
async function submitManualToken() {
  const input = document.getElementById('tokenInput');
  const token = input.value.trim();

  if (!token) {
    showMsg('Please paste your token.', 'error');
    return;
  }

  const btn = document.getElementById('tokenSubmit');
  btn.disabled = true;
  showMsg('<span class="spin"></span>Validating…', 'info');

  try {
    const data = await serverFetch('POST', '/api/auth/validate', null, token);
    if (data && data.success) {
      storeAndRedirect(token, data);
    } else {
      showMsg('❌ ' + (data?.error || 'Invalid token'), 'error');
      btn.disabled = false;
    }
  } catch (err) {
    showMsg('❌ ' + (err.message || 'Connection failed'), 'error');
    btn.disabled = false;
  }
}

// ── Store token + user info and open popup ────────────────────
function storeAndRedirect(token, user) {
  const saves = {
    kimtim_token:      token,
    kimtim_user_id:    user.user_id    || '',
    kimtim_first_name: user.first_name || '',
    kimtim_pfp_url:    user.pfp_url    || ''
  };
  chrome.storage.local.set(saves, () => {
    showMsg('✅ Logged in! Loading…', 'success');
    setTimeout(() => { window.location.href = 'popup.html'; }, 800);
  });
}

// ── Shared fetch helper ───────────────────────────────────────
async function serverFetch(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(API_BASE + path, { ...opts, signal: controller.signal });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  } finally {
    clearTimeout(tid);
  }
}

// ── UI helper ────────────────────────────────────────────────
function showMsg(html, type) {
  const el = document.getElementById('msg');
  el.innerHTML = html;
  el.className = 'msg show ' + type;
}
