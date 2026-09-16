'use strict';
const crypto = require('crypto');

// PROXY_ENCRYPTION_KEY must be exactly 64 hex chars (= 32 bytes)
// Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function getKey() {
  const raw = process.env.PROXY_ENCRYPTION_KEY || '';
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error('PROXY_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  }
  return key;
}

/**
 * Encrypt a plain-text string with AES-256-GCM.
 * @param {string} text
 * @returns {{ encrypted: string, iv: string, tag: string }}
 */
function encrypt(text) {
  const key = getKey();
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    encrypted: enc,
    iv:  iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt data previously encrypted with encrypt().
 * @param {string} encryptedHex
 * @param {string} ivHex
 * @param {string} tagHex
 * @returns {string}
 */
function decrypt(encryptedHex, ivHex, tagHex) {
  const key      = getKey();
  const iv       = Buffer.from(ivHex, 'hex');
  const tag      = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let dec = decipher.update(encryptedHex, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

module.exports = { encrypt, decrypt };
