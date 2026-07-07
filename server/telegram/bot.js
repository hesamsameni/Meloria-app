import TelegramBot from "node-telegram-bot-api";
import { supabase } from "../db/supabase.js";
import { processItem } from "../ingest/processor.js";
import { runTonightPipeline } from "../services/tonight.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = new TelegramBot(token);

// find meloria user from telegram id
async function getUserFromTelegram(telegramId) {
  const { data } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_id", String(telegramId))
    .single();
  return data?.user_id ?? null;
}

// send typing indicator
async function sendTyping(chatId) {
  await bot.sendChatAction(chatId, "typing");
}

// handle /start
async function handleStart(msg) {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `👋 Welcome to Meloria!\n\nI'm your personal second brain.\n\nTo get started, go to your Meloria settings and generate a link code, then send me:\n\n/link YOUR_CODE`,
  );
}

// handle /link ABC123
async function handleLink(msg, code) {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const telegramUsername = msg.from.username || null;

  if (!code) {
    return bot.sendMessage(chatId, "Please provide your code: /link YOUR_CODE");
  }

  // find the code
  const { data: linkCode } = await supabase
    .from("telegram_link_codes")
    .select("user_id, expires_at")
    .eq("code", code.toUpperCase())
    .single();

  if (!linkCode) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid code. Generate a new one in Meloria settings.",
    );
  }

  if (new Date(linkCode.expires_at) < new Date()) {
    return bot.sendMessage(
      chatId,
      "❌ Code expired. Generate a new one in Meloria settings.",
    );
  }

  // check if already linked
  const { data: existing } = await supabase
    .from("telegram_links")
    .select("id")
    .eq("user_id", linkCode.user_id)
    .single();

  if (existing) {
    // update existing link
    await supabase
      .from("telegram_links")
      .update({
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        linked_at: new Date().toISOString(),
      })
      .eq("user_id", linkCode.user_id);
  } else {
    // create new link
    await supabase.from("telegram_links").insert({
      user_id: linkCode.user_id,
      telegram_id: telegramId,
      telegram_username: telegramUsername,
    });
  }

  // delete used code
  await supabase
    .from("telegram_link_codes")
    .delete()
    .eq("code", code.toUpperCase());

  await bot.sendMessage(
    chatId,
    "✅ Telegram linked to your Meloria account!\n\nNow just send me anything — a movie name, song, link, voice note, or any thought.",
  );
}

// handle /status
async function handleStatus(msg) {
  const chatId = msg.chat.id;
  const userId = await getUserFromTelegram(msg.from.id);

  if (!userId) {
    return bot.sendMessage(
      chatId,
      "⚠️ Not linked yet. Send /link YOUR_CODE to connect your account.",
    );
  }

  const { count } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  await bot.sendMessage(chatId, `🧠 Your brain has ${count} items saved.`);
}

// handle regular text / links
async function handleText(msg) {
  const chatId = msg.chat.id;
  const userId = await getUserFromTelegram(msg.from.id);

  if (!userId) {
    return bot.sendMessage(
      chatId,
      "⚠️ Your Telegram is not linked to Meloria yet.\n\nGo to Meloria → Settings → Connect Telegram to get your link code.",
    );
  }

  await sendTyping(chatId);

  // detect if it's a forwarded message — extract text from it
  const content = msg.text || msg.caption || msg.forward_from?.first_name || "";

  if (!content.trim()) {
    return bot.sendMessage(
      chatId,
      "I didn't catch that. Send me text, a link, or a voice message.",
    );
  }

  try {
    const item = await processItem({
      content,
      input_type: "text",
      source: "telegram",
      userId,
    });

    const emoji =
      {
        movie: "🎬",
        music: "🎵",
        book: "📚",
        show: "📺",
        podcast: "🎙",
        game: "🎮",
        anime: "🎌",
      }[item.category] || "✦";

    let reply = `${emoji} *${item.title || "Saved"}*`;
    if (item.creator) reply += `\n👤 ${item.creator}`;
    if (item.release_year) reply += `  •  📅 ${item.release_year}`;
    if (item.external_rating) reply += `  •  ⭐ ${item.external_rating}`;
    if (item.ai_notes) reply += `\n\n_${item.ai_notes}_`;
    reply += `\n\n✅ Added to your brain`;

    await bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("Telegram ingest error:", e.message);
    if (e.code === "INGEST_LIMIT") {
      await bot.sendMessage(
        chatId,
        `❌ ${e.payload.error}\n\nYou can upgrade your plan at https://meloria-app.com/settings\n\nCurrent tier: *${e.payload.tier}*  •  Used: *${e.payload.used}/${e.payload.limit}*\nResets: ${new Date(e.payload.resets_at).toLocaleDateString()}`,
        { parse_mode: "Markdown" },
      );
    } else if (e.code === "UNRECOGNISED_CONTENT") {
      await bot.sendMessage(
        chatId,
        `🤔 I couldn't figure out what you meant.\n\n_${e.reason || e.message}_\n\nCould you be more specific? For example:\n• A movie name: _Inception_\n• A song: _Blinding Lights by The Weeknd_\n• A book: _Atomic Habits_\n• Or paste a link`,
        { parse_mode: "Markdown" },
      );
    } else {
      await bot.sendMessage(chatId, "❌ Something went wrong. Try again.");
    }
  }
}

// detect tonight intent in natural language
function detectTonightIntent(text) {
  const lower = text.toLowerCase().trim();
  return (
    /\btonight\b/.test(lower) ||
    /what (should|shall) i (watch|read|listen|play)/i.test(lower) ||
    /what to (watch|read|listen|play)/i.test(lower) ||
    /recommend (something|a movie|a show|a book|a game|a podcast)/i.test(
      lower,
    ) ||
    /\/tonight/.test(lower)
  );
}

// handle /tonight [optional mood]
async function handleTonight(msg, mood) {
  const chatId = msg.chat.id;
  const userId = await getUserFromTelegram(msg.from.id);

  if (!userId) {
    return bot.sendMessage(
      chatId,
      "⚠️ Your Telegram is not linked to Meloria yet.\n\nGo to Meloria → Settings → Connect Telegram to get your link code.",
    );
  }

  await sendTyping(chatId);

  try {
    const rec = await runTonightPipeline({ userId, mood: mood || null });

    const categoryEmoji =
      {
        movie: "🎬",
        show: "📺",
        book: "📚",
        music: "🎵",
        podcast: "🎙",
        game: "🎮",
        anime: "🎌",
      }[rec.category] || "✦";

    const sourceLabel = rec.is_from_library
      ? rec.saved_at
        ? `_(saved ${new Date(rec.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})_`
        : "_(from your library)_"
      : "_(new suggestion)_";

    let reply = `${categoryEmoji} *${rec.title}* ${sourceLabel}`;
    if (rec.reason) reply += `\n\n${rec.reason}`;
    if (rec.mood_match) reply += `\n\n🎭 Mood: _${rec.mood_match}_`;

    await bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("Telegram tonight error:", e.message);
    await bot.sendMessage(
      chatId,
      "❌ Something went wrong getting your recommendation. Try again.",
    );
  }
}

// handle voice messages
async function handleVoice(msg) {
  const chatId = msg.chat.id;
  const userId = await getUserFromTelegram(msg.from.id);

  if (!userId) {
    return bot.sendMessage(
      chatId,
      "⚠️ Link your account first. Go to Meloria → Settings → Connect Telegram.",
    );
  }

  await bot.sendMessage(
    chatId,
    "🎙 Voice messages coming soon! For now send me text or links.",
  );
}

// handle photos / screenshots
async function handlePhoto(msg) {
  const chatId = msg.chat.id;
  const userId = await getUserFromTelegram(msg.from.id);

  if (!userId) return;

  await sendTyping(chatId);

  // use caption if available
  const content = msg.caption || "Screenshot or image";

  try {
    const item = await processItem({
      content,
      input_type: "image",
      source: "telegram",
      userId,
    });

    await bot.sendMessage(
      chatId,
      `✅ Saved as *${item.title || item.category}*`,
      { parse_mode: "Markdown" },
    );
  } catch (e) {
    if (e.code === "INGEST_LIMIT") {
      await bot.sendMessage(
        chatId,
        `❌ ${e.payload.error}\n\nYou can upgrade your plan at https://meloria-app.com/settings\n\nCurrent tier: *${e.payload.tier}*  •  Used: *${e.payload.used}/${e.payload.limit}*\nResets: ${new Date(e.payload.resets_at).toLocaleDateString()}`,
        { parse_mode: "Markdown" },
      );
    } else {
      await bot.sendMessage(chatId, "❌ Could not process this image.");
    }
  }
}

// main message router
export function handleUpdate(update) {
  const msg = update.message || update.channel_post;
  if (!msg) return;

  // commands
  if (msg.text?.startsWith("/start")) return handleStart(msg);
  if (msg.text?.startsWith("/link")) {
    const code = msg.text.split(" ")[1];
    return handleLink(msg, code);
  }
  if (msg.text?.startsWith("/status")) return handleStatus(msg);
  if (msg.text?.startsWith("/tonight")) {
    const mood = msg.text.slice("/tonight".length).trim() || null;
    return handleTonight(msg, mood);
  }

  // content types
  if (msg.voice) return handleVoice(msg);
  if (msg.photo) return handlePhoto(msg);
  if (msg.text && detectTonightIntent(msg.text))
    return handleTonight(msg, msg.text);
  if (msg.text || msg.caption) return handleText(msg);
}
