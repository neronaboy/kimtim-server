(function() {
  'use strict';

  window.__kimtim_AUTOFILL_LOADED = true;

  window.kimtimAutofill = window.kimtimAutofill || {};

  kimtimAutofill.CARD_FIELD_SELECTORS = [
    '#cardNumber', '[name="cardNumber"]', '[autocomplete="cc-number"]',
    '[data-elements-stable-field-name="cardNumber"]',
    'input[placeholder*="Card number"]', 'input[placeholder*="card number"]',
    'input[aria-label*="Card number"]', '[class*="CardNumberInput"] input',
    '[class*="cardNumber"] input', 'input[name="number"]',
    'input[id*="card-number"]', 'input[name*="card_number"]',
    'input[placeholder*="0000"]', 'input[placeholder*="1234"]'
  ];

  kimtimAutofill.EXPIRY_FIELD_SELECTORS = [
    '#cardExpiry', '[name="cardExpiry"]', '[autocomplete="cc-exp"]',
    '[data-elements-stable-field-name="cardExpiry"]',
    'input[placeholder*="MM / YY"]', 'input[placeholder*="MM/YY"]',
    'input[placeholder*="MM"]', 'input[aria-label*="expir"]',
    '[class*="CardExpiry"] input', '[class*="expiry"] input',
    'input[name="expiry"]', 'input[name="exp"]'
  ];

  kimtimAutofill.CVC_FIELD_SELECTORS = [
    '#cardCvc', '[name="cardCvc"]', '[autocomplete="cc-csc"]',
    '[data-elements-stable-field-name="cardCvc"]',
    'input[placeholder*="CVC"]', 'input[placeholder*="CVV"]',
    'input[aria-label*="CVC"]', 'input[aria-label*="CVV"]',
    'input[aria-label*="security code"]', 'input[aria-label*="Security code"]',
    '[class*="CardCvc"] input', '[class*="cvc"] input',
    'input[name="cvc"]', 'input[name="cvv"]'
  ];

  kimtimAutofill.NAME_FIELD_SELECTORS = [
    '#billingName', '[name="billingName"]', '[autocomplete="cc-name"]', '[autocomplete="name"]',
    'input[placeholder*="Name on card"]', 'input[placeholder*="name on card"]',
    'input[aria-label*="Name"]', '[class*="billingName"] input', 'input[name="name"]'
  ];

  kimtimAutofill.EMAIL_FIELD_SELECTORS = [
    'input[type="email"]', 'input[name*="email"]', 'input[autocomplete="email"]',
    'input[id*="email"]', 'input[placeholder*="email"]', 'input[placeholder*="Email"]',
    '[class*="email"] input', 'input[aria-label*="email"]'
  ];

  kimtimAutofill.ADDRESS_FIELD_SELECTORS = [
    '#billingAddressLine1', '[name="billingAddressLine1"]', '[autocomplete="address-line1"]'
  ];

  kimtimAutofill.CITY_FIELD_SELECTORS = [
    '#billingLocality', '[name="billingLocality"]', '[autocomplete="address-level2"]'
  ];

  kimtimAutofill.POSTAL_FIELD_SELECTORS = [
    '#billingPostalCode', '[name="billingPostalCode"]', '[autocomplete="postal-code"]'
  ];

  kimtimAutofill.COUNTRY_FIELD_SELECTORS = [
    '#billingCountry', '[name="billingCountry"]', '[autocomplete="country"]'
  ];

  kimtimAutofill.SUBMIT_BUTTON_SELECTORS = [
    '.SubmitButton', '[class*="SubmitButton"]', 'button[type="submit"]',
    '[data-testid*="submit"]', '[data-testid*="pay"]'
  ];

  kimtimAutofill.wait = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  kimtimAutofill.hasCardFields = function() {
    for (const selector of kimtimAutofill.CARD_FIELD_SELECTORS) {
      if (document.querySelector(selector)) return true;
    }
    if (document.querySelector('[class*="StripeElement"], [class*="CardElement"]')) {
      return true;
    }
    return false;
  };

  kimtimAutofill.hasSubmitButton = function() {
    for (const selector of kimtimAutofill.SUBMIT_BUTTON_SELECTORS) {
      try {
        if (document.querySelector(selector)) return true;
      } catch (e) {}
    }
    return false;
  };

  kimtimAutofill.findField = function(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (e) {}
    }
    return null;
  };

  kimtimAutofill.findAndClickField = async function(selectors, fieldName) {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element.click();
            element.focus?.();
            await kimtimAutofill.wait(50);
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  };

  kimtimAutofill.simulateInput = function(element, value) {
    if (!element) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

    if (element.tagName === "INPUT" && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else if (element.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  kimtimAutofill.simulateSelectChange = function(element, value) {
    if (!element) return;

    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  };

  kimtimAutofill.typeText = async function(text, delay = 10) {
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

      await kimtimAutofill.wait(delay);
    }
  };

  kimtimAutofill.pressTab = async function() {
    const tabDown = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true });
    const tabUp = new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true });
    document.activeElement?.dispatchEvent(tabDown);
    document.activeElement?.dispatchEvent(tabUp);
    await kimtimAutofill.wait(50);
  };

  kimtimAutofill.isInvoiceStripePage = function() {
    const url = window.location.href;
    return url.includes('invoice.stripe.com') || url.includes('/invoice/');
  };

  kimtimAutofill.isCheckoutStripePage = function() {
    const url = window.location.href;
    return url.includes('checkout.stripe.com');
  };

  kimtimAutofill.isPaymentPage = function() {
    const url = window.location.href;
    if (url.includes('checkout.stripe.com') || url.includes('invoice.stripe.com')) {
      return true;
    }
    if (kimtimAutofill.hasCardFields()) {
      return true;
    }
    if (document.querySelector('[class*="StripeElement"], [class*="PaymentElement"]')) {
      return true;
    }
    return false;
  };

  kimtimAutofill.simulateStripeElementsInput = async function(card, mm, yy, cvv) {

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

    let cardFieldFound = await kimtimAutofill.findAndClickField(cardNumberSelectors, 'card number');

    if (!cardFieldFound) {
      const stripeElements = document.querySelectorAll('[class*="StripeElement"], [class*="CardElement"], [class*="PaymentElement"]');
      for (const el of stripeElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 20) {
          el.click();
          await kimtimAutofill.wait(80);
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
          await kimtimAutofill.wait(50);
          cardFieldFound = true;
        }
      }
    }

    if (cardFieldFound) {
      await kimtimAutofill.typeText(card, 8);
      await kimtimAutofill.wait(80);

      await kimtimAutofill.pressTab();
      await kimtimAutofill.typeText(mm + yy, 8);
      await kimtimAutofill.wait(80);

      await kimtimAutofill.pressTab();
      await kimtimAutofill.typeText(cvv, 8);
      await kimtimAutofill.wait(80);
    }

  };

  kimtimAutofill.fillStripeElementsIframes = async function(card, mm, yy, cvv) {
    const iframes = document.querySelectorAll('iframe[name*="__privateStripeFrame"], iframe[title*="Secure"], iframe[src*="stripe"]');

    for (const iframe of iframes) {
      try {
        const rect = iframe.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          iframe.click();
          await kimtimAutofill.wait(30);
        }
      } catch (e) {
      }
    }

    const stripeInputWrappers = document.querySelectorAll('[class*="StripeElement"], [class*="CardElement"], [class*="PaymentElement"]');
    for (const wrapper of stripeInputWrappers) {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        wrapper.click();
        await kimtimAutofill.wait(30);
      }
    }

    if (kimtimAutofill.isInvoiceStripePage()) {
      await kimtimAutofill.simulateStripeElementsInput(card, mm, yy, cvv);
    }
  };

  kimtimAutofill.randomHumanNames = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
    "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth",
    "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Dorothy", "Kimberly", "Emily", "Donna", "Michelle",
    "Alex", "Chris", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Cameron"
  ];

  kimtimAutofill.getRandomName = function() {
    return kimtimAutofill.randomHumanNames[Math.floor(Math.random() * kimtimAutofill.randomHumanNames.length)];
  };

  kimtimAutofill.getRandomEmail = function() {
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
    const name = kimtimAutofill.randomHumanNames[Math.floor(Math.random() * kimtimAutofill.randomHumanNames.length)].toLowerCase();
    const randomNum = Math.floor(Math.random() * 9999);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return name + randomNum + "@" + domain;
  };

  kimtimAutofill.getRandomStreet = function() {
    const streets = ["Main Street", "Oak Road", "Park Avenue", "Maple Drive", "Cedar Lane", "Pine Street", "Lake Drive", "Forest Avenue"];
    const number = Math.floor(Math.random() * 999) + 1;
    return number + " " + streets[Math.floor(Math.random() * streets.length)];
  };

})();






