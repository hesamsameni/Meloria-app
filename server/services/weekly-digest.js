import { Resend } from "resend";
import { supabase } from "../db/supabase.js";
import { bot } from "../telegram/bot.js";
import { callAI } from "../ai/openrouter.js";
import { runWithConcurrency } from "../utils/concurrency.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM =
  process.env.EMAIL_FROM || "Meloria <notifications@meloria-app.com>";
const APP_URL = "https://meloria-app.com";
const LOGO_URL = `${APP_URL}/logo.svg`;

// ---------------------------------------------------------------------------
// Brand tokens (matches main.css)
// ---------------------------------------------------------------------------
const C = {
  bg: "#faf9f7",
  card: "#ffffff",
  border: "#e8e2d8",
  borderLight: "#f0ebe3",
  text: "#1c1a17",
  body: "#716250",
  muted: "#a89880",
  accent: "#E8673A",
};

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

const CATEGORY_ICONS = {
  movie: "🎬",
  show: "📺",
  book: "📖",
  music: "🎵",
  podcast: "🎙️",
  game: "🎮",
  anime: "✨",
  place: "📍",
};
const CATEGORY_LABELS = {
  movie: "Movie",
  show: "Show",
  book: "Book",
  music: "Track",
  podcast: "Podcast",
  game: "Game",
  anime: "Anime",
  place: "Place",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getWeekRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function groupByCategory(items) {
  return items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------
async function gatherDigestData(userId) {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();

  const [
    addedRes,
    finishedRes,
    notForMeRes,
    pendingReflectRes,
    tasteRes,
    suggestionsRes,
    userProfileRes,
  ] = await Promise.all([
    supabase
      .from("items")
      .select("title, category")
      .eq("user_id", userId)
      .gt("created_at", sevenDaysAgo),
    supabase
      .from("items")
      .select("title, category, rating, reflection_note")
      .eq("user_id", userId)
      .eq("status", "finished")
      .gt("finished_at", sevenDaysAgo)
      .order("finished_at", { ascending: false }),
    supabase
      .from("items")
      .select("title, category")
      .eq("user_id", userId)
      .eq("status", "not_for_me")
      .gt("updated_at", sevenDaysAgo),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "finished")
      .is("reflection_note", null),
    supabase
      .from("taste_profiles")
      .select("profile")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("suggestions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", now),
    supabase
      .from("user_profiles")
      .select("preferred_model")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return {
    addedItems: addedRes.data || [],
    finishedItems: finishedRes.data || [],
    notForMeItems: notForMeRes.data || [],
    pendingReflectCount: pendingReflectRes.count || 0,
    tasteProfileSummary: tasteRes.data?.profile?.summary || null,
    suggestionsCount: suggestionsRes.count || 0,
    preferredModel:
      userProfileRes.data?.preferred_model || "openai/gpt-4o-mini",
  };
}

function hasActivity(data) {
  return (
    data.addedItems.length > 0 ||
    data.finishedItems.length > 0 ||
    data.notForMeItems.length > 0
  );
}

// ---------------------------------------------------------------------------
// AI highlight paragraph (1 LLM call per user)
// ---------------------------------------------------------------------------
async function generateHighlight(data, model) {
  try {
    const finishedStr = data.finishedItems
      .slice(0, 5)
      .map((i) => {
        const parts = [`${i.title} (${i.category})`];
        if (i.rating) parts.push(`rated ${i.rating}/5`);
        if (i.reflection_note)
          parts.push(`"${i.reflection_note.slice(0, 100)}"`);
        return parts.join(" — ");
      })
      .join("; ");

    const addedStr = Object.entries(groupByCategory(data.addedItems))
      .map(([cat, n]) => `${n} ${cat}${n > 1 ? "s" : ""}`)
      .join(", ");

    const prompt = `You are Meloria, a personal taste engine. Write a warm, specific 2–3 sentence highlight of this user's week.

${data.tasteProfileSummary ? `Their taste profile: "${data.tasteProfileSummary.slice(0, 200)}"` : ""}
${finishedStr ? `Finished this week: ${finishedStr}` : "Nothing finished this week."}
${addedStr ? `Added this week: ${addedStr}` : "Nothing added this week."}
${data.notForMeItems.length ? `Passed on ${data.notForMeItems.length} item(s)` : ""}

Write directly to the user ("You finished…", "Looks like…"). Be specific — reference their actual titles. Keep it under 60 words. Return just the paragraph text, no formatting, no quotes around the whole response.`;

    const result = await callAI(prompt, model, { maxTokens: 200 });
    return result?.trim() || null;
  } catch (e) {
    console.error("[WeeklyDigest] AI highlight failed:", e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Email HTML builder
// ---------------------------------------------------------------------------
function buildDigestEmail(data, highlight, range, userId) {
  const year = new Date().getFullYear();

  // Section header label
  const sectionLabel = (icon, text) =>
    `<tr><td style="font-family:${FONT};font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:1px;padding-bottom:14px;">${icon}&nbsp; ${text}</td></tr>`;

  // Added this week
  let addedSection = "";
  if (data.addedItems.length) {
    const rows = Object.entries(groupByCategory(data.addedItems))
      .map(([cat, n]) => {
        const icon = CATEGORY_ICONS[cat] || "📌";
        const label = CATEGORY_LABELS[cat] || cat;
        return `<tr><td style="font-family:${FONT};font-size:14px;color:${C.body};padding:3px 0;">${icon} <strong style="color:${C.text};">${n} ${n > 1 ? label + "s" : label}</strong></td></tr>`;
      })
      .join("");
    addedSection = `
      <tr><td style="padding-top:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${sectionLabel("📥", "Added this week")}
          ${rows}
        </table>
      </td></tr>`;
  }

  // Finished this week
  let finishedSection = "";
  if (data.finishedItems.length) {
    const rows = data.finishedItems
      .map((item, idx) => {
        const icon = CATEGORY_ICONS[item.category] || "📌";
        const stars = item.rating
          ? `<p style="margin:3px 0 0;font-size:13px;color:${C.accent};font-family:monospace;">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</p>`
          : "";
        const note = item.reflection_note
          ? `<p style="margin:5px 0 0;font-family:${FONT};font-size:13px;color:${C.body};font-style:italic;line-height:1.5;">"${item.reflection_note.slice(0, 130)}${item.reflection_note.length > 130 ? "…" : ""}"</p>`
          : "";
        const borderBottom =
          idx < data.finishedItems.length - 1
            ? `border-bottom:1px solid ${C.borderLight};`
            : "";
        return `<tr><td style="padding:10px 0;${borderBottom}">
          <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:600;color:${C.text};">${icon} ${item.title}</p>
          ${stars}${note}
        </td></tr>`;
      })
      .join("");
    finishedSection = `
      <tr><td style="padding-top:${data.addedItems.length ? "28px" : "24px"};">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${sectionLabel("✅", "Finished")}
          ${rows}
        </table>
      </td></tr>`;
  }

  // Not for me
  const notForMeSection =
    data.notForMeItems.length > 0
      ? `<tr><td style="padding-top:16px;font-family:${FONT};font-size:14px;color:${C.body};">👎 Passed on <strong style="color:${C.text};">${data.notForMeItems.length} item${data.notForMeItems.length > 1 ? "s" : ""}</strong></td></tr>`
      : "";

  // Divider
  const divider = `<tr><td style="padding:24px 0 4px;"><div style="height:1px;background-color:${C.border};"></div></td></tr>`;

  // Suggestions pill
  const suggestionsRow =
    data.suggestionsCount > 0
      ? `<tr><td style="padding-top:16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.bg};border-radius:10px;">
            <tr><td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
                <td style="font-family:${FONT};font-size:14px;color:${C.body};">💡 <strong style="color:${C.text};">${data.suggestionsCount} suggestion${data.suggestionsCount > 1 ? "s" : ""}</strong> ready for you</td>
                <td align="right"><a href="${APP_URL}/profile/${userId}/suggestions" style="font-family:${FONT};font-size:13px;font-weight:600;color:${C.accent};text-decoration:none;">See them →</a></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>`
      : "";

  // Reflect nudge pill
  const reflectRow =
    data.pendingReflectCount > 0
      ? `<tr><td style="padding-top:10px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.bg};border-radius:10px;">
            <tr><td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
                <td style="font-family:${FONT};font-size:14px;color:${C.body};">🪞 <strong style="color:${C.text};">${data.pendingReflectCount} item${data.pendingReflectCount > 1 ? "s" : ""}</strong> awaiting reflection</td>
                <td align="right"><a href="${APP_URL}/reflect" style="font-family:${FONT};font-size:13px;font-weight:600;color:${C.accent};text-decoration:none;">Reflect →</a></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>`
      : "";

  // CTA button
  const cta = `<tr><td style="padding-top:32px;">
    <table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-radius:10px;background-color:${C.accent};">
        <a href="${APP_URL}" style="display:block;padding:13px 26px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Open Meloria</a>
      </td>
    </tr></table>
  </td></tr>`;

  const hasExtras = data.suggestionsCount > 0 || data.pendingReflectCount > 0;
  const hasMainContent =
    data.addedItems.length > 0 ||
    data.finishedItems.length > 0 ||
    data.notForMeItems.length > 0;

  const inner = `
    <tr><td style="font-family:${FONT};font-size:22px;font-weight:700;color:${C.text};letter-spacing:-0.3px;line-height:1.3;padding-bottom:4px;">Your week in review</td></tr>
    <tr><td style="font-family:${FONT};font-size:13px;color:${C.muted};padding-bottom:${highlight ? "20px" : "8px"};">${range}</td></tr>
    ${highlight ? `<tr><td style="font-family:${FONT};font-size:15px;color:${C.body};line-height:1.75;padding-bottom:4px;">${highlight}</td></tr>` : ""}
    ${hasMainContent ? divider : ""}
    ${addedSection}
    ${finishedSection}
    ${notForMeSection}
    ${hasExtras ? divider : ""}
    ${suggestionsRow}
    ${reflectRow}
    ${cta}
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your Meloria week in review</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.bg};">
  <tr>
    <td align="center" style="padding:48px 16px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="padding-right:9px;vertical-align:middle;">
                <img src="${LOGO_URL}" width="28" height="27" alt="" style="display:block;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="font-family:${FONT};font-size:17px;font-weight:600;color:${C.text};letter-spacing:-0.2px;">Meloria</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:${C.card};border-radius:16px;border:1px solid ${C.border};padding:40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              ${inner}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:${C.muted};line-height:1.6;">
              You're receiving this weekly digest because email notifications are enabled.
            </p>
            <p style="margin:0;font-family:${FONT};font-size:12px;color:${C.muted};line-height:1.6;">
              &copy; ${year} Meloria &mdash; <a href="${APP_URL}/settings" style="color:${C.muted};text-decoration:underline;">Manage notifications</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Telegram message builder
// ---------------------------------------------------------------------------
function buildDigestTelegram(data, highlight, range) {
  const lines = [`📬 *Your Meloria week — ${range}*`];

  if (highlight) {
    lines.push("", highlight);
  }

  lines.push("");

  if (data.addedItems.length) {
    const summary = Object.entries(groupByCategory(data.addedItems))
      .map(([cat, n]) => {
        const label = CATEGORY_LABELS[cat] || cat;
        return `${n} ${n > 1 ? label + "s" : label}`;
      })
      .join(", ");
    lines.push(`📥 *Added:* ${data.addedItems.length} items (${summary})`);
  }

  if (data.finishedItems.length) {
    const titles = data.finishedItems
      .slice(0, 3)
      .map((i) => i.title)
      .join(", ");
    const extra =
      data.finishedItems.length > 3
        ? ` +${data.finishedItems.length - 3} more`
        : "";
    lines.push(`✅ *Finished:* ${titles}${extra}`);
  }

  if (data.notForMeItems.length) {
    lines.push(
      `👎 *Passed on:* ${data.notForMeItems.length} item${data.notForMeItems.length > 1 ? "s" : ""}`,
    );
  }

  if (data.suggestionsCount > 0) {
    lines.push(
      `💡 *${data.suggestionsCount} suggestion${data.suggestionsCount > 1 ? "s" : ""}* waiting for you`,
    );
  }

  if (data.pendingReflectCount > 0) {
    lines.push(
      `🪞 *${data.pendingReflectCount} item${data.pendingReflectCount > 1 ? "s" : ""}* awaiting reflection`,
    );
  }

  lines.push("", `[Open Meloria →](${APP_URL})`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Send digest for a single user
// force=true bypasses the activity filter (used by admin test endpoint)
// ---------------------------------------------------------------------------
export async function sendDigestForUser(userId, force = false) {
  try {
    const [data, prefsRes, telegramRes, authRes] = await Promise.all([
      gatherDigestData(userId),
      supabase
        .from("user_profiles")
        .select("notify_email, notify_telegram")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("telegram_links")
        .select("telegram_id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.auth.admin.getUserById(userId),
    ]);

    const prefs = prefsRes.data;
    const telegramId = telegramRes.data?.telegram_id;
    const email = authRes.data?.user?.email;

    if (!force && !hasActivity(data)) {
      console.log(`[WeeklyDigest] Skipped ${userId} — no activity this week`);
      return { skipped: true };
    }

    const range = getWeekRange();
    const highlight = await generateHighlight(data, data.preferredModel);
    const channels = [];

    // Email
    if (prefs?.notify_email !== false && email) {
      try {
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: `Your Meloria week — ${range}`,
          html: buildDigestEmail(data, highlight, range, userId),
        });
        channels.push("email");
      } catch (e) {
        console.error(`[WeeklyDigest] Email failed for ${userId}:`, e.message);
      }
    }

    // Telegram
    if (prefs?.notify_telegram !== false && telegramId) {
      try {
        await bot.sendMessage(
          telegramId,
          buildDigestTelegram(data, highlight, range),
          { parse_mode: "Markdown" },
        );
        channels.push("telegram");
      } catch (e) {
        console.error(
          `[WeeklyDigest] Telegram failed for ${userId}:`,
          e.message,
        );
      }
    }

    console.log(
      `[WeeklyDigest] Sent to ${userId} via [${channels.join(", ") || "none"}]`,
    );
    return { skipped: false, channels_sent: channels };
  } catch (e) {
    console.error(`[WeeklyDigest] Failed for user ${userId}:`, e.message);
    return { skipped: false, channels_sent: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Batch send — cron entry point
// Processes all users who have had any library activity in the last 30 days.
// ---------------------------------------------------------------------------
export async function sendWeeklyDigestToAll() {
  const dormantCutoff = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: users } = await supabase.from("user_profiles").select("id");

  if (!users?.length) {
    console.log("[WeeklyDigest] No users found");
    return;
  }

  // Only process users with recent library activity (dormancy guard)
  const { data: recentActivity } = await supabase
    .from("items")
    .select("user_id")
    .in(
      "user_id",
      users.map((u) => u.id),
    )
    .gt("updated_at", dormantCutoff);

  const activeUserIds = [
    ...new Set((recentActivity || []).map((r) => r.user_id)),
  ];

  if (!activeUserIds.length) {
    console.log("[WeeklyDigest] No active users — skipping");
    return;
  }

  console.log(
    `[WeeklyDigest] Processing ${activeUserIds.length}/${users.length} active users`,
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Concurrency=3: each user triggers an LLM call + email/telegram
  await runWithConcurrency(activeUserIds, 3, async (userId) => {
    const result = await sendDigestForUser(userId, false);
    if (result.skipped) skipped++;
    else if (result.error) failed++;
    else sent++;
  });

  console.log(
    `[WeeklyDigest] Done. sent=${sent} skipped=${skipped} failed=${failed}`,
  );
}
