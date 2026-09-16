'use strict';
const crypto = require('crypto');

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN    || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';
const WH_SECRET    = process.env.TELEGRAM_WEBHOOK_SECRET || '';

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send an HTML-formatted Telegram message.
 */
async function sendMessage(chatId, text, extra = {}) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra
    })
  });
  return res.json().catch(() => null);
}

/**
 * Verify Telegram Login Widget callback data (hash check).
 * Returns true only if the data is authentic and ≤ 24 h old.
 */
function verifyTelegramAuth(authData) {
  const { hash, ...data } = authData;
  if (!hash || !data.auth_date) return false;

  // Must not be older than 24 hours
  if (Date.now() / 1000 - Number(data.auth_date) > 86400) return false;

  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('\n');

  const secretKey    = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return expectedHash === hash;
}

/** Deep-link URL that opens the bot with an auth-state parameter. */
function getBotUrl(startParam) {
  return `https://t.me/${BOT_USERNAME}?start=${startParam}`;
}

/**
 * Verify the X-Telegram-Bot-Api-Secret-Token header Telegram sends
 * with every webhook update.
 */
function verifyWebhookSecret(req) {
  return req.headers['x-telegram-bot-api-secret-token'] === WH_SECRET;
}

module.exports = { sendMessage, verifyTelegramAuth, getBotUrl, verifyWebhookSecret };
