'use strict';
const crypto = require('crypto');

function getSecret() {
  const s = process.env.ADMIN_PASSWORD || '';
  if (!s) throw new Error('ADMIN_PASSWORD env var is not set');
  return s;
}

/** Issue a signed admin token valid for 24 hours. */
function createAdminToken() {
  const secret    = getSecret();
  const timestamp = Date.now().toString();
  const sig       = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${sig}`;
}

/** Returns true if token is valid and not expired. */
function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const secret = getSecret();
    const dot    = token.indexOf('.');
    if (dot === -1) return false;
    const timestamp = token.slice(0, dot);
    const sig       = token.slice(dot + 1);
    if (!timestamp || !sig) return false;

    // Expire after 24 h
    if (Date.now() - parseInt(timestamp, 10) > 86_400_000) return false;

    const expected = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
    const expBuf   = Buffer.from(expected, 'hex');
    const sigBuf   = Buffer.from(sig,      'hex');
    if (expBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expBuf, sigBuf);
  } catch { return false; }
}

/** Extract Bearer token from request headers. */
function extractAdminToken(req) {
  const auth = req.headers['authorization'] || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
}

/**
 * Verify admin token; if invalid, send 401 and return false.
 * Use as:  if (!requireAdmin(req, res)) return;
 */
function requireAdmin(req, res) {
  const token = extractAdminToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { createAdminToken, verifyAdminToken, requireAdmin };
