import { supabase } from "../db/supabase.js";
import { extract } from "../ai/openrouter.js";
import { tasteProfilePrompt } from "../prompts/index.js";
import { runWithConcurrency } from "../utils/concurrency.js";
import { notifyMany } from "../services/notify.js";

// ---------------------------------------------------------------------------
// Prompt builder helpers
// ---------------------------------------------------------------------------
function topN(values, n) {
  const counts = {};
  for (const v of values) if (v) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function computeTopSource(items) {
  return topN(items.map((i) => i.source).filter(Boolean), 1)[0] || "unknown";
}

function computePeakHour(items) {
  const hourCounts = {};
  for (const item of items) {
    if (!item.created_at) continue;
    const h = new Date(item.created_at).getUTCHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  const entries = Object.entries(hourCounts);
  if (!entries.length) return "unknown";
  const topHour = parseInt(entries.sort((a, b) => b[1] - a[1])[0][0]);
  if (topHour >= 6 && topHour < 12) return "morning";
  if (topHour >= 12 && topHour < 18) return "afternoon";
  if (topHour >= 18 && topHour < 23) return "evening";
  return "late night";
}

const CATEGORY_LABELS = {
  movie: "MOVIES",
  show: "SHOWS",
  book: "BOOKS",
  music: "MUSIC",
  podcast: "PODCASTS",
  game: "GAMES",
  anime: "ANIME",
};

function buildAggregatedSummary(items) {
  const lines = [];
  for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
    const catItems = items.filter((i) => i.category === cat);
    if (!catItems.length) continue;
    const genres = catItems.flatMap((i) => i.genres || []);
    const tags = catItems.flatMap((i) => i.tags || []);
    const creators = catItems
      .map((i) => i.creator)
      .filter((c) => c && c.toLowerCase() !== "unknown");
    lines.push(`${label} (${catItems.length} items):`);
    if (genres.length)
      lines.push(`  Top genres: ${topN(genres, 10).join(", ")}`);
    if (creators.length)
      lines.push(`  Top creators: ${topN(creators, 10).join(", ")}`);
    if (tags.length) lines.push(`  Top tags: ${topN(tags, 10).join(", ")}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Time-bucket helpers for anti-echo-chamber sampling
// ---------------------------------------------------------------------------
function bucketByAge(items) {
  const now = Date.now();
  const d30 = 30 * 24 * 60 * 60 * 1000;
  const d90 = 90 * 24 * 60 * 60 * 1000;
  const recent = [];
  const mid = [];
  const old = [];
  for (const i of items) {
    const age = now - new Date(i.created_at || 0).getTime();
    if (age <= d30) recent.push(i);
    else if (age <= d90) mid.push(i);
    else old.push(i);
  }
  return { recent, mid, old };
}

// Take up to `perBucket` items from each time bucket, interleaving so variety
// is spread across the final list (recent → mid → old → recent → mid → …).
function sampleAcrossBuckets(items, totalMax, perBucket) {
  const { recent, mid, old } = bucketByAge(items);
  const buckets = [
    recent.slice(0, perBucket),
    mid.slice(0, perBucket),
    old.slice(0, perBucket),
  ];
  const indices = [0, 0, 0];
  const result = [];
  while (result.length < totalMax) {
    let added = false;
    for (let b = 0; b < buckets.length; b++) {
      if (result.length >= totalMax) break;
      if (indices[b] < buckets[b].length) {
        result.push(buckets[b][indices[b]++]);
        added = true;
      }
    }
    if (!added) break;
  }
  return result;
}

// Same as above but also caps at `perCategoryMax` per category across the whole result.
function sampleAcrossBucketsByCat(items, totalMax, perBucket, perCategoryMax) {
  const { recent, mid, old } = bucketByAge(items);
  const catCounts = {};
  const result = [];
  const buckets = [recent, mid, old];
  // Walk through each bucket slot round-robin
  const indices = [0, 0, 0];
  while (result.length < totalMax) {
    let added = false;
    for (let b = 0; b < buckets.length; b++) {
      if (result.length >= totalMax) break;
      // Respect per-bucket cap
      if (indices[b] >= perBucket) continue;
      const item = buckets[b][indices[b]];
      if (!item) {
        indices[b]++;
        continue;
      }
      const cat = item.category;
      if ((catCounts[cat] || 0) >= perCategoryMax) {
        indices[b]++;
        continue;
      }
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      result.push(item);
      indices[b]++;
      added = true;
    }
    if (!added) break;
  }
  return result;
}

function buildPrompt(items, previousProfile) {
  const finished = items.filter((i) => i.status === "finished");
  const finishedWithNotes = finished.filter((i) => i.reflection_note);
  const finishedNoNotes = finished.filter((i) => !i.reflection_note);
  const wantToItems = items.filter((i) => i.status === "want_to");

  const total = items.length;
  const completionRate = total > 0 ? (finished.length / total).toFixed(2) : 0;
  const topSource = computeTopSource(items);
  const peakTime = computePeakHour(items);

  const aggregatedSummary = buildAggregatedSummary(items);

  // Reflection notes — time-bucketed so a recent binge can't fill all 15 slots
  // (up to 5 per time bucket: ≤30d / 31–90d / 91+d)
  const sampledWithNotes = sampleAcrossBuckets(finishedWithNotes, 15, 5);
  const reflectionLines = sampledWithNotes
    .map((i) => {
      const truncatedNote =
        i.reflection_note.length > 200
          ? i.reflection_note.slice(0, 200) + "..."
          : i.reflection_note;
      return `- title: "${i.title || i.raw_input}", category: ${i.category}${i.creator ? `, creator: "${i.creator}"` : ""}, reflection: "${truncatedNote}"`;
    })
    .join("\n");

  // Finished without notes — time-bucketed AND capped per category
  // (up to 3 per bucket, max 4 per category, 20 total)
  const sampledNoNotes = sampleAcrossBucketsByCat(finishedNoNotes, 20, 3, 4);
  const finishedNoNotesLines = sampledNoNotes
    .map(
      (i) =>
        `- "${i.title || i.raw_input}"${i.creator ? ` by ${i.creator}` : ""}`,
    )
    .join("\n");

  // Max 20 want-to items — titles only
  const wantToLines = wantToItems
    .slice(0, 20)
    .map((i) => `- "${i.title || i.raw_input}"`)
    .join("\n");

  return tasteProfilePrompt({
    previousProfile,
    aggregatedSummary,
    reflectionLines,
    finishedNoNotesLines,
    wantToLines,
    topSource,
    peakTime,
    total,
    completionRate,
  });
}

// ---------------------------------------------------------------------------
// Generate + store profile for a single user
// ---------------------------------------------------------------------------
export async function generateTasteProfile(userId) {
  const [
    { data: items, error },
    { data: userProfile },
    { data: previousProfile },
  ] = await Promise.all([
    supabase
      .from("items")
      .select(
        "title, raw_input, category, creator, genres, tags, status, rating, source, created_at, reflection_note",
      )
      .eq("user_id", userId)
      .eq("include_in_taste", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select("preferred_model")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("taste_profiles")
      .select("profile, generated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (error) throw error;
  if (!items || items.length < 3) {
    // Not enough data to generate a meaningful profile
    return null;
  }

  const model = userProfile?.preferred_model || "openai/gpt-4o-mini";
  const prompt = buildPrompt(items, previousProfile);
  const profile = await extract(prompt, model, { maxTokens: 9999 });

  const { error: upsertError } = await supabase.from("taste_profiles").upsert(
    {
      user_id: userId,
      summary: profile.summary ?? null,
      profile,
      item_count: items.length,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) throw upsertError;

  return profile;
}

// ---------------------------------------------------------------------------
// Run for all users (called by the daily job)
// ---------------------------------------------------------------------------
export async function generateAllTasteProfiles() {
  const CONCURRENCY = 5;
  const DORMANT_DAYS = 45; // skip users with no activity in this many days
  const dormantCutoff = new Date(
    Date.now() - DORMANT_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("id");

  if (error) throw error;
  if (!users?.length) return;

  // Fetch the last generation time for each user that already has a profile
  const { data: existingProfiles } = await supabase
    .from("taste_profiles")
    .select("user_id, generated_at");

  const lastGeneratedAt = Object.fromEntries(
    (existingProfiles || []).map((p) => [p.user_id, p.generated_at]),
  );

  // Only keep users who:
  //   (a) have added at least one new item since their last generation, AND
  //   (b) had some item activity within the last DORMANT_DAYS days
  // Users with no profile yet are always included (if they have any recent item).
  const usersWithNewItems = await runWithConcurrency(
    users,
    CONCURRENCY,
    async (u) => {
      const since = lastGeneratedAt[u.id];

      // Check for any item activity within dormant cutoff (applies to everyone)
      const { count: recentCount } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id)
        .gt("updated_at", dormantCutoff);

      if (!recentCount) return null; // dormant — skip entirely

      if (!since) return u; // no profile yet — include

      const { count } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id)
        .eq("include_in_taste", true)
        .gt("created_at", since);

      return count > 0 ? u : null;
    },
  );

  const eligibleUsers = usersWithNewItems
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  if (!eligibleUsers.length) {
    console.log(
      "[taste-profile] No users with new items — skipping generation",
    );
    return;
  }

  console.log(
    `[taste-profile] Generating profiles for ${eligibleUsers.length}/${users.length} users (concurrency=${CONCURRENCY}, others dormant/up-to-date)`,
  );

  const results = await runWithConcurrency(eligibleUsers, CONCURRENCY, (u) =>
    generateTasteProfile(u.id),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[taste-profile] Done. succeeded=${succeeded} failed=${failed}`);

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `[taste-profile] Failed for user ${eligibleUsers[i].id}:`,
        r.reason,
      );
    }
  });

  // Return IDs of users whose profiles were successfully updated
  const updatedUserIds = eligibleUsers
    .filter((_, i) => results[i].status === "fulfilled")
    .map((u) => u.id);

  // Notify users via all enabled channels (fire-and-forget)
  notifyMany(updatedUserIds, "taste_profile_updated").catch(() => {});

  return updatedUserIds;
}
