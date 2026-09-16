'use strict';
const { supabase } = require('./supabase');

/** Extract bearer token from Authorization header or ?token= query param. */
function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return (req.query && req.query.token) || null;
}

/**
 * Validate a bearer token and return the associated user row.
 * Returns null on failure.
 */
async function getAuthUser(token) {
  if (!token) return null;

  const { data: session, error } = await supabase
    .from('sessions')
    .select('user_id, is_valid, expires_at, users(*)')
    .eq('token', token)
    .eq('is_valid', true)
    .single();

  if (error || !session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  // Refresh last_seen timestamp (non-blocking)
  supabase
    .from('sessions')
    .update({ last_seen: new Date().toISOString() })
    .eq('token', token)
    .then(() => {})
    .catch(() => {});

  return session.users;
}

/**
 * Combined helper — extracts token AND resolves user.
 * Returns { token, user } where user may be null.
 */
async function requireAuth(req) {
  const token = extractToken(req);
  const user  = await getAuthUser(token);
  return { token, user };
}

module.exports = { extractToken, getAuthUser, requireAuth };
