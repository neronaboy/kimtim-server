(function () {
  'use strict';

  window.__kimtim_STORAGE_LOADED = true;

  // ============= CENTRALIZED KEY DEFINITIONS =============
  // Single source of truth for ALL storage key names.
  // Every file MUST reference these constants instead of hardcoded strings.
  var K = {
    TOKEN: 'kimtim_token',
    USER_ID: 'kimtim_user_id',
    FIRST_NAME: 'kimtim_first_name',
    SAVED_BINS: 'kimtim_saved_bins',
    SAVED_ID: 'kimtim_saved_id',
    CUSTOM_NAME: 'kimtim_custom_name',
    CUSTOM_EMAIL: 'kimtim_custom_email',
    BG_COLOR: 'kimtim_bg_color',
    HAS_CUSTOM_COLOR: 'kimtim_has_custom_color',
    BG_ENABLED: 'kimtim_bg_enabled',
    PAGE_BG_COLOR: 'kimtim_page_bg_color',
    PAGE_HAS_CUSTOM: 'kimtim_page_has_custom_color',
    TOGGLE_HIT_SOUND: 'kimtim_toggle_hit_sound',
    TOGGLE_AUTO_SS: 'kimtim_toggle_auto_ss',
    TOGGLE_TG_FORWARD: 'kimtim_toggle_tg_forward',
    TG_BOT_TOKEN: 'kimtim_tg_bot_token',
    TG_CHAT_ID: 'kimtim_tg_chat_id',
    LOGS: 'kimtim_logs',
    LOGS_CLEARED_AT: 'kimtim_logs_cleared_at',
    PROXY_ENABLED: 'kimtim_proxy_enabled',
    PROXY_STRING: 'kimtim_proxy_string',
    PROXY_INFO: 'kimtim_proxy_info',
    PROXY_LIST: 'kimtim_proxy_list',
    PROXY_ROTATE: 'kimtim_proxy_rotate',
    MUSIC_NAME: 'kimtim_music_name',
    MUSIC_DATA: 'kimtim_music_data',
    LAST_SEEN_BIN_TIME: 'kimtim_last_seen_bin_time',
    CARD_HISTORY: 'kimtim_card_history',
  };

  // Expose globally so page-context scripts can use it
  window.kimtimKeys = K;

  window.kimtimStorage = window.kimtimStorage || {};
  var kimtimStorage = window.kimtimStorage;

  // ============= MIGRATION: old keys -> new keys =============
  // Maps old key names to the new unified key name. Run once on first load.
  var MIGRATION_MAP = {
    // User session (3 old variants -> 1 new)
    'kimtimUserToken': K.TOKEN,
    'kimtim_token': K.TOKEN,
    'kimtimUserId': K.USER_ID,
    'kimtim_userId': K.USER_ID,
    'cardGenerator_ID': K.USER_ID,
    'kimtimUserFirstName': K.FIRST_NAME,
    'kimtim_firstName': K.FIRST_NAME,
    'kimtim_userFirstName': K.FIRST_NAME,
    // BINs
    'kimtimSavedBINs': K.SAVED_BINS,
    'cardGenerator_BINs': K.SAVED_BINS,
    // Settings
    'kimtimSavedId': K.SAVED_ID,
    'kimtimCustomName': K.CUSTOM_NAME,
    'kimtim_customName': K.CUSTOM_NAME,
    'kimtimCustomEmail': K.CUSTOM_EMAIL,
    'kimtim_customEmail': K.CUSTOM_EMAIL,
    'kimtimBackgroundColor': K.BG_COLOR,
    'kimtimUserHasSetColor': K.HAS_CUSTOM_COLOR,
    'kimtim_bgColorEnabled': K.BG_ENABLED,
    'kimtim_pageBgColor': K.PAGE_BG_COLOR,
    'kimtim_hasCustomColor': K.PAGE_HAS_CUSTOM,
    // Toggles
    'kimtimToggle_hitSound': K.TOGGLE_HIT_SOUND,
    'hitSoundEnabled': K.TOGGLE_HIT_SOUND,
    'kimtimToggle_autoSS': K.TOGGLE_AUTO_SS,
    'autoSSEnabled': K.TOGGLE_AUTO_SS,
    'kimtimToggle_tgForward': K.TOGGLE_TG_FORWARD,
    'tgForwardEnabled': K.TOGGLE_TG_FORWARD,
    'kimtim_tgForward': K.TOGGLE_TG_FORWARD,
    'kimtimTelegramBotToken': K.TG_BOT_TOKEN,
    'kimtim_telegram_bot_token': K.TG_BOT_TOKEN,
    'kimtimTelegramChatId': K.TG_CHAT_ID,
    'kimtim_telegram_chat_id': K.TG_CHAT_ID,
    // Misc
    'kimtim_logs': K.LOGS,
    'kimtim_logsClearedAt': K.LOGS_CLEARED_AT,
    'kimtim_proxyEnabled': K.PROXY_ENABLED,
    'kimtim_proxyString': K.PROXY_STRING,
    'kimtim_proxyInfo': K.PROXY_INFO,
    'kimtim_customMusicName': K.MUSIC_NAME,
    'kimtimCustomMusicData': K.MUSIC_DATA,
    'kimtim_lastSeenBinTime': K.LAST_SEEN_BIN_TIME,
    'kimtimCardHistory': K.CARD_HISTORY,
    'kimtimProxyString': K.PROXY_STRING,
    'kimtimProxyEnabled': K.PROXY_ENABLED,
  };

  // Generate unique request IDs
  var requestCounter = 0;
  var pendingRequests = new Map();

  function storageRequest(action, data) {
    data = data || {};
    return new Promise(function (resolve) {
      var requestId = 'storage_' + (++requestCounter) + '_' + Date.now();

      var handler = function (event) {
        if (event.data && event.data.type === 'kimtim_STORAGE_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          pendingRequests.delete(requestId);
          resolve(event.data.result);
        }
      };

      pendingRequests.set(requestId, handler);
      window.addEventListener('message', handler);

      window.postMessage({
        type: 'kimtim_STORAGE_REQUEST',
        requestId: requestId,
        action: action,
        data: data
      }, '*');

      // Timeout fallback
      setTimeout(function () {
        if (pendingRequests.has(requestId)) {
          window.removeEventListener('message', handler);
          pendingRequests.delete(requestId);
          resolve(null);
        }
      }, 3000);
    });
  }

  // ============= ONE-TIME MIGRATION =============
  // Reads all old keys, copies values to new keys, then deletes old keys.
  kimtimStorage.runMigration = function (callback) {
    var oldKeys = Object.keys(MIGRATION_MAP);
    storageRequest('GET', { keys: oldKeys }).then(function (result) {
      result = result || {};
      var toSet = {};
      var toRemove = [];

      for (var i = 0; i < oldKeys.length; i++) {
        var oldKey = oldKeys[i];
        var newKey = MIGRATION_MAP[oldKey];
        var val = result[oldKey];
        if (val !== undefined && val !== null && val !== '') {
          // Only set if the new key doesn't already have a value
          if (toSet[newKey] === undefined) {
            toSet[newKey] = val;
          }
          toRemove.push(oldKey);
        }
      }

      // Also migrate localStorage old keys
      var lsOldKeys = [
        'kimtim_token', 'kimtim_userId', 'kimtim_userFirstName',
        'kimtim_customName', 'kimtim_customEmail',
        'kimtim_tgForward', 'kimtim_logs', 'kimtim_logsClearedAt',
        'kimtim_proxyEnabled', 'kimtim_proxyString', 'kimtim_proxyInfo',
        'kimtim_customMusicName', 'kimtim_bgColorEnabled',
        'kimtim_pageBgColor', 'kimtim_hasCustomColor',
        'kimtim_lastSeenBinTime',
        'cardGenerator_BINs', 'cardGenerator_BIN', 'cardGenerator_ID'
      ];
      for (var j = 0; j < lsOldKeys.length; j++) {
        var lsOld = lsOldKeys[j];
        var lsNew = MIGRATION_MAP[lsOld];
        if (lsNew) {
          var lsVal = localStorage.getItem(lsOld);
          if (lsVal !== null) {
            localStorage.setItem(lsNew, lsVal);
            localStorage.removeItem(lsOld);
          }
        }
      }

      var hasData = Object.keys(toSet).length > 0;
      if (hasData) {
        storageRequest('SET', toSet).then(function () {
          if (toRemove.length > 0) {
            storageRequest('REMOVE', { keys: toRemove }).then(function () {
              if (callback) callback();
            });
          } else {
            if (callback) callback();
          }
        });
      } else {
        if (callback) callback();
      }
    });
  };

  // ============= RANDOM BACKGROUND =============

  var RANDOM_BG_COLORS = [
    "#1a1a2e", "#16213e", "#0f3460", "#1b262c", "#2c3e50",
    "#1f1f38", "#2d2d44", "#1e3a5f", "#2b2b52", "#1c1c3c"
  ];

  kimtimStorage.getRandomBgColor = function () {
    return RANDOM_BG_COLORS[Math.floor(Math.random() * RANDOM_BG_COLORS.length)];
  };

  // ============= SYNC STORAGE METHODS =============

  kimtimStorage.loadBackgroundColor = function (callback) {
    storageRequest('GET', { keys: [K.BG_COLOR, K.HAS_CUSTOM_COLOR] }).then(function (result) {
      result = result || {};
      var color = result[K.BG_COLOR] || kimtimStorage.getRandomBgColor();
      var userSet = result[K.HAS_CUSTOM_COLOR] || false;
      callback(color, userSet);
    });
  };

  kimtimStorage.saveBackgroundColor = function (color, userSet) {
    var data = {};
    data[K.BG_COLOR] = color;
    data[K.HAS_CUSTOM_COLOR] = userSet !== false;
    storageRequest('SET', data);
  };

  kimtimStorage.loadCustomNameEmail = function (callback) {
    storageRequest('GET', { keys: [K.CUSTOM_NAME, K.CUSTOM_EMAIL] }).then(function (result) {
      result = result || {};
      callback(result[K.CUSTOM_NAME] || '', result[K.CUSTOM_EMAIL] || '');
    });
  };

  kimtimStorage.saveCustomName = function (name) {
    var data = {};
    data[K.CUSTOM_NAME] = name;
    storageRequest('SET', data);
  };

  kimtimStorage.saveCustomEmail = function (email) {
    var data = {};
    data[K.CUSTOM_EMAIL] = email;
    storageRequest('SET', data);
  };

  kimtimStorage.loadCardHistory = function (callback) {
    storageRequest('GET', { keys: [K.CARD_HISTORY] }).then(function (result) {
      result = result || {};
      var history = result[K.CARD_HISTORY] || [];
      callback(Array.isArray(history) ? history : []);
    });
  };

  kimtimStorage.saveCardHistory = function (history) {
    var data = {};
    data[K.CARD_HISTORY] = history.slice(-100);
    storageRequest('SET', data);
  };

  kimtimStorage.addToCardHistory = function (entry, callback) {
    kimtimStorage.loadCardHistory(function (history) {
      history.push(entry);
      kimtimStorage.saveCardHistory(history);
      if (callback) callback(history);
    });
  };

  kimtimStorage.loadSavedBINs = function (callback) {
    storageRequest('GET', { keys: [K.SAVED_BINS] }).then(function (result) {
      result = result || {};
      var bins = result[K.SAVED_BINS] || [];
      callback(Array.isArray(bins) ? bins : []);
    });
  };

  kimtimStorage.saveBINs = function (bins) {
    var data = {};
    data[K.SAVED_BINS] = bins;
    storageRequest('SET', data);
  };

  kimtimStorage.loadToggleState = function (toggleType, callback) {
    // Map toggle type to unified key
    var keyMap = {
      'hitSound': K.TOGGLE_HIT_SOUND,
      'autoSS': K.TOGGLE_AUTO_SS,
      'tgForward': K.TOGGLE_TG_FORWARD
    };
    var key = keyMap[toggleType] || ('kimtim_toggle_' + toggleType);
    storageRequest('GET', { keys: [key] }).then(function (result) {
      result = result || {};
      callback(result[key] !== undefined ? result[key] : true);
    });
  };

  kimtimStorage.saveToggleState = function (toggleType, value) {
    var keyMap = {
      'hitSound': K.TOGGLE_HIT_SOUND,
      'autoSS': K.TOGGLE_AUTO_SS,
      'tgForward': K.TOGGLE_TG_FORWARD
    };
    var key = keyMap[toggleType] || ('kimtim_toggle_' + toggleType);
    var data = {};
    data[key] = value;
    storageRequest('SET', data);
  };

  kimtimStorage.loadUserSession = function (callback) {
    storageRequest('GET', { keys: [K.TOKEN, K.USER_ID, K.FIRST_NAME] }).then(function (result) {
      result = result || {};
      callback({
        token: result[K.TOKEN] || '',
        userId: result[K.USER_ID] || '',
        firstName: result[K.FIRST_NAME] || ''
      });
    });
  };

  kimtimStorage.saveUserSession = function (token, userId, firstName) {
    var data = {};
    data[K.TOKEN] = token;
    data[K.USER_ID] = userId;
    data[K.FIRST_NAME] = firstName;
    storageRequest('SET', data);
  };

  kimtimStorage.clearUserSession = function () {
    storageRequest('REMOVE', { keys: [K.TOKEN, K.USER_ID, K.FIRST_NAME] });
  };

  kimtimStorage.loadSavedId = function (callback) {
    storageRequest('GET', { keys: [K.SAVED_ID] }).then(function (result) {
      result = result || {};
      callback(result[K.SAVED_ID] || '');
    });
  };

  kimtimStorage.saveId = function (id) {
    var data = {};
    data[K.SAVED_ID] = id;
    storageRequest('SET', data);
  };

  // ============= ALL DATA SYNC =============

  kimtimStorage.loadAllData = function (callback) {
    var allKeys = [];
    var kNames = Object.keys(K);
    for (var i = 0; i < kNames.length; i++) {
      allKeys.push(K[kNames[i]]);
    }
    storageRequest('GET', { keys: allKeys }).then(function (result) {
      result = result || {};
      callback(result);
    });
  };

  // ============= PROXY STORAGE =============

  kimtimStorage.loadProxySettings = function (callback) {
    storageRequest('GET', { keys: [K.PROXY_STRING, K.PROXY_ENABLED] }).then(function (result) {
      result = result || {};
      callback({
        proxyString: result[K.PROXY_STRING] || '',
        proxyEnabled: result[K.PROXY_ENABLED] || false
      });
    });
  };

  kimtimStorage.saveProxySettings = function (proxyString, enabled) {
    var data = {};
    data[K.PROXY_STRING] = proxyString;
    data[K.PROXY_ENABLED] = enabled;
    storageRequest('SET', data);
  };

  // ============= AUTO-RUN MIGRATION ON LOAD =============
  // Runs once per session: migrates old keys to new unified keys.
  // Uses a flag in chrome.storage to avoid running repeatedly.
  (function autoMigrate() {
    storageRequest('GET', { keys: ['kimtim_migration_done'] }).then(function (result) {
      if (result && result.kimtim_migration_done) return; // already migrated
      kimtimStorage.runMigration(function () {
        storageRequest('SET', { kimtim_migration_done: true });
      });
    });
  })();

})();





