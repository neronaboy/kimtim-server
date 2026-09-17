

(function () {
  'use strict';

  window.__kimtim_PROXY_LOADED = true;

  let proxyEnabled = false;
  let proxyString = "";
  let proxyList = [];
  let proxyAutoRotate = false;
  let proxyInfo = {
    ip: "",
    response_time_ms: 0,
    country_name: "",
    country_code: "",
    ip_type: ""
  };
  let proxyAutoLoadDone = false;

  function sendToBackground(payload) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      const handler = (event) => {
        if (event.data && event.data.type === "kimtim_FROM_BACKGROUND" && event.data.requestId === requestId) {
          window.removeEventListener("message", handler);
          resolve(event.data.response);
        }
      };
      window.addEventListener("message", handler);
      window.postMessage({ type: "kimtim_TO_BACKGROUND", requestId, payload }, "*");
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Background request timeout"));
      }, 60000);
    });
  }

  function stripSupportedProxyScheme(proxyStr) {
    const raw = (proxyStr || "").trim();
    if (!raw) return null;

    const schemeMatch = raw.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (!schemeMatch) {
      return raw;
    }

    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return null;
    }

    return raw.substring(schemeMatch[0].length);
  }

  function parseProxyFormat(proxyStr) {
    if (!proxyStr) return null;
    const stripped = stripSupportedProxyScheme(proxyStr);
    if (!stripped) return null;

    const result = { user: null, password: null, host: null, port: null, raw: proxyStr.trim() };

    try {
      if (stripped.includes('@')) {
        const atIndex = stripped.lastIndexOf('@');
        const authPart = stripped.substring(0, atIndex);
        const hostPart = stripped.substring(atIndex + 1);

        const firstColon = authPart.indexOf(':');
        if (firstColon <= 0) return null;

        result.user = authPart.substring(0, firstColon);
        result.password = authPart.substring(firstColon + 1);

        const lastColon = hostPart.lastIndexOf(':');
        if (lastColon <= 0) return null;

        result.host = hostPart.substring(0, lastColon).trim();
        result.port = parseInt(hostPart.substring(lastColon + 1), 10);
      } else {
        const parts = stripped.split(':');

        if (parts.length === 2) {
          result.host = parts[0].trim();
          result.port = parseInt(parts[1], 10);
        } else if (parts.length >= 4) {
          if (/^\d+$/.test(parts[1])) {
            result.host = parts[0].trim();
            result.port = parseInt(parts[1], 10);
            result.user = parts[2];
            result.password = parts.slice(3).join(':');
          } else {
            result.user = parts[0];
            result.password = parts.slice(1, -2).join(':');
            result.host = parts[parts.length - 2].trim();
            result.port = parseInt(parts[parts.length - 1], 10);
          }
        }
      }
    } catch (e) {
      return null;
    }

    if (!result.host || !result.port || isNaN(result.port) || result.port <= 0 || result.port > 65535) {
      return null;
    }

    return result;
  }

  function normalizeProxyString(proxyStr) {
    const parsed = parseProxyFormat(proxyStr);
    if (!parsed) return null;

    if (parsed.user) {
      return `${parsed.host}:${parsed.port}:${parsed.user}:${parsed.password || ""}`;
    }

    return `${parsed.host}:${parsed.port}`;
  }

  async function checkProxyLive(proxyStr) {
    if (!proxyStr || !proxyStr.trim()) {
      return { success: false, error: "Proxy string is empty" };
    }

    const normalizedProxy = normalizeProxyString(proxyStr);
    if (!normalizedProxy) {
      return { success: false, error: "Invalid proxy format. Use host:port, host:port:user:pass, or user:pass@host:port" };
    }

    // Always route through the background service worker.
    // Direct fetch from page context violates the CSP of payment pages (e.g. Stripe),
    // causing inject.js to crash and the dashboard to stop responding.
    try {
      return await sendToBackground({ type: "CHECK_PROXY_LIVE", proxy: normalizedProxy });
    } catch (e) {
      return {
        success: false,
        error: e && e.message ? e.message : "Proxy check failed"
      };
    }
  }

  async function checkProxyViaAPI(proxyStr) {
    try {
      const apiEndpoint = "https://kimtim.infinityfree.me/proxy_check.php";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ proxy: proxyStr }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          proxy_ip: data.proxy_ip || "",
          response_time_ms: data.response_time_ms || 0,
          country_name: data.country_name || "",
          country_code: data.country_code || "",
          ip_type: data.ip_type || "",
          types: data.types || ["HTTP"],
          proxy_host: data.proxy_host || "",
          proxy_port: data.proxy_port || ""
        };
      } else {
        return {
          success: false,
          error: data.error || "Proxy check failed"
        };
      }
    } catch (e) {
      return null;
    }
  }

  async function checkMultipleProxies(proxyStrList, progressCallback) {
    let liveProxies = [];
    for (const proxyStr of proxyStrList) {
      if (!proxyStr || !proxyStr.trim()) continue;
      const normalizedProxy = normalizeProxyString(proxyStr);
      if (!normalizedProxy) {
        if (progressCallback) progressCallback(proxyStr.trim(), false);
        continue;
      }
      let res = null;
      try {
        res = await checkProxyLive(normalizedProxy);
      } catch (e) {
        res = { success: false, error: e && e.message ? e.message : "Proxy check failed" };
      }
      if (res && res.success) {
        liveProxies.push({
          string: normalizedProxy,
          info: {
            ip: res.proxy_ip || "",
            response_time_ms: res.response_time_ms || 0,
            country_name: res.country_name || "",
            country_code: res.country_code || "",
            ip_type: res.ip_type || ""
          }
        });
      }
      if (progressCallback) progressCallback(normalizedProxy, res && res.success);
    }
    return liveProxies;
  }

  async function rotateToNextProxy(updateBottomIpBarFn) {
    if (!proxyAutoRotate || !proxyList || proxyList.length <= 1) return false;

    let currentIndex = proxyList.findIndex(p => p.string === proxyString);
    let nextIndex = (currentIndex + 1) % proxyList.length;
    let nextProxy = proxyList[nextIndex];

    if (!nextProxy || !nextProxy.string) return false;

    window.postMessage({ type: 'CLEAR_PROXY' }, '*');

    proxyString = nextProxy.string;
    proxyInfo = nextProxy.info;
    proxyEnabled = true;
    saveProxySettings();

    window.postMessage({ type: 'APPLY_PROXY', proxy: proxyString }, '*');

    if (updateBottomIpBarFn) updateBottomIpBarFn(proxyInfo.ip, true);

    return true;
  }

  function obfuscateProxy(proxyStr) {
    if (!proxyStr) return "Not set";
    const parsed = parseProxyFormat(proxyStr);
    if (!parsed) return "Invalid";

    let display = `${parsed.host}:${parsed.port}`;
    if (parsed.user) {
      display = `${parsed.user.substring(0, 3)}***@${display}`;
    }
    return display;
  }

  var K = window.kimtimKeys || {
    PROXY_ENABLED: 'kimtim_proxy_enabled',
    PROXY_STRING:  'kimtim_proxy_string',
    PROXY_INFO:    'kimtim_proxy_info',
    PROXY_LIST:    'kimtim_proxy_list',
    PROXY_ROTATE:  'kimtim_proxy_rotate'
  };

  function loadProxySettings() {
    proxyEnabled = localStorage.getItem(K.PROXY_ENABLED) === "true";
    proxyString = localStorage.getItem(K.PROXY_STRING) || "";
    proxyAutoRotate = localStorage.getItem(K.PROXY_ROTATE) === "true";
    const savedList = localStorage.getItem(K.PROXY_LIST);
    if (savedList) {
      try { proxyList = JSON.parse(savedList); } catch (e) { proxyList = []; }
    }
    const savedProxyInfo = localStorage.getItem(K.PROXY_INFO);
    if (savedProxyInfo) {
      try {
        proxyInfo = JSON.parse(savedProxyInfo);
      } catch (e) {
        proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" };
      }
    }
  }

  function saveProxySettings() {
    localStorage.setItem(K.PROXY_ENABLED, proxyEnabled ? "true" : "false");
    localStorage.setItem(K.PROXY_STRING, proxyString);
    localStorage.setItem(K.PROXY_INFO, JSON.stringify(proxyInfo));
    localStorage.setItem(K.PROXY_ROTATE, proxyAutoRotate ? "true" : "false");
    localStorage.setItem(K.PROXY_LIST, JSON.stringify(proxyList));

    var proxyData = {};
    proxyData[K.PROXY_ENABLED] = proxyEnabled;
    proxyData[K.PROXY_STRING] = proxyString;
    proxyData[K.PROXY_INFO] = proxyInfo;
    proxyData[K.PROXY_ROTATE] = proxyAutoRotate;
    proxyData[K.PROXY_LIST] = JSON.stringify(proxyList);
    window.postMessage({
      type: 'kimtim_STORAGE_REQUEST',
      requestId: 'proxy_' + Date.now(),
      action: 'SET',
      data: proxyData
    }, '*');

    // ── Sync to server (non-blocking) ────────────────────
    // When proxyEnabled is true and we have a proxy string, sync it to
    // the Vercel server so credentials are stored server-side encrypted.
    if (proxyEnabled && proxyString) {
      window.postMessage({
        type: 'SAVE_PROXY_TO_SERVER',
        proxy: proxyString,
        label: null
      }, '*');
    }
  }

  function clearSavedProxy(reason, showWarningFn, updateBottomIpBarFn, fetchRealIpFn) {
    const oldProxy = proxyString;
    proxyString = "";
    proxyEnabled = false;
    proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" };
    saveProxySettings();

    window.postMessage({ type: 'CLEAR_PROXY' }, '*');

    const proxyBtn = document.getElementById("proxyViewBtn");
    if (proxyBtn) {
      proxyBtn.textContent = "Set";
    }

    if (updateBottomIpBarFn) updateBottomIpBarFn("", false);
    if (fetchRealIpFn) fetchRealIpFn();

    const displayProxy = obfuscateProxy(oldProxy);
    if (showWarningFn) {
      showWarningFn(`🗑️ Saved proxy removed\n${displayProxy}\nReason: ${reason}`, "error");
    }
  }

  function clearSavedProxyQuiet(reason, updateBottomIpBarFn, fetchRealIpFn) {
    proxyString = "";
    proxyEnabled = false;
    proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" };
    saveProxySettings();

    window.postMessage({ type: 'CLEAR_PROXY' }, '*');

    const proxyBtn = document.getElementById("proxyViewBtn");
    if (proxyBtn) {
      proxyBtn.textContent = "Set";
    }

    if (updateBottomIpBarFn) updateBottomIpBarFn("", false);
    if (fetchRealIpFn) fetchRealIpFn();
  }

  async function autoLoadAndVerifyProxy(updateBottomIpBarFn, fetchRealIpFn) {
    if (proxyAutoLoadDone) return;
    proxyAutoLoadDone = true;

    // Step 1: Always clear proxy first on load
    window.postMessage({ type: 'CLEAR_PROXY' }, '*');

    // Load saved proxy settings
    loadProxySettings();

    // Step 2: If no saved proxy, just update UI and return
    if (!proxyString || !proxyEnabled) {
      if (updateBottomIpBarFn) updateBottomIpBarFn("", false);
      if (fetchRealIpFn) fetchRealIpFn();
      return;
    }

    const proxyStatus = document.getElementById("ipBarProxyStatus");
    if (proxyStatus) {
      proxyStatus.textContent = "• Checking...";
      proxyStatus.className = "ip-bar-value status-checking";
    }

    try {
      // Step 3: Check if saved proxy is live
      const checkResult = await checkProxyLive(proxyString);

      if (checkResult && checkResult.success === true) {
        // Step 4a: Proxy is LIVE - Apply it
        proxyInfo = {
          ip: checkResult.proxy_ip || "",
          response_time_ms: checkResult.response_time_ms || 0,
          country_name: checkResult.country_name || "",
          country_code: checkResult.country_code || "",
          ip_type: checkResult.ip_type || ""
        };
        saveProxySettings();

        window.postMessage({ type: 'APPLY_PROXY', proxy: proxyString }, '*');

        const applyResult = await new Promise((resolve) => {
          const handler = (event) => {
            if (event.data && event.data.type === 'PROXY_RESULT' && event.data.action === 'apply') {
              window.removeEventListener('message', handler);
              resolve(event.data);
            }
          };
          window.addEventListener('message', handler);
          setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve({ success: true });
          }, 10000);
        });

        const proxyBtn = document.getElementById("proxyViewBtn");
        if (proxyBtn) {
          proxyBtn.textContent = proxyString ? "View" : "Set";
        }

        if (updateBottomIpBarFn) updateBottomIpBarFn(checkResult.proxy_ip, true);
      } else {
        // Step 4b: Proxy is DEAD - Clear it
        window.postMessage({ type: 'CLEAR_PROXY' }, '*');
        clearSavedProxyQuiet(checkResult?.error || "Proxy connection failed", updateBottomIpBarFn, fetchRealIpFn);
      }
    } catch (e) {
      // On error - Clear proxy
      window.postMessage({ type: 'CLEAR_PROXY' }, '*');
      clearSavedProxyQuiet(e.message || "Proxy verification error", updateBottomIpBarFn, fetchRealIpFn);
    }
  }

  async function autoLoadAndVerifyProxySafe(updateBottomIpBarFn, fetchRealIpFn) {
    if (proxyAutoLoadDone) return;
    proxyAutoLoadDone = true;

    window.postMessage({ type: 'CLEAR_PROXY' }, '*');
    loadProxySettings();

    if (!proxyString || !proxyEnabled) {
      if (updateBottomIpBarFn) updateBottomIpBarFn("", false);
      if (fetchRealIpFn) fetchRealIpFn();
      return;
    }

    const proxyStatus = document.getElementById("ipBarProxyStatus");
    if (proxyStatus) {
      proxyStatus.textContent = "Checking...";
      proxyStatus.className = "ip-bar-value status-checking";
    }

    try {
      const checkResult = await checkProxyLive(proxyString);

      if (!checkResult || checkResult.success !== true) {
        window.postMessage({ type: 'CLEAR_PROXY' }, '*');
        clearSavedProxyQuiet(checkResult?.error || "Proxy connection failed", updateBottomIpBarFn, fetchRealIpFn);
        return;
      }

      proxyInfo = {
        ip: checkResult.proxy_ip || "",
        response_time_ms: checkResult.response_time_ms || 0,
        country_name: checkResult.country_name || "",
        country_code: checkResult.country_code || "",
        ip_type: checkResult.ip_type || ""
      };
      saveProxySettings();

      const applyResult = await new Promise((resolve) => {
        let settled = false;
        const handler = (event) => {
          if (event.data && event.data.type === 'PROXY_RESULT' && event.data.action === 'apply') {
            settled = true;
            window.removeEventListener('message', handler);
            resolve(event.data);
          }
        };

        window.addEventListener('message', handler);
        window.postMessage({ type: 'APPLY_PROXY', proxy: proxyString }, '*');

        setTimeout(() => {
          if (settled) return;
          window.removeEventListener('message', handler);
          resolve({ success: false, error: 'Proxy apply timed out' });
        }, 10000);
      });

      if (!applyResult || !applyResult.success) {
        window.postMessage({ type: 'CLEAR_PROXY' }, '*');
        clearSavedProxyQuiet(applyResult?.error || "Proxy apply failed", updateBottomIpBarFn, fetchRealIpFn);
        return;
      }

      const proxyBtn = document.getElementById("proxyViewBtn");
      if (proxyBtn) {
        proxyBtn.textContent = proxyString ? "View" : "Set";
      }

      if (updateBottomIpBarFn) updateBottomIpBarFn(checkResult.proxy_ip, true);
    } catch (e) {
      window.postMessage({ type: 'CLEAR_PROXY' }, '*');
      clearSavedProxyQuiet(e.message || "Proxy verification error", updateBottomIpBarFn, fetchRealIpFn);
    }
  }

  loadProxySettings();

  window.kimtimProxy = {

    get enabled() { return proxyEnabled; },
    set enabled(val) { proxyEnabled = val; },
    get string() { return proxyString; },
    set string(val) { proxyString = val; },
    get info() { return proxyInfo; },
    set info(val) { proxyInfo = val; },
    get list() { return proxyList; },
    set list(val) { proxyList = val; },
    get autoRotate() { return proxyAutoRotate; },
    set autoRotate(val) { proxyAutoRotate = val; },

    checkProxyLive,
    checkMultipleProxies,
    rotateToNextProxy,
    checkProxyViaAPI,
    parseProxyFormat,
    normalizeProxyString,
    obfuscateProxy,
    loadProxySettings,
    saveProxySettings,
    clearSavedProxy,
    clearSavedProxyQuiet,
    autoLoadAndVerifyProxy: autoLoadAndVerifyProxySafe
  };

})();



