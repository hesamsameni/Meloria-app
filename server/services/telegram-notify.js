import { bot } from "../telegram/bot.js";
import { supabase } from "../db/supabase.js";

/**
 * Look up the telegram_id for a Meloria user (null if not connected).
 */
async function getTelegramChatId(userId) {
  const { data } = await supabase
    .from("telegram_links")
    .select("telegram_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.telegram_id ?? null;
}

/**
 * Send a Telegram message to a user if they have Telegram connected.
 * Silently swallows errors so notifications never break the main flow.
 */
export async function notifyUser(userId, message) {
  try {
    const chatId = await getTelegramChatId(userId);
    if (!chatId) return;
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (e) {
    console.error(`[TelegramNotify] Failed for user ${userId}:`, e.message);
  }
}

/**
 * Batch-notify multiple users. Fetches all chat IDs in one query.
 * Silently skips users without Telegram connected.
 */
export async function notifyUsers(userIds, messageFn) {
  if (!userIds?.length) return;
  try {
    const { data } = await supabase
      .from("telegram_links")
      .select("user_id, telegram_id")
      .in("user_id", userIds);

    if (!data?.length) return;

    await Promise.allSettled(
      data.map(({ user_id, telegram_id }) =>
        bot
          .sendMessage(telegram_id, messageFn(user_id), {
            parse_mode: "Markdown",
          })
          .catch((e) =>
            console.error(
              `[TelegramNotify] Failed for user ${user_id}:`,
              e.message,
            ),
          ),
      ),
    );
  } catch (e) {
    console.error("[TelegramNotify] Batch notify failed:", e.message);
  }
}
