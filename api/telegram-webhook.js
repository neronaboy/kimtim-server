'use strict';
// POST /api/telegram-webhook
// ─────────────────────────────────────────────────────────
// Handles incoming Telegram bot updates (webhook).
// Secured via X-Telegram-Bot-Api-Secret-Token header.
//
// Supported commands:
//   /start              — welcome
//   /start auth_STATE   — complete extension login flow
//   /status             — account info
//   /token              — issue a new session token
//   /help               — help text
// ─────────────────────────────────────────────────────────
const crypto                   = require('crypto');
const { supabase }             = require('../lib/supabase');
const { sendMessage, verifyWebhookSecret } = require('../lib/telegram');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  if (!verifyWebhookSecret(req)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Process the update FIRST, then respond 200 — so Vercel doesn't
  // freeze the function before the reply to Telegram is sent.
  try {
    const update = req.body;
    if (update && update.message) await handleMessage(update.message);
  } catch (err) {
    console.error('[telegram-webhook]', err);
  }

  // Always 200 so Telegram doesn't retry the update.
  res.status(200).json({ ok: true });
};

// ────────────────────────────────────────────────────────
async function handleMessage(msg) {
  const chatId     = String(msg.chat?.id);
  const text       = (msg.text || '').trim();
  const from       = msg.from || {};
  const telegramId = String(from.id);

  if (!chatId || !telegramId) return;

  // Auto-register anyone who messages the bot (idempotent upsert),
  // so /status and /token work even without the deep-link auth code.
  await ensureUserRegistered(from);

  if (text.startsWith('/start')) {
    const param = text.split(' ')[1] || '';
    if (param.startsWith('auth_')) {
      await handleAuthFlow(chatId, telegramId, from, param.replace('auth_', ''));
    } else {
      await sendMessage(chatId,
        '👋 <b>Welcome to kimtim!</b>\n\n' +
        'Commands:\n' +
        '/status — account info\n' +
        '/token  — new login token\n' +
        '/help   — help\n\n' +
        '<i>To login: open the extension and click "Login with Telegram".</i>'
      );
    }
    return;
  }

  if (text === '/status') {
    const u = await getUserByTgId(telegramId);
    if (u) {
      await sendMessage(chatId,
        `✅ <b>Status: ${u.status}</b>\n\n` +
        `Name: <b>${u.first_name || u.username || 'N/A'}</b>\n` +
        `Hits: <b>${u.hits}</b>\n` +
        `Member since: ${new Date(u.created_at).toLocaleDateString('en-US')}`
      );
    } else {
      await sendMessage(chatId, '❌ Not registered. Open the extension and login first.');
    }
    return;
  }

  if (text === '/token') {
    const u = await getUserByTgId(telegramId);
    if (!u) {
      await sendMessage(chatId, '❌ Not registered. Open the extension and login first.');
      return;
    }
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();
    await supabase.from('sessions').insert({ user_id: u.id, token, expires_at: expiresAt });
    await sendMessage(chatId,
      `🔐 <b>New Login Token</b>\n\n<code>${token}</code>\n\n` +
      `<i>Paste this in the extension → login → token field.\nExpires in 30 days.</i>`
    );
    return;
  }

  if (text === '/help') {
    await sendMessage(chatId,
      '❓ <b>Help</b>\n\n' +
      '/start — welcome\n' +
      '/status — account status\n' +
      '/token — get a new login token\n\n' +
      'Support: @kimtim'
    );
    return;
  }
}

// ────────────────────────────────────────────────────────
async function ensureUserRegistered(from) {
  try {
    await supabase.from('users').upsert({
      telegram_id: String(from.id),
      username:    from.username   || null,
      first_name:  from.first_name || null,
      last_name:   from.last_name  || null,
      updated_at:  new Date().toISOString()
    }, { onConflict: 'telegram_id' });
  } catch (e) {
    console.error('[tg] register user failed', e);
  }
}

// ────────────────────────────────────────────────────────
async function handleAuthFlow(chatId, telegramId, from, state) {
  // Validate pending state
  const { data: pending } = await supabase
    .from('auth_pending')
    .select('*')
    .eq('state', state)
    .single();

  if (!pending || pending.completed) {
    await sendMessage(chatId, '❌ Auth link is invalid or already used. Please try again from the extension.');
    return;
  }
  if (new Date(pending.expires_at) < new Date()) {
    await sendMessage(chatId, '❌ Auth link expired. Please generate a new one from the extension.');
    return;
  }

  try {
    // Upsert user
    const { data: user, error: uErr } = await supabase
      .from('users')
      .upsert({
        telegram_id: telegramId,
        username:    from.username   || null,
        first_name:  from.first_name || null,
        last_name:   from.last_name  || null,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'telegram_id' })
      .select()
      .single();

    if (uErr) throw uErr;

    // Create session
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();

    const { error: sErr } = await supabase.from('sessions').insert({
      user_id: user.id, token, expires_at: expiresAt
    });
    if (sErr) throw sErr;

    // Complete pending state
    await supabase.from('auth_pending').update({
      completed:     true,
      session_token: token,
      user_id:       user.id
    }).eq('state', state);

    await sendMessage(chatId,
      `✅ <b>Login Successful!</b>\n\n` +
      `Welcome, <b>${from.first_name || 'User'}</b>!\n\n` +
      `The extension should now be logged in automatically.`
    );
  } catch (err) {
    console.error('[auth-flow]', err);
    await sendMessage(chatId, '❌ Login failed. Please try again.');
  }
}

// ────────────────────────────────────────────────────────
async function getUserByTgId(telegramId) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  return data;
}
