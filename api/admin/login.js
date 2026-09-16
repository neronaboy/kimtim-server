'use strict';
// POST /api/admin/login   { password }
// ─────────────────────────────────────────────────────────
// Verifies the ADMIN_PASSWORD env var and returns a signed
// 24-hour admin token.  Uses constant-time comparison so
// timing attacks cannot leak password length.
// ─────────────────────────────────────────────────────────
const crypto                = require('crypto');
const { createAdminToken }  = require('../../lib/adminAuth');
const { cors }              = require('../../lib/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) {
    return res.status(500).json({ success: false, error: 'ADMIN_PASSWORD is not configured on the server' });
  }

  const provided = String((req.body && req.body.password) || '');

  // Constant-time compare (pads shorter buffer to avoid length leak)
  const a = Buffer.alloc(64); Buffer.from(adminPassword).copy(a);
  const b = Buffer.alloc(64); Buffer.from(provided).copy(b);
  const match = crypto.timingSafeEqual(a, b) && provided === adminPassword;

  if (!match) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  const token = createAdminToken();
  return res.json({ success: true, token });
};
