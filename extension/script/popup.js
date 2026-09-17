// ── AUTH GATE: send users without a token straight to login.html ──
(function () {
  try {
    chrome.storage.local.get(['kimtim_token'], function (data) {
      if (!data || !data.kimtim_token) {
        window.location.replace('login.html');
      }
    });
  } catch (e) { /* storage unavailable — continue to dashboard */ }
})();

// Authentication check - MUST run first
let authCheckDone = false;

function checkAuthentication() {
  // Always resolves true — initPopup() must always run.
  // Token validity is checked inside init() via apiFetch('validate');
  // blocking here causes a blank popup when no token is stored.
  return new Promise((resolve) => {
    authCheckDone = true;
    resolve(true);
  });
}

// Load popup unconditionally; auth state is reflected inside initPopup → init()
checkAuthentication().then(() => {

  function initPopup() {
    'use strict';

    var API_BASE = 'https://kimtim-server.vercel.app'; // live Vercel URL
    var STRIPE_ICON = 'https://i.ibb.co/fVP9Z2nW/Stripe-icon-square.jpg';

    var $ = function (id) { return document.getElementById(id); };
    var on = function (el, event, handler) {
      if (el && el.addEventListener) el.addEventListener(event, handler);
    };

    // Header
    var headerPfp = $('headerPfp');
    var headerDot = $('headerDot');

    // Help overlay
    var helpBtn = $('helpBtn');
    var helpOverlay = $('helpOverlay');
    var helpCloseBtn = $('helpCloseBtn');
    var ipCheckBtn = $('ipCheckBtn');
    var ipCheckOverlay = $('ipCheckOverlay');
    var ipCheckCloseBtn = $('ipCheckCloseBtn');
    var ipCheckRefreshBtn = $('ipCheckRefreshBtn');
    var ipCheckSettingsBtn = $('ipCheckSettingsBtn');
    var ipCheckToggleIpBtn = $('ipCheckToggleIpBtn');
    var ipCheckIp = $('ipCheckIp');
    var ipCheckSource = $('ipCheckSource');
    var ipCheckBadge = $('ipCheckBadge');
    var ipCheckScoreText = $('ipCheckScoreText');
    var ipCheckScorebar = $('ipCheckScorebar');
    var ipCheckFlag = $('ipCheckFlag');
    var ipCheckCountry = $('ipCheckCountry');
    var ipCheckState = $('ipCheckState');
    var ipCheckCity = $('ipCheckCity');
    var ipCheckIsp = $('ipCheckIsp');
    var ipCheckFoot = $('ipCheckFoot');
    var tgConfigBtn = $('tgConfigBtn');
    var tgConfigOverlay = $('tgConfigOverlay');
    var tgConfigCloseBtn = $('tgConfigCloseBtn');
    var tgBotTokenInput = $('tgBotTokenInput');
    var tgChatIdInput = $('tgChatIdInput');
    var tgConfigStatus = $('tgConfigStatus');
    var tgConfigTestBtn = $('tgConfigTestBtn');
    var tgConfigSaveBtn = $('tgConfigSaveBtn');
    var IP_CHECK_STORAGE_KEY = 'kimtim_ipcheck_endpoint';
    var TG_BOT_TOKEN_KEY = 'kimtim_tg_bot_token';
    var TG_CHAT_ID_KEY = 'kimtim_tg_chat_id';
    var DEFAULT_IP_LOOKUP = 'https://api.ipify.org?format=json';
    var DEFAULT_IP_INTEL = 'https://api.ipapi.is/?q=';
    var ipCheckEndpoint = '';
    var ipCheckLoadedOnce = false;
    var ipCheckIpVisible = false;

    function setTgConfigStatus(message, type) {
      if (!tgConfigStatus) return;
      tgConfigStatus.textContent = message || '';
      tgConfigStatus.className = 'tgcfg-status' + (type ? ' ' + type : '');
    }

    function loadTelegramConfig() {
      chrome.storage.local.get([TG_BOT_TOKEN_KEY, TG_CHAT_ID_KEY], function (data) {
        if (tgBotTokenInput) tgBotTokenInput.value = data[TG_BOT_TOKEN_KEY] || '';
        if (tgChatIdInput) tgChatIdInput.value = data[TG_CHAT_ID_KEY] || '';
      });
    }

    function getTelegramConfigInput() {
      return {
        botToken: tgBotTokenInput ? tgBotTokenInput.value.trim() : '',
        chatId: tgChatIdInput ? tgChatIdInput.value.trim() : ''
      };
    }

    function setTelegramButtonsDisabled(disabled) {
      if (tgConfigTestBtn) tgConfigTestBtn.disabled = disabled;
      if (tgConfigSaveBtn) tgConfigSaveBtn.disabled = disabled;
    }

    on(helpBtn, 'click', function () { if (helpOverlay) helpOverlay.classList.add('active'); });
    on(helpCloseBtn, 'click', function () { if (helpOverlay) helpOverlay.classList.remove('active'); });
    on(helpOverlay, 'click', function (e) {
      if (e.target === helpOverlay) helpOverlay.classList.remove('active');
    });

    if (tgConfigBtn && tgConfigOverlay) {
      tgConfigBtn.addEventListener('click', function () {
        tgConfigOverlay.classList.add('active');
        setTgConfigStatus('');
        loadTelegramConfig();
      });
    }
    if (tgConfigCloseBtn && tgConfigOverlay) {
      tgConfigCloseBtn.addEventListener('click', function () {
        tgConfigOverlay.classList.remove('active');
      });
      tgConfigOverlay.addEventListener('click', function (e) {
        if (e.target === tgConfigOverlay) tgConfigOverlay.classList.remove('active');
      });
    }
    if (tgConfigSaveBtn) {
      tgConfigSaveBtn.addEventListener('click', function () {
        var config = getTelegramConfigInput();

        if (!config.botToken && !config.chatId) {
          chrome.storage.local.remove([TG_BOT_TOKEN_KEY, TG_CHAT_ID_KEY], function () {
            setTgConfigStatus('Custom Telegram config cleared.', 'success');
          });
          return;
        }

        if (!config.botToken || !config.chatId) {
          setTgConfigStatus('Enter both Bot Token and Chat ID before saving.', 'error');
          return;
        }

        var payload = {};
        payload[TG_BOT_TOKEN_KEY] = config.botToken;
        payload[TG_CHAT_ID_KEY] = config.chatId;

        chrome.storage.local.set(payload, function () {
          setTgConfigStatus('Telegram config saved.', 'success');
        });
      });
    }
    if (tgConfigTestBtn) {
      tgConfigTestBtn.addEventListener('click', function () {
        var config = getTelegramConfigInput();

        if (!config.botToken || !config.chatId) {
          setTgConfigStatus('Enter both Bot Token and Chat ID before testing.', 'error');
          return;
        }

        setTelegramButtonsDisabled(true);
        setTgConfigStatus('Sending test message...', '');

        chrome.runtime.sendMessage({
          type: 'TEST_TELEGRAM_CONFIG',
          payload: config
        }, function (response) {
          setTelegramButtonsDisabled(false);

          if (chrome.runtime.lastError) {
            setTgConfigStatus(chrome.runtime.lastError.message || 'Test failed.', 'error');
            return;
          }

          if (response && response.success) {
            setTgConfigStatus('Test message sent successfully.', 'success');
          } else {
            setTgConfigStatus((response && response.error) || 'Telegram test failed.', 'error');
          }
        });
      });
    }

    on(ipCheckBtn, 'click', function () {
      if (ipCheckOverlay) ipCheckOverlay.classList.add('active');
      if (!ipCheckLoadedOnce) loadIpFraudCheck();
    });
    on(ipCheckCloseBtn, 'click', function () { if (ipCheckOverlay) ipCheckOverlay.classList.remove('active'); });
    on(ipCheckOverlay, 'click', function (e) {
      if (e.target === ipCheckOverlay) ipCheckOverlay.classList.remove('active');
    });
    on(ipCheckRefreshBtn, 'click', function () { loadIpFraudCheck(true); });
    on(ipCheckToggleIpBtn, 'click', function () {
      ipCheckIpVisible = !ipCheckIpVisible;
      if (ipCheckIp) ipCheckIp.classList.toggle('blurred', !ipCheckIpVisible);
      if (ipCheckToggleIpBtn) ipCheckToggleIpBtn.title = ipCheckIpVisible ? 'Hide IP' : 'Show IP';
    });
    on(ipCheckSettingsBtn, 'click', function () {
      var next = window.prompt(
        'Enter your Express/API endpoint for IP fraud checks.\nUse {ip} if your route expects inline replacement.\nLeave blank to use built-in direct lookup.',
        ipCheckEndpoint || ''
      );

      if (next === null) return;
      ipCheckEndpoint = next.trim();

      var save = {};
      save[IP_CHECK_STORAGE_KEY] = ipCheckEndpoint;
      chrome.storage.local.set(save, function () {
        loadIpFraudCheck(true);
      });
    });

    // BIN Library overlay
    var binLibBtn = $('binLibBtn');
    var binLibOverlay = $('binLibOverlay');
    var binLibCloseBtn = $('binLibCloseBtn');
    var binLibBody = $('binLibBody');
    var binLibFilterAll = $('binLibFilterAll');
    var binLibFilterTop = $('binLibFilterTop');
    var binLibData = [];
    var binLibFilter = 'all';
    var binLibCount = $('binLibCount');

    on(binLibBtn, 'click', function () {
      if (binLibOverlay) binLibOverlay.classList.add('active');
      loadBinLibrary();
    });
    on(binLibCloseBtn, 'click', function () { if (binLibOverlay) binLibOverlay.classList.remove('active'); });
    on(binLibOverlay, 'click', function (e) {
      if (e.target === binLibOverlay) binLibOverlay.classList.remove('active');
    });

    on(binLibFilterAll, 'click', function () {
      binLibFilter = 'all';
      binLibFilterAll.classList.add('active');
      binLibFilterTop.classList.remove('active');
      renderBinLib();
    });
    on(binLibFilterTop, 'click', function () {
      binLibFilter = 'top';
      binLibFilterTop.classList.add('active');
      binLibFilterAll.classList.remove('active');
      renderBinLib();
    });

    function loadBinLibrary() {
      binLibBody.innerHTML = '<div class="binlib-empty"><div class="binlib-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>Loading BIN data...</div>';
      binLibCount.textContent = '--';
      apiFetch('bin-library', {}).then(function (res) {
        if (res.success && res.bins && res.bins.length > 0) {
          binLibData = res.bins;
          binLibCount.textContent = res.bins.length;
          renderBinLib();
        } else {
          binLibCount.textContent = '0';
          binLibBody.innerHTML = '<div class="binlib-empty"><div class="binlib-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>No BINs in library<br><span class="binlib-empty-sub">BINs are added via the Telegram bot</span></div>';
        }
      });
    }

    function renderBinLib() {
      var bins = binLibData.slice();
      if (binLibFilter === 'top') {
        bins.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
      } else {
        bins.sort(function (a, b) {
          var da = a.added_at ? new Date(a.added_at).getTime() : 0;
          var db = b.added_at ? new Date(b.added_at).getTime() : 0;
          return db - da;
        });
      }

      var html = '';
      bins.forEach(function (item, i) {
        var uploadDate = '--';
        if (item.added_at) {
          var d = new Date(item.added_at);
          if (!isNaN(d)) {
            var day = String(d.getDate()).padStart(2, '0');
            var mo = String(d.getMonth() + 1).padStart(2, '0');
            var yr = String(d.getFullYear()).slice(-2);
            var hrs = d.getHours();
            var ampm = hrs >= 12 ? 'pm' : 'am';
            hrs = hrs % 12 || 12;
            var mins = String(d.getMinutes()).padStart(2, '0');
            uploadDate = day + '|' + mo + '|' + yr + ' ' + hrs + ':' + mins + ampm;
          }
        }

        var credit = item.credit || 'N/A';
        if (credit.charAt(0) === '@') credit = credit.substring(1);

        var likes = item.likes || 0;
        var dislikes = item.dislikes || 0;

        html +=
          '<div class="binlib-card">' +
          '<div class="binlib-row">' +
          '<span class="binlib-lbl">Site:</span>' +
          '<span class="binlib-val">' + escHtml(item.site || 'N/A') + '</span>' +
          '</div>' +
          '<div class="binlib-row">' +
          '<span class="binlib-lbl">Bin:</span>' +
          '<span class="binlib-val binlib-val--bin">' + escHtml(item.bin || 'N/A') + '</span>' +
          '</div>' +
          '<div class="binlib-row">' +
          '<span class="binlib-lbl">C/r:</span>' +
          '<span class="binlib-val binlib-val--credit">@' + escHtml(credit) + '</span>' +
          '</div>' +
          '<hr class="binlib-sep">' +
          '<div class="binlib-foot">' +
          '<span class="binlib-foot-date">Uploaded on: ' + escHtml(uploadDate) + '</span>' +
          '<span class="binlib-foot-counts">' +
          '<span class="binlib-fc-like"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>' + likes + '</span>' +
          '<span class="binlib-fc-sep">|</span>' +
          '<span class="binlib-fc-dislike"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>' + dislikes + '</span>' +
          '</span>' +
          '</div>' +
          '</div>';
      });

      binLibBody.innerHTML = html;
    }

    // Dashboard (new ucard)
    var dashPfp = $('dashPfp');
    var dashName = $('dashName');
    var dashHits = $('dashHits');
    var dashGlobal = $('dashGlobal');
    var ucardToggle = $('ucardToggle');
    var ucardDetails = $('ucardDetails');
    var ucardIp = $('ucardIp');
    var ucardIpDot = $('ucardIpDot');
    var chipLicenseDot = $('chipLicenseDot');
    var chipLicense = $('chipLicense');
    var chipProxyDot = $('chipProxyDot');
    var chipProxy = $('chipProxy');
    var chipVersion = $('chipVersion');
    var versionBadge = $('versionBadge');
    var dashAttempts = $('dashAttempts');
    var dashRate = $('dashRate');

    // History
    var historyList = $('historyList');

    // Statistics
    var statUsers = $('statUsers');
    var statHits = $('statHits');
    var statToday = $('statToday');
    var statWeek = $('statWeek');
    var leaderboardList = $('leaderboardList');

    // Proxy
    var proxyTabBtn = $('proxyTabBtn');
    var proxyIcon = $('proxyIcon');
    var proxyStatusText = $('proxyStatusText');
    var proxyHostDisplay = $('proxyHostDisplay');
    var proxyMode = $('proxyMode');
    var proxyPort = $('proxyPort');
    var clearProxyBtn = $('clearProxyBtn');

    var token = '';
    var userId = '';
    var historyLoaded = false;
    var statsLoaded = false;
    var proxyIsSet = false;
    var localHitsCache = 0;
    var localAttemptsCache = 0;
    var currentUserName  = '';
    var currentUserPfp   = '';
    var currentUserUname = '';

    function applyLocalStats(data) {
      var hits = Number(data && data.kim_local_hits) || 0;
      var attempts = Number(data && data.kim_local_attempts) || 0;

      localHitsCache = hits;
      localAttemptsCache = attempts;

      if (dashHits) dashHits.textContent = hits;
      if (dashAttempts) dashAttempts.textContent = attempts;
      if (dashRate) dashRate.textContent = attempts > 0 ? Math.round((hits / attempts) * 100) + '%' : '0%';
      if (statsFooterHits) statsFooterHits.textContent = hits;
    }

    function refreshLocalStats(callback) {
      chrome.storage.local.get(['kim_local_hits', 'kim_local_attempts'], function (data) {
        applyLocalStats(data || {});
        if (typeof callback === 'function') callback(data || {});
      });
    }

    // â”€â”€ Tab switching â”€â”€
    var tabBtns = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.dataset.tab;
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('panel-' + tab).classList.add('active');
        if (tab === 'history') loadHistory();
        if (tab === 'statistics') { statsLoaded = false; loadStatistics(); }
      });
    });

    // â”€â”€ API helper â”€â”€
    // ── Server API fetch (Bearer-token auth) ──────────────────
    function apiFetch(action, params) {
      params = params || {};

      // Map old action names → new REST paths
      var METHOD = 'GET';
      var path;
      if (action === 'validate')     { path = '/api/auth/validate';  METHOD = 'POST'; }
      else if (action === 'stats' || action === 'popup-stats' || action === 'leaderboard') { path = '/api/stats'; }
      else if (action === 'bin-library')  { path = '/api/bins'; }
      else { path = '/api/' + action; }

      var headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      var opts = { method: METHOD, headers: headers };
      if (METHOD === 'POST') {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(params);
      }

      return fetch(API_BASE + path, opts)
        .then(function (r) { return r.json(); })
        .catch(function () { return { success: false }; });
    }

    // â”€â”€ PFP helper â”€â”€
    function setPfp(imgEl, fallbackEl, url, name) {
      if (url && url.length > 5) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          imgEl.src = url;
          imgEl.style.display = 'block';
          if (fallbackEl) fallbackEl.style.display = 'none';
        };
        img.onerror = function () {
          imgEl.style.display = 'none';
          if (fallbackEl) {
            fallbackEl.style.display = 'flex';
            fallbackEl.textContent = (name || '?').charAt(0).toUpperCase();
          }
        };
        img.src = url;
      } else {
        imgEl.style.display = 'none';
        if (fallbackEl) {
          fallbackEl.style.display = 'flex';
          fallbackEl.textContent = (name || '?').charAt(0).toUpperCase();
        }
      }
    }

    function timeAgo(ts) {
      if (!ts) return '--';
      var diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
      if (diff < 60) return diff + 's ago';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return Math.floor(diff / 86400) + 'd ago';
    }

    // Show full card: cc|mm|yy|cvv
    function formatCard(full) {
      if (!full) return '----';
      var parts = full.split('|');
      var cc = parts[0] || '----';
      var mm = parts[1] || '--';
      var yy = parts[2] || '--';
      var cvv = parts[3] || '---';
      return cc + '|' + mm + '|' + yy + '|' + cvv;
    }

    function escHtml(s) {
      if (!s) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escAttr(s) { return escHtml(s); }

    function setIpCheckLoading() {
      ipCheckIp.textContent = 'Loading...';
      ipCheckIp.classList.add('blurred');
      ipCheckBadge.textContent = '...';
      ipCheckBadge.className = 'ipcheck-badge low';
      ipCheckScoreText.textContent = 'Score: --/100';
      ipCheckSource.textContent = 'Checking current network...';
      ipCheckCountry.textContent = '--';
      ipCheckState.textContent = '--';
      ipCheckCity.textContent = '--';
      ipCheckIsp.textContent = '--';
      ipCheckFlag.textContent = '-';
      ipCheckFoot.textContent = 'Default mode uses a direct public IP intelligence lookup. You can point the gear icon to your own Express endpoint.';
      paintIpScore(0, 'low');
    }

    function clampScore(score) {
      score = parseInt(score, 10);
      if (isNaN(score)) score = 0;
      if (score < 0) score = 0;
      if (score > 100) score = 100;
      return score;
    }

    function getRiskClass(score) {
      score = clampScore(score);
      if (score >= 75) return 'very-high';
      if (score >= 50) return 'high';
      if (score >= 25) return 'medium';
      return 'low';
    }

    function getRiskLabel(score) {
      var riskClass = getRiskClass(score);
      if (riskClass === 'very-high') return 'VERY HIGH';
      if (riskClass === 'high') return 'HIGH';
      if (riskClass === 'medium') return 'MEDIUM';
      return 'LOW';
    }

    function paintIpScore(score, riskClass) {
      var bars = ipCheckScorebar ? ipCheckScorebar.querySelectorAll('span') : [];
      var activeBars = Math.max(1, Math.ceil(clampScore(score) / 10));
      bars.forEach(function (bar, index) {
        bar.className = index < activeBars ? 'active ' + riskClass : '';
      });
    }

    function flagEmoji(code) {
      if (!code || String(code).length !== 2) return '-';
      return String(code).toUpperCase().replace(/./g, function (c) {
        return String.fromCodePoint(127397 + c.charCodeAt(0));
      });
    }

    function buildEndpointUrl(endpoint, ip) {
      if (!endpoint) return '';
      if (endpoint.indexOf('{ip}') !== -1) return endpoint.replace(/\{ip\}/g, encodeURIComponent(ip));
      return endpoint + (endpoint.indexOf('?') === -1 ? '?ip=' : '&ip=') + encodeURIComponent(ip);
    }

    // scoreFromIpApi removed — scoring is now handled exclusively by background.js
    // (GET_IP_FRAUD_CHECK message) to eliminate the duplicate-drift bug.

    function normalizeFraudPayload(data, fallbackIp, sourceLabel) {
      var location = data.location || {};
      var company = data.company || {};
      var score = data.score;

      if (score == null && data.fraud_score != null) score = data.fraud_score;
      if (score == null && data.risk_score != null) score = data.risk_score;
      // When score is still null, clampScore defaults it to 0 safely.

      score = clampScore(score);

      return {
        ip: data.ip || data.query || fallbackIp || '--',
        score: score,
        risk: String(data.risk || data.risk_level || getRiskLabel(score)).toUpperCase(),
        country: data.country || location.country || '--',
        countryCode: data.country_code || location.country_code || '--',
        state: data.state || location.state || '--',
        city: data.city || location.city || '--',
        isp: data.isp || company.name || (data.connection && data.connection.isp) || '--',
        source: sourceLabel || data.source || 'Direct lookup',
        foot: data.message || data.notes || data.reason || '',
        flags: {
          proxy: !!data.is_proxy,
          vpn: !!data.is_vpn,
          tor: !!data.is_tor,
          datacenter: !!data.is_datacenter,
          abuser: !!data.is_abuser
        }
      };
    }

    function renderIpFraud(data) {
      var score = clampScore(data.score);
      var riskClass = getRiskClass(score);
      var riskLabel = getRiskLabel(score);
      var footBits = [];

      if (data.flags.proxy) footBits.push('Proxy');
      if (data.flags.vpn) footBits.push('VPN');
      if (data.flags.tor) footBits.push('Tor');
      if (data.flags.datacenter) footBits.push('Datacenter');
      if (data.flags.abuser) footBits.push('Abuser');

      ipCheckIp.textContent = data.ip || '--';
      ipCheckIp.classList.toggle('blurred', !ipCheckIpVisible);
      ipCheckBadge.textContent = riskLabel;
      ipCheckBadge.className = 'ipcheck-badge ' + riskClass;
      ipCheckScoreText.textContent = 'Score: ' + score + '/100';
      ipCheckSource.textContent = 'Source: ' + (data.source || 'Direct lookup');
      ipCheckCountry.textContent = data.country || '--';
      ipCheckState.textContent = data.state || '--';
      ipCheckCity.textContent = data.city || '--';
      ipCheckIsp.textContent = data.isp || '--';
      ipCheckFlag.textContent = flagEmoji(data.countryCode);
      ipCheckFoot.textContent = data.foot || (footBits.length ? 'Signals: ' + footBits.join(', ') : 'No elevated fraud indicators were returned for this IP.');
      paintIpScore(score, riskClass);
    }

    function renderIpFraudError(message) {
      ipCheckIp.textContent = 'Unavailable';
      ipCheckIp.classList.remove('blurred');
      ipCheckBadge.textContent = 'ERROR';
      ipCheckBadge.className = 'ipcheck-badge high';
      ipCheckScoreText.textContent = 'Score: --/100';
      ipCheckSource.textContent = 'Source: request failed';
      ipCheckCountry.textContent = '--';
      ipCheckState.textContent = '--';
      ipCheckCity.textContent = '--';
      ipCheckIsp.textContent = '--';
      ipCheckFlag.textContent = '-';
      ipCheckFoot.textContent = message || 'Unable to fetch IP fraud details.';
      paintIpScore(0, 'low');
    }

    function fetchCurrentIp() {
      return fetch(DEFAULT_IP_LOOKUP)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.ip) throw new Error('Missing IP address');
          return data.ip;
        });
    }

    function fetchFraudDirect(ip) {
      // Routes through the background service worker so scoring uses the single
      // scoreFromIpApi in background.js, eliminating the duplicate entirely.
      return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage(
          { type: 'GET_IP_FRAUD_CHECK', ip: ip, endpoint: '' },
          function (result) {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message || 'IP check failed'));
              return;
            }
            if (!result || !result.success) {
              reject(new Error((result && result.error) || 'IP check failed'));
              return;
            }
            resolve({
              ip: result.ip || ip,
              score: result.score || 0,
              risk: result.risk || 'LOW',
              country: result.country || '--',
              countryCode: result.country_code || '--',
              state: result.state || '--',
              city: result.city || '--',
              isp: result.isp || '--',
              source: result.source || 'background lookup',
              foot: result.notes || '',
              flags: {
                proxy: !!result.is_proxy,
                vpn: !!result.is_vpn,
                tor: !!result.is_tor,
                datacenter: !!result.is_datacenter,
                abuser: !!result.is_abuser
              }
            });
          }
        );
      });
    }

    function fetchFraudViaEndpoint(ip) {
      if (!ipCheckEndpoint) return Promise.reject(new Error('No custom endpoint set'));
      return fetch(buildEndpointUrl(ipCheckEndpoint, ip), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Custom endpoint returned ' + r.status);
          return r.json();
        })
        .then(function (data) {
          return normalizeFraudPayload(data, ip, 'custom endpoint');
        });
    }

    function loadIpFraudCheck(forceRefresh) {
      if (!forceRefresh && ipCheckLoadedOnce) return;
      ipCheckLoadedOnce = true;
      setIpCheckLoading();

      fetchCurrentIp()
        .then(function (ip) {
          return fetchFraudViaEndpoint(ip).catch(function () {
            return fetchFraudDirect(ip);
          });
        })
        .then(function (payload) {
          renderIpFraud(payload);
        })
        .catch(function (err) {
          renderIpFraudError(err && err.message ? err.message : 'Unable to fetch IP fraud details.');
        });
    }

    // â”€â”€ Set version from manifest â”€â”€
    (function setVersion() {
      var ver = 'v' + chrome.runtime.getManifest().version;
      if (versionBadge) versionBadge.textContent = ver;
      if (chipVersion) chipVersion.textContent = ver;
    })();

    // â”€â”€ Init â”€â”€
    function init() {
      chrome.storage.local.get([IP_CHECK_STORAGE_KEY], function (stored) {
        ipCheckEndpoint = stored && stored[IP_CHECK_STORAGE_KEY] ? stored[IP_CHECK_STORAGE_KEY] : '';
      });

      chrome.storage.local.get(
        ['kimtim_token', 'kimtim_user_id', 'kimtim_first_name', 'kimtim_pfp_url', 'kimtim_username', 'kim_local_hits', 'kim_local_attempts'],
        function (data) {
          token = data.kimtim_token || '';
          userId = data.kimtim_user_id || '';
          applyLocalStats(data);

          // Apply stored profile immediately (before API call)
          var storedName = data.kimtim_first_name || data.kimtim_username || '';
          var storedPfp  = data.kimtim_pfp_url || '';
          if (storedName) {
            currentUserName = storedName;
            if (dashName) dashName.textContent = storedName;
          }
          if (storedPfp) {
            currentUserPfp = storedPfp;
            if (dashPfp) {
              dashPfp.src = storedPfp;
              dashPfp.onerror = function () { dashPfp.src = 'icons/icon128.png'; };
            }
            if (headerPfp) {
              headerPfp.src = storedPfp;
              headerPfp.style.display = 'block';
              headerPfp.onerror = function () { headerPfp.style.display = 'none'; };
            }
          }

          if (token) {
            apiFetch('validate', {}).then(function (res) {
              if (res.success) {
                if (dashGlobal) dashGlobal.textContent = res.hits || 0;
                chipLicenseDot.className = 'status-dot green';
                chipLicense.textContent = 'Valid';
                headerDot.className = 'status-dot-header valid';

                // Update user profile from fresh API response
                var uName  = res.first_name || res.username || storedName;
                var uPfp   = res.pfp_url   || storedPfp;
                var uUname = res.username  || '';
                if (uName) {
                  currentUserName  = uName;
                  currentUserUname = uUname;
                  if (dashName) dashName.textContent = uName;
                }
                if (uPfp) {
                  currentUserPfp = uPfp;
                  if (dashPfp) {
                    dashPfp.src = uPfp;
                    dashPfp.onerror = function () { dashPfp.src = 'icons/icon128.png'; };
                  }
                  if (headerPfp) {
                    headerPfp.src = uPfp;
                    headerPfp.style.display = 'block';
                    headerPfp.onerror = function () { headerPfp.style.display = 'none'; };
                  }
                }
                // Persist fresh profile data for next load
                chrome.storage.local.set({
                  kimtim_first_name: res.first_name || '',
                  kimtim_username:   uUname,
                  kimtim_pfp_url:    uPfp
                });
              } else {
                chipLicenseDot.className = 'status-dot red';
                chipLicense.textContent = 'Invalid';
                headerDot.className = 'status-dot-header expired';
              }
            });
          }
          checkProxy();

          // Pre-load history and stats immediately so they are ready when tabs are clicked
          loadHistory();
          loadStatistics();
        }
      );
    }

    // â”€â”€ Auto-refresh dashboard every 10s â”€â”€
    function refreshDashboard() {
      refreshLocalStats();

      if (!token) return;
      apiFetch('validate', {}).then(function (res) {
        if (res.success) {
          if (dashGlobal) dashGlobal.textContent = res.hits || 0;
        }
      });
    }

    var refreshInterval = setInterval(refreshDashboard, 10000);

    // â”€â”€ Proxy â”€â”€
    function checkProxy() {
      if (chrome.proxy && chrome.proxy.settings) {
        chrome.proxy.settings.get({}, function (config) {
          if (config && config.value && config.value.mode === 'fixed_servers' && config.value.rules) {
            var proxy = config.value.rules.singleProxy;
            if (proxy && proxy.host) {
              proxyIsSet = true;
              // Show proxy tab
              if (proxyTabBtn) proxyTabBtn.classList.remove('hidden');

              proxyStatusText.textContent = 'Connected';
              proxyStatusText.className = 'proxy-status-text connected';
              proxyIcon.className = 'proxy-status-icon connected';
              proxyIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
              proxyHostDisplay.textContent = proxy.host + ':' + proxy.port;
              proxyHostDisplay.classList.add('visible');
              proxyMode.textContent = proxy.scheme ? proxy.scheme.toUpperCase() : 'HTTP';
              proxyPort.textContent = proxy.port || '--';

              chipProxyDot.className = 'status-dot green';
              chipProxy.textContent = proxy.host;
            } else {
              setProxyNotSet();
            }
          } else {
            setProxyNotSet();
          }
        });
      } else {
        chipProxyDot.className = 'status-dot red';
        chipProxy.textContent = 'N/A';
      }
    }

    function setProxyNotSet() {
      proxyIsSet = false;
      // Hide proxy tab
      if (proxyTabBtn) proxyTabBtn.classList.add('hidden');

      chipProxyDot.className = 'status-dot red';
      chipProxy.textContent = 'Not Set';
    }

    // â”€â”€ Clear proxy â”€â”€
    if (clearProxyBtn) clearProxyBtn.addEventListener('click', function () {
      clearProxyBtn.disabled = true;
      clearProxyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Clearing...';

      if (chrome.proxy && chrome.proxy.settings) {
        chrome.proxy.settings.clear({ scope: 'regular' }, function () {
          chrome.storage.local.remove(
            ['proxyAuth', 'kimtim_proxy_enabled', 'kimtim_proxy_string'],
            function () {
              if (chrome.tabs && chrome.tabs.query) {
                chrome.tabs.query({}, function (tabs) {
                  (tabs || []).forEach(function (tab) {
                    if (tab.id) {
                      try {
                        chrome.tabs.sendMessage(tab.id, { action: 'clearProxyStorage' }, function () {
                          if (chrome.runtime.lastError) { /* ignore */ }
                        });
                      } catch (e) { /* ignore */ }
                    }
                  });
                  resetClearBtn();
                  setProxyNotSet();
                  // Switch back to dashboard since proxy tab is now hidden
                  if (tabBtns.length > 0) tabBtns[0].click();
                });
              } else {
                resetClearBtn();
                setProxyNotSet();
                if (tabBtns.length > 0) tabBtns[0].click();
              }
            }
          );
        });
      } else {
        resetClearBtn();
      }
    });

    function resetClearBtn() {
      clearProxyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Clear Proxy';
      clearProxyBtn.disabled = false;
    }

    // â”€â”€ History â”€â”€
    var historyCount = $('historyCount');

    function loadHistory() {
      historyLoaded = true;
      if (!historyList) return;
      historyList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

      chrome.storage.local.get(['kim_local_history'], function (data) {
        try {
          var history = (data && data.kim_local_history) || [];
          if (history.length === 0) {
            historyList.innerHTML =
              '<div class="empty-state">' +
              '<div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>' +
              '<div class="empty-state-text">No hits recorded yet</div>' +
              '</div>';
            if (historyCount) historyCount.textContent = '0';
            return;
          }

          if (historyCount) historyCount.textContent = history.length + ' total';
          var html = '';
        history.forEach(function (hit, idx) {
          var card = formatCard(hit.card);
          var merchant = hit.site || 'Unknown';
          var timeStr = hit.time || '--';
          var bin = (hit.card && hit.card.split('|')[0]) ? hit.card.split('|')[0].substring(0, 6) : '';
          var rawAmt = hit.amount || '';
          var amountLabel = rawAmt === '0' || rawAmt === '0.00' ? 'Free Trial' : (rawAmt && rawAmt !== 'Free Trial' ? rawAmt + (hit.currency ? ' ' + hit.currency.toUpperCase() : '') : rawAmt);

          html +=
            '<div class="hit-item">' +
            '<div class="hit-item-icon"><img src="' + STRIPE_ICON + '" alt="Stripe"></div>' +
            '<div class="hit-item-body">' +
            '<div class="hit-item-card">' + escHtml(card) + '</div>' +
            '<div class="hit-item-merchant">' + escHtml(merchant) + (bin ? ' <span class="hit-item-bin">BIN ' + escHtml(bin) + '</span>' : '') + (amountLabel ? ' <span class="hit-item-bin" style="background:rgba(94,187,172,0.15);color:#0a6e5a;">' + escHtml(amountLabel) + '</span>' : '') + '</div>' +
            '</div>' +
            '<div class="hit-item-right">' +
            '<div class="hit-item-time">' + escHtml(timeStr) + '</div>' +
            '</div>' +
            '<button class="hit-item-copy" data-card="' + escAttr(card) + '" title="Copy card">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
            '</button>' +
            '</div>';
        });
          historyList.innerHTML = html;

          // Attach copy handlers
          historyList.querySelectorAll('.hit-item-copy').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var cardText = btn.getAttribute('data-card');
              navigator.clipboard.writeText(cardText).then(function () {
                btn.classList.add('copied');
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(function () {
                  btn.classList.remove('copied');
                  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                }, 1500);
              });
            });
          });
        } catch (e) {
          historyList.innerHTML = '<div class="empty-state"><div class="empty-state-text">No hits recorded yet</div></div>';
          if (historyCount) historyCount.textContent = '0';
        }
      });
    }

    // â”€â”€ Statistics â”€â”€
    var statsFooter = $('statsFooter');
    var statsFooterRank = $('statsFooterRank');
    var statsFooterName = $('statsFooterName');
    var statsFooterHits = $('statsFooterHits');

    function loadStatistics() {
      statsLoaded = true;

      // Load Personal Stats
      chrome.storage.local.get(['kim_local_history', 'kim_local_hits', 'kim_local_attempts'], function (data) {
        try {
          var history = (data && data.kim_local_history) || [];
          var hits = (data && data.kim_local_hits) || 0;
          var atts = (data && data.kim_local_attempts) || 0;

          // 24h Velocity
          var now = Date.now();
          var lastDayHits = history.filter(function(h) {
            var hTime = new Date(h.time).getTime();
            return (now - hTime) < 86400000;
          }).length;
          var velEl = $('statVelocity'); if (velEl) velEl.textContent = lastDayHits;

          // Top BIN
          var bins = {};
          history.forEach(function(h) {
            var bin = h.card ? h.card.substring(0, 6) : '----';
            bins[bin] = (bins[bin] || 0) + 1;
          });
          var topBin = '----'; var max = 0;
          for (var b in bins) { if (bins[b] > max) { max = bins[b]; topBin = b; } }
          var binEl = $('statTopBin'); if (binEl) binEl.textContent = topBin;

          // Time Saved (approx 3.5s per attempt)
          var secondsSaved = atts * 3.5;
          var savedEl = $('statSaved');
          if (savedEl) savedEl.textContent = secondsSaved < 60 ? Math.round(secondsSaved) + 's' : Math.round(secondsSaved / 60) + 'm';

          // Accuracy
          var accEl = $('statAccuracy'); if (accEl) accEl.textContent = atts > 0 ? Math.round((hits / atts) * 100) + '%' : '0%';
          if (statsFooterHits) statsFooterHits.textContent = hits;
        } catch(e) { /* never crash stats panel */ }
      });

      // Load Global Stats (new unified /api/stats endpoint)
      var statsP = apiFetch('stats', {});
      var lbP    = statsP; // stats and leaderboard come from the same response

      statsP.then(function (res) {
        if (res.success && res.stats) {
          statUsers.textContent = res.stats.total_users || 0;
          statHits.textContent  = res.stats.total_hits  || 0;
          statToday.textContent = res.stats.hits_today  || 0;
          statWeek.textContent  = res.stats.hits_week   || 0;
        }
      });

      lbP.then(function (res) {
        if (res.success && res.leaderboard) { res.leaderboard = res.leaderboard; }
        else { res = { success: false, leaderboard: [] }; }
        if (!res.success || !res.leaderboard || res.leaderboard.length === 0) {
          leaderboardList.innerHTML =
            '<div class="empty-state">' +
            '<div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div>' +
            '<div class="empty-state-text">No data yet</div>' +
            '</div>';
          return;
        }

        var html = '';
        var userRank = null;
        var userHits = 0;
        var userName = '';

        res.leaderboard.forEach(function (u, i) {
          var rank = i + 1;
          var name = u.first_name || u.username || 'Unknown';
          if (userId && String(u.user_id) === String(userId) && currentUserName) name = currentUserName;

          var uname = u.username ? '@' + u.username : '';
          var pfpUrl = u.pfp_url || '';
          var initial = name.charAt(0).toUpperCase();
          var rankClass = rank <= 3 ? 'rank-' + rank : 'rank-default';
          var isMe = userId && String(u.user_id) === String(userId);

          if (isMe) {
            userRank = rank;
            userHits = u.hits || 0;
            userName = name;
          }

          var pfpHtml;
          if (isMe) {
            var mePfpSrc = (currentUserPfp && currentUserPfp.length > 5) ? currentUserPfp : (pfpUrl && pfpUrl.length > 5 ? pfpUrl : 'icons/icon128.png');
            pfpHtml = '<img class="hitter-pfp" src="' + escAttr(mePfpSrc) + '" alt="" style="display:block;">';
          } else if (pfpUrl && pfpUrl.length > 5) {
            pfpHtml =
              '<img class="hitter-pfp" src="' + escAttr(pfpUrl) + '" alt="" style="display:block;">' +
              '<div class="hitter-pfp-fallback" style="display:none;">' + escHtml(initial) + '</div>';
          } else {
            pfpHtml = '<div class="hitter-pfp-fallback">' + escHtml(initial) + '</div>';
          }

          var meClass = isMe ? ' top-hitter--me' : '';

          html +=
            '<div class="top-hitter' + meClass + '">' +
            '<div class="rank-badge ' + rankClass + '">#' + rank + '</div>' +
            pfpHtml +
            '<div class="hitter-info">' +
            '<div class="hitter-name">' + escHtml(name) + (isMe ? ' <span style="font-size:8px;color:var(--accent);font-weight:700;">(You)</span>' : '') + '</div>' +
            '<div class="hitter-username">' + escHtml(uname) + '</div>' +
            '</div>' +
            '<div class="hitter-hits">' + (u.hits || 0) + '</div>' +
            '</div>';
        });

        leaderboardList.innerHTML = html;

        // Attach image error handlers (CSP-safe, no inline onerror)
        var pfpImgs = leaderboardList.querySelectorAll('.hitter-pfp');
        pfpImgs.forEach(function (img) {
          img.addEventListener('error', function () {
            if (img.src.includes('icons/icon128.png')) return; // Don't hide our logo
            img.style.display = 'none';
            var fallback = img.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
          });
        });

        // Show footer with user's place
        var myRank = res.my_rank || null;
        var footerRankNum = null;
        var footerName = '';
        var footerHits = localHitsCache;
        var footerPfp = '';

        if (userId) {
          footerName = currentUserName || 'User';
          footerPfp = (currentUserPfp && currentUserPfp.length > 5) ? currentUserPfp : 'icons/icon128.png';
        }

        if (myRank) {
          footerRankNum = myRank.rank;
        } else if (userRank !== null) {
          footerRankNum = userRank;
        }

        if (footerRankNum !== null) {
          statsFooterRank.textContent = '#' + footerRankNum;
          statsFooterRank.className = 'rank-badge ' + (footerRankNum <= 3 ? 'rank-' + footerRankNum : 'rank-default');

          var pfpWrap = $('statsFooterPfpWrap');
          var footerImgSrc = (currentUserPfp && currentUserPfp.length > 5) ? currentUserPfp : 'icons/icon128.png';
          if (pfpWrap) pfpWrap.innerHTML = '<img class="hitter-pfp" src="' + escAttr(footerImgSrc) + '" alt="" style="display:block;">';

          if (statsFooterName) statsFooterName.textContent = footerName;
          if (statsFooterHits) statsFooterHits.textContent = footerHits;
          if (statsFooter) statsFooter.style.display = 'flex';
        } else {
          if (statsFooter) statsFooter.style.display = 'none';
        }
      });
    }

    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;

      if (changes.kim_local_hits || changes.kim_local_attempts) {
        applyLocalStats({
          kim_local_hits: changes.kim_local_hits ? changes.kim_local_hits.newValue : localHitsCache,
          kim_local_attempts: changes.kim_local_attempts ? changes.kim_local_attempts.newValue : localAttemptsCache
        });
      }

      if (changes.kim_local_history) {
        historyLoaded = true;
        loadHistory();
      }

      if (changes.kim_local_history || changes.kim_local_hits || changes.kim_local_attempts) {
        statsLoaded = false;
        loadStatistics();
      }
    });

    init();
    //  User Card Toggle + IP 
    if (ucardToggle && ucardDetails) {
      ucardToggle.addEventListener('click', function () {
        var isOpen = ucardDetails.style.display !== 'none';
        ucardDetails.style.display = isOpen ? 'none' : 'block';
        ucardToggle.classList.toggle('open', !isOpen);
      });
    }

    // Fetch IP for ucard
    (function fetchUcardIp() {
      fetch('https://api.ipify.org?format=json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ip && ucardIp) {
            ucardIp.textContent = data.ip;
            ucardIp.classList.add('blurred');
            // Click to toggle blur
            ucardIp.style.cursor = 'pointer';
            ucardIp.addEventListener('click', function () {
              ucardIp.classList.toggle('blurred');
            });
          }
        })
        .catch(function () {
          if (ucardIp) ucardIp.textContent = 'Unavailable';
        });
    })();

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup, { once: true });
  } else {
    initPopup();
  }
});
