import { supabase } from "../db/supabase.js";
import { bot } from "../telegram/bot.js";
import { sendNotificationEmail } from "./email-notify.js";

/**
 * Canonical content for each notification event type.
 *
 * `telegram` — Markdown-formatted message for the Telegram bot.
 * `title`    — Short title for the in-app notification center.
 * `body`     — Plain-text body for the in-app notification center.
 */
const NOTIFICATION_CONTENT = {
  taste_profile_updated: {
    title: "Taste profile updated",
    body: "Your taste profile has been refreshed based on your latest captures.",
    telegram: `🧠 *Your taste profile was just updated!*\n\nYour Meloria profile now reflects your latest captures. Open the app to see your updated suggestions.`,
  },
  suggestions_ready: {
    title: "Fresh suggestions ready",
    body: "We've picked new movies, books, and music just for you.",
    telegram: `✨ *Fresh suggestions are ready!*\n\nWe've picked new movies, books, and music based on your taste profile. Open Meloria to explore them.`,
  },
};

/**
 * Notify a single user via all enabled channels.
 * Always writes an in-app notification regardless of channel preferences.
 * Silently swallows errors so notifications never break the main flow.
 */
export async function notify(userId, eventType) {
  const content = NOTIFICATION_CONTENT[eventType];
  if (!content) {
    console.warn(`[Notify] Unknown event type: ${eventType}`);
    return;
  }
  try {
    const [{ data: profileData }, { data: telegramData }, { data: userData }] =
      await Promise.all([
        supabase
          .from("user_profiles")
          .select("notify_telegram, notify_email")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("telegram_links")
          .select("telegram_id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.auth.admin.getUserById(userId),
      ]);

    await supabase.from("notifications").insert({
      user_id: userId,
      type: eventType,
      title: content.title,
      body: content.body,
    });

    if (profileData?.notify_telegram !== false && telegramData?.telegram_id) {
      bot
        .sendMessage(telegramData.telegram_id, content.telegram, {
          parse_mode: "Markdown",
        })
        .catch((e) =>
          console.error(`[Notify] Telegram failed for ${userId}:`, e.message),
        );
    }

    const email = userData?.user?.email;
    if (profileData?.notify_email !== false && email) {
      sendNotificationEmail(email, eventType);
    }
  } catch (e) {
    console.error(`[Notify] Failed for user ${userId}:`, e.message);
  }
}

/**
 * Batch-notify multiple users for the same event type.
 * Uses bulk DB queries for efficiency, then fans out to individual channels.
 * Silently swallows errors so notifications never break the main flow.
 */
export async function notifyMany(userIds, eventType) {
  if (!userIds?.length) return;

  const content = NOTIFICATION_CONTENT[eventType];
  if (!content) {
    console.warn(`[Notify] Unknown event type: ${eventType}`);
    return;
  }
  try {
    const [{ data: profiles }, { data: telegramLinks }] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, notify_telegram, notify_email")
        .in("id", userIds),
      supabase
        .from("telegram_links")
        .select("user_id, telegram_id")
        .in("user_id", userIds),
    ]);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.id, p]),
    );
    const telegramMap = Object.fromEntries(
      (telegramLinks || []).map((t) => [t.user_id, t.telegram_id]),
    );

    await supabase.from("notifications").insert(
      userIds.map((userId) => ({
        user_id: userId,
        type: eventType,
        title: content.title,
        body: content.body,
      })),
    );

    const telegramTargets = userIds.filter(
      (id) => profileMap[id]?.notify_telegram !== false && telegramMap[id],
    );
    await Promise.allSettled(
      telegramTargets.map((userId) =>
        bot
          .sendMessage(telegramMap[userId], content.telegram, {
            parse_mode: "Markdown",
          })
          .catch((e) =>
            console.error(`[Notify] Telegram failed for ${userId}:`, e.message),
          ),
      ),
    );

    const emailTargets = userIds.filter(
      (id) => profileMap[id]?.notify_email !== false,
    );
    await Promise.allSettled(
      emailTargets.map(async (userId) => {
        try {
          const { data } = await supabase.auth.admin.getUserById(userId);
          if (data?.user?.email) {
            await sendNotificationEmail(data.user.email, eventType);
          }
        } catch (e) {
          console.error(`[Notify] Email lookup failed for ${userId}:`, e.message);
        }
      }),
    );
  } catch (e) {
    console.error("[Notify] Batch notify failed:", e.message);
  }
}
