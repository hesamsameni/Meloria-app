import { supabase } from "../../db/supabase.js";

// --- Tier helpers (same pattern as processor.js / discussion.post.js) ---

function getMonthlyWindowUtc(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, next };
}

// Start of the current UTC day — matches the window used to enforce the
// daily "new discussion" limit in discussion.post.js.
function getDayWindowUtc(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, next };
}

function tierLimit(tier) {
  if (tier === "pro") return 200;
  if (tier === "ultimate") return 999;
  if (tier === "test") return 2; // special tier for testing, not purchasable
  return 50; // free (default)
}

function effectiveTier(subscription, current_period_end) {
  const tier = subscription || "free";
  if (tier === "free") return "free";
  if (!current_period_end) return tier;

  const expiresAt = new Date(current_period_end);
  if (Number.isNaN(expiresAt.getTime())) return tier;

  return expiresAt <= new Date() ? "free" : tier;
}

const DISCUSSION_LIMITS = {
  free: { dailyNew: 2, maxMessages: 10 },
  test: { dailyNew: 2, maxMessages: 10 },
  pro: { dailyNew: 10, maxMessages: 30 },
  ultimate: { dailyNew: Infinity, maxMessages: 60 },
};

// GET /api/usage — current-period usage for the authenticated user.
// Reuses the exact tier + limit logic that the ingest and discussion
// endpoints enforce, so the meters can never drift from what the API allows.
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("subscription, current_period_end, role")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  // Admins bypass ingest limits and get ultimate discussion limits.
  const isAdmin = profile?.role === "admin";
  const tier = isAdmin
    ? "ultimate"
    : effectiveTier(profile?.subscription, profile?.current_period_end);

  // --- Captures (monthly) ---
  const { start: monthStart, next: monthNext } = getMonthlyWindowUtc();
  const { count: capturesUsed, error: capturesError } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString())
    .lt("created_at", monthNext.toISOString());
  if (capturesError) throw capturesError;

  const captureLimit = tierLimit(tier);
  // 999 is the sentinel "effectively unlimited" cap for ultimate; treat
  // ultimate/admin captures as unlimited in the UI.
  const capturesUnlimited = isAdmin || tier === "ultimate";
  const capturesUsedCount = capturesUsed ?? 0;

  // --- Discussions (daily new conversations) ---
  const { start: dayStart, next: dayNext } = getDayWindowUtc();
  const { count: discussionsUsed, error: discussionsError } = await supabase
    .from("item_discussions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", dayStart.toISOString());
  if (discussionsError) throw discussionsError;

  const discLimits = DISCUSSION_LIMITS[tier] ?? DISCUSSION_LIMITS.free;
  const discussionsUnlimited = discLimits.dailyNew === Infinity;
  const discussionsUsedCount = discussionsUsed ?? 0;

  return {
    tier,
    captures: {
      used: capturesUsedCount,
      limit: capturesUnlimited ? null : captureLimit,
      remaining: capturesUnlimited
        ? null
        : Math.max(0, captureLimit - capturesUsedCount),
      unlimited: capturesUnlimited,
      resets_at: monthNext.toISOString(),
    },
    discussions: {
      used: discussionsUsedCount,
      limit: discussionsUnlimited ? null : discLimits.dailyNew,
      remaining: discussionsUnlimited
        ? null
        : Math.max(0, discLimits.dailyNew - discussionsUsedCount),
      unlimited: discussionsUnlimited,
      max_messages: discLimits.maxMessages,
      resets_at: dayNext.toISOString(),
    },
  };
});
