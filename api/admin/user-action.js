'use strict';
// POST /api/admin/user-action   { user_id, action: 'ban'|'suspend'|'activate' }
// ─────────────────────────────────────────────────────────
// Changes a user's status and invalidates all their sessions
// if banning or suspending.
const { requireAdmin } = require('../../lib/adminAuth');
const { supabase }     = require('../../lib/supabase');
const { cors }         = require('../../lib/cors');

const VALID_ACTIONS = { ban: 'banned', suspend: 'suspended', activate: 'active' };

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, action } = req.body || {};
  if (!user_id)         return res.status(400).json({ success: false, error: 'Missing user_id' });
  if (!VALID_ACTIONS[action]) {
    return res.status(400).json({ success: false, error: 'action must be ban | suspend | activate' });
  }

  const newStatus = VALID_ACTIONS[action];

  try {
    // Update user status
    const { data: user, error: uErr } = await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', user_id)
      .select('id, username, first_name, status')
      .single();

    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Revoke all sessions if banning or suspending
    if (newStatus !== 'active') {
      await supabase
        .from('sessions')
        .update({ is_valid: false })
        .eq('user_id', user_id);
    }

    return res.json({
      success: true,
      user_id,
      new_status: newStatus,
      message: `User ${user.first_name || user.username || user_id} has been ${newStatus}.`
    });
  } catch (err) {
    console.error('[admin/user-action]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
