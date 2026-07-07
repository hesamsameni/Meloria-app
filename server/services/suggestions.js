import { extract } from "../ai/openrouter.js";
import { supabase } from "../db/supabase.js";
import { suggestionsPrompt, suggestionsOpenPrompt } from "../prompts/index.js";
import { searchTMDB } from "../enrichers/tmdb.js";
import { searchBook } from "../enrichers/books.js";
import { searchSpotify } from "../enrichers/spotify.js";
import { runWithConcurrency } from "../utils/concurrency.js";
import { notifyMany } from "./notify.js";

// Enrich a suggestion candidate using the right API per category (for AI fallback path)
async function enrichForFallback(title, creator, category) {
  if (category === "movie" || category === "show") {
    const meta = await searchTMDB(title, category).catch(() => null);
    return { _tmdb: meta };
  }
  if (category === "book") {
    const meta = await searchBook(title, creator || "").catch(() => null);
    return { _book: meta };
  }
  if (category === "music") {
    const meta = await searchSpotify(title, creator || "").catch(() => null);
    return { _music: meta };
  }
  return {};
}

export async function generateSuggestions(userId) {
  // 0. deduplication guard — return existing batch if one was started within the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentBatch } = await supabase
    .from("suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("created_at", fiveMinutesAgo)
    .order("created_at", { ascending: false });

  if (recentBatch?.length > 0) {
    console.log(
      `[Suggestions] Returning in-flight batch (${recentBatch.length} suggestions) for ${userId}`,
    );
    return recentBatch;
  }

  // 1. fetch taste profile — skip if none
  const { data: profile } = await supabase
    .from("taste_profiles")
    .select("profile, generated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.profile?.summary) {
    return {
      error: "no_profile",
      message: "Finish a few items and generate your taste profile first.",
    };
  }

  // 2. fetch ALL finished items (any category)
  const { data: allFinishedItems } = await supabase
    .from("items")
    .select("id, title, category, tmdb_id, reflection_note, rating, updated_at")
    .eq("user_id", userId)
    .eq("status", "finished")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!allFinishedItems?.length) {
    return {
      error: "no_finished_items",
      message: "Finish some items to get suggestions.",
    };
  }

  const finishedWithTmdb = allFinishedItems.filter((i) => i.tmdb_id);
  const allFinishedIds = allFinishedItems.map((i) => i.id);
  const finishedTmdbIds = finishedWithTmdb.map((i) => i.tmdb_id);

  // lookup map for "similar to: [title]" annotation on TMDB candidates
  const finishedTmdbMap = Object.fromEntries(
    finishedWithTmdb.map((i) => [i.tmdb_id, i.title]),
  );

  // 3-7. fetch all secondary data and candidate pools in parallel
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: allLibraryItems },
    { data: dismissed },
    { data: recentSuggestions },
    { data: userProfile },
    tmdbResult,
    aiResult,
  ] = await Promise.all([
    // 3. all library items for exclusion
    supabase
      .from("items")
      .select("title, category, tmdb_id, status")
      .eq("user_id", userId),
    // 4. all-time dismissed suggestions
    supabase
      .from("suggestions")
      .select("tmdb_id, title, category")
      .eq("user_id", userId)
      .eq("status", "dismissed"),
    // 5. recently suggested (last 30 days, non-dismissed)
    supabase
      .from("suggestions")
      .select("tmdb_id, title, category")
      .eq("user_id", userId)
      .neq("status", "dismissed")
      .gt("created_at", thirtyDaysAgo),
    // 6. preferred model
    supabase
      .from("user_profiles")
      .select("preferred_model")
      .eq("id", userId)
      .maybeSingle(),
    // 7a. TMDB similars pool
    finishedTmdbIds.length > 0
      ? supabase
          .from("tmdb_suggestions")
          .select("*")
          .in("source_tmdb_id", finishedTmdbIds)
          .gte("vote_average", 6.0)
          .order("popularity", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [] }),
    // 7b. AI similars pool (confidence floor: 0.5, exclude expired)
    supabase
      .from("ai_item_suggestions")
      .select("*")
      .in("source_item_id", allFinishedIds)
      .gte("ai_confidence", 0.5)
      .gt("expires_at", new Date().toISOString())
      .order("ai_confidence", { ascending: false })
      .limit(80),
  ]);

  const model = userProfile?.preferred_model || "openai/gpt-4o-mini";

  // build exclusion sets from steps 3, 4, 5
  const excludedTmdbIds = new Set(
    allLibraryItems
      ?.filter((i) => i.tmdb_id && i.status !== "want_to")
      .map((i) => i.tmdb_id)
      .filter(Boolean),
  );
  const excludedTitleKeys = new Set(
    allLibraryItems
      ?.filter((i) => !i.tmdb_id && i.status !== "want_to" && i.title)
      .map((i) => `${i.title.toLowerCase()}::${i.category}`)
      .filter(Boolean),
  );

  dismissed?.forEach((d) => {
    if (d.tmdb_id) excludedTmdbIds.add(d.tmdb_id);
    else if (d.title && d.category)
      excludedTitleKeys.add(`${d.title.toLowerCase()}::${d.category}`);
  });

  recentSuggestions?.forEach((s) => {
    if (s.tmdb_id) excludedTmdbIds.add(s.tmdb_id);
    else if (s.title && s.category)
      excludedTitleKeys.add(`${s.title.toLowerCase()}::${s.category}`);
  });

  // 8. normalize both pools into a unified candidate shape
  const tmdbNormalized = (tmdbResult.data || [])
    .filter((c) => !excludedTmdbIds.has(c.tmdb_id))
    .map((c) => ({
      _source: "tmdb",
      _key: `${c.title?.toLowerCase()}::${c.source_type}`,
      title: c.title,
      category: c.source_type,
      creator: null,
      artwork_url: c.poster_url,
      backdrop_url: c.backdrop_url ?? null,
      description: c.overview,
      release_year: c.release_date?.split("-")[0] || null,
      vote_average: c.vote_average,
      sourceTitle: finishedTmdbMap[c.source_tmdb_id] ?? null,
      _raw: c,
    }));

  const aiNormalized = (aiResult.data || [])
    .filter(
      (c) => !excludedTitleKeys.has(`${c.title?.toLowerCase()}::${c.category}`),
    )
    .map((c) => ({
      _source: "ai",
      _key: `${c.title?.toLowerCase()}::${c.category}`,
      title: c.title,
      category: c.category,
      creator: c.creator ?? null,
      artwork_url: c.artwork_url,
      backdrop_url: null,
      description: c.description,
      release_year: c.release_year,
      vote_average: null,
      _raw: c,
    }));

  // Merge, dedupe by _key (tmdb wins on conflict)
  const seenKeys = new Set();
  const allCandidates = [];
  for (const c of [...tmdbNormalized, ...aiNormalized]) {
    if (!seenKeys.has(c._key)) {
      seenKeys.add(c._key);
      allCandidates.push(c);
    }
  }

  // 9. build recentlyFinishedContext + historicalFavoritesContext
  // Recent items: cap at 2 per category for items finished in the last 14 days,
  // 3 per category for older items — prevents a genre binge from dominating.
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const sortedFinishedItems = [
    ...allFinishedItems.filter((i) => i.rating >= 4),
    ...allFinishedItems.filter((i) => i.rating >= 2 && i.rating < 4),
    ...allFinishedItems.filter((i) => !i.rating),
  ];
  const contextCatCounts = {};
  const cappedFinishedItems = sortedFinishedItems.filter((i) => {
    const count = contextCatCounts[i.category] || 0;
    const isVeryRecent = i.updated_at && i.updated_at > fourteenDaysAgo;
    const cap = isVeryRecent ? 2 : 3;
    if (count >= cap) return false;
    contextCatCounts[i.category] = count + 1;
    return true;
  });
  const cappedIds = new Set(cappedFinishedItems.map((i) => i.id));
  const recentlyFinishedContext = cappedFinishedItems
    .map(
      (i) =>
        `- ${i.title} (${i.category})${i.reflection_note ? `: "${i.reflection_note.slice(0, 120)}"` : ""}${i.rating ? ` [rated ${i.rating}/5]` : ""}`,
    )
    .join("\n");

  // Historical favorites: up to 1 per category, high-rated (≥4), not already in
  // the recent context, to anchor the AI against short-term genre binges.
  const historicalCatSeen = {};
  const historicalFavorites = allFinishedItems
    .filter(
      (i) =>
        i.rating >= 4 &&
        !cappedIds.has(i.id) &&
        !historicalCatSeen[i.category] &&
        (historicalCatSeen[i.category] = true),
    )
    .slice(0, 3);
  const historicalFavoritesContext = historicalFavorites.length
    ? historicalFavorites
        .map(
          (i) =>
            `- ${i.title} (${i.category})${i.reflection_note ? `: "${i.reflection_note.slice(0, 80)}"` : ""} [rated ${i.rating}/5]`,
        )
        .join("\n")
    : null;

  // 10. group candidates by category bucket (no global slice — each bucket handles its own limit)
  const SCREEN_CATS = new Set(["movie", "show", "anime"]);
  const screenCandidates = allCandidates.filter((c) =>
    SCREEN_CATS.has(c.category),
  );
  const bookCandidates = allCandidates.filter((c) => c.category === "book");
  const musicCandidates = allCandidates.filter((c) => c.category === "music");

  const hasFinishedScreen = allFinishedItems.some((i) =>
    SCREEN_CATS.has(i.category),
  );
  const hasFinishedBooks = allFinishedItems.some((i) => i.category === "book");
  const hasFinishedMusic = allFinishedItems.some((i) => i.category === "music");

  const POOL_THRESHOLD = 3;
  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const batchId = `${userId}-${Date.now()}`;
  const dismissedTitles = dismissed?.map((d) => d.title).filter(Boolean) ?? [];
  const excludedTitles = [
    ...allFinishedItems.map((i) => i.title),
    ...dismissedTitles,
  ].slice(0, 50);

  // Rank candidates from pool for one category bucket
  async function rankFromPool(candidates, bucketLabel) {
    const candidateList = candidates
      .map((c, i) => {
        const rating = c.vote_average
          ? ` — rated ${c.vote_average.toFixed(1)}`
          : "";
        const creatorInfo = c.creator ? ` by ${c.creator}` : "";
        const year = c.release_year || "unknown";
        const desc = c.description?.slice(0, 120) || "no description";
        const sourceLine = c.sourceTitle
          ? ` (similar to: ${c.sourceTitle})`
          : "";
        return `${i + 1}. [${c.category}] ${c.title} (${year})${creatorInfo}${rating}${sourceLine} — ${desc}`;
      })
      .join("\n");

    console.log(
      `[Suggestions] Ranking ${candidates.length} ${bucketLabel} candidates via AI`,
    );
    const prompt = suggestionsPrompt({
      tasteProfileSummary: profile.profile.summary,
      tasteCategories: profile.profile.categories || null,
      recentlyFinishedContext,
      historicalFavoritesContext,
      candidateList,
      count: "4-5",
    });
    const aiResponse = await extract(prompt, model);
    return aiResponse?.suggestions ?? [];
  }

  // Map AI picks back to insert rows from pool
  function mapPicksFromPool(aiPicks, candidates) {
    return aiPicks
      .filter((s) => s.index >= 1 && s.index <= candidates.length)
      .map((s) => {
        const c = candidates[s.index - 1];
        return {
          user_id: userId,
          batch_id: batchId,
          expires_at: expiresAt,
          category: c.category,
          title: c.title,
          creator: c.creator ?? null,
          artwork_url: c.artwork_url,
          backdrop_url: c.backdrop_url,
          external_rating:
            c._source === "tmdb" && c._raw.vote_average
              ? parseFloat(parseFloat(c._raw.vote_average).toFixed(1))
              : null,
          release_year: c.release_year,
          description: c.description,
          tmdb_id: c._source === "tmdb" ? c._raw.tmdb_id : null,
          reason: s.reason,
          cross_category_connection: s.cross_category_connection || null,
          mood_match: s.mood_match,
          ai_confidence: s.confidence,
          status: "pending",
        };
      });
  }

  // Open-prompt fallback for one category bucket (pool too thin)
  async function openFallbackForBucket(categoryLabel, categoryJsonValues) {
    console.log(
      `[Suggestions] Pool thin for ${categoryLabel}, using open AI fallback`,
    );
    const prompt = suggestionsOpenPrompt({
      tasteProfileSummary: profile.profile.summary,
      tasteCategories: profile.profile.categories || null,
      recentlyFinishedContext,
      historicalFavoritesContext,
      excludedTitles,
      count: "4-5",
      categoryLabel,
      categoryJsonValues,
    });
    const aiResponse = await extract(prompt, model);
    const results = aiResponse?.suggestions ?? [];

    const enriched = await Promise.allSettled(
      results.map((s) => enrichForFallback(s.title, s.creator, s.category)),
    );

    return results.map((s, i) => {
      const meta = enriched[i].status === "fulfilled" ? enriched[i].value : {};
      const tmdb = meta._tmdb ?? null;
      const book = meta._book ?? null;
      const music = meta._music ?? null;
      return {
        user_id: userId,
        batch_id: batchId,
        expires_at: expiresAt,
        category: s.category,
        title: s.title,
        creator: s.creator ?? null,
        artwork_url:
          tmdb?.artwork_url ?? book?.artwork_url ?? music?.artwork_url ?? null,
        backdrop_url: tmdb?.backdrop_url ?? null,
        external_rating: tmdb?.external_rating ?? null,
        release_year:
          tmdb?.release_year ??
          book?.release_year ??
          music?.release_year ??
          null,
        description: tmdb?.description ?? null,
        tmdb_id: tmdb?.tmdb_id ?? null,
        reason: s.reason,
        cross_category_connection: s.cross_category_connection || null,
        mood_match: s.mood_match,
        ai_confidence: s.confidence ?? null,
        status: "pending",
      };
    });
  }

  // 11. per-category AI ranking in parallel
  const groups = [
    {
      candidates: screenCandidates,
      label: "movies or shows",
      jsonValues: "movie|show",
      eligible: hasFinishedScreen || screenCandidates.length > 0,
    },
    {
      candidates: bookCandidates,
      label: "books",
      jsonValues: "book",
      eligible: hasFinishedBooks || bookCandidates.length > 0,
    },
    {
      candidates: musicCandidates,
      label: "music tracks",
      jsonValues: "music",
      eligible: hasFinishedMusic || musicCandidates.length > 0,
    },
  ].filter((g) => g.eligible);

  if (groups.length === 0) {
    return {
      error: "no_finished_items",
      message: "Finish some items to get suggestions.",
    };
  }

  const groupResults = await Promise.allSettled(
    groups.map(async (g) => {
      if (g.candidates.length >= POOL_THRESHOLD) {
        const picks = await rankFromPool(g.candidates, g.label);
        return mapPicksFromPool(picks, g.candidates);
      }
      return openFallbackForBucket(g.label, g.jsonValues);
    }),
  );

  const toInsert = groupResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (toInsert.length === 0) {
    throw new Error("All category AI calls failed or returned no suggestions");
  }

  // 12. expire any existing pending suggestions so the new batch is the only one shown
  await supabase
    .from("suggestions")
    .update({ expires_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending");

  // 13. insert all picks in one batch
  const { data: inserted, error } = await supabase
    .from("suggestions")
    .insert(toInsert)
    .select();

  if (error) throw error;

  console.log(
    `[Suggestions] Generated ${inserted.length} suggestions across [${groups.map((g) => g.label).join(", ")}] for ${userId}`,
  );
  return inserted;
}

/**
 * Called by the background job after taste profiles are updated.
 * For each userId in the list, generates a fresh suggestions batch if:
 *   - they have no pending batch, OR
 *   - their current batch was created before their taste profile was last updated
 *     (meaning the profile changed and the suggestions are now stale)
 * Users who generated suggestions manually AFTER their latest profile update are skipped.
 */
export async function generateAllSuggestions(userIds) {
  if (!userIds?.length) return;

  // Fetch the latest taste profile update time and latest pending batch per user in one go
  const [{ data: profiles }, { data: batches }] = await Promise.all([
    supabase
      .from("taste_profiles")
      .select("user_id, generated_at")
      .in("user_id", userIds),
    supabase
      .from("suggestions")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  // Latest profile update per user
  const profileUpdatedAt = Object.fromEntries(
    (profiles || []).map((p) => [p.user_id, p.generated_at]),
  );

  // Latest pending batch creation time per user (first row per user since ordered DESC)
  const latestBatchAt = {};
  for (const row of batches || []) {
    if (!latestBatchAt[row.user_id])
      latestBatchAt[row.user_id] = row.created_at;
  }

  const eligible = userIds.filter((userId) => {
    const profileAt = profileUpdatedAt[userId];
    if (!profileAt) return false; // no profile yet — generateSuggestions will catch this gracefully

    const batchAt = latestBatchAt[userId];
    if (!batchAt) return true; // no batch at all → generate

    // Batch predates the latest profile update → stale, regenerate
    return batchAt < profileAt;
  });

  if (!eligible.length) {
    console.log(
      "[Suggestions] Background job: all users have fresh batches — skipping",
    );
    return;
  }

  console.log(
    `[Suggestions] Background job: generating for ${eligible.length}/${userIds.length} users`,
  );

  const CONCURRENCY = 3; // lower than taste profiles — each suggestion job does 3 AI calls
  let succeeded = 0;
  let failed = 0;

  const results = await runWithConcurrency(
    eligible,
    CONCURRENCY,
    async (userId) => {
      const result = await generateSuggestions(userId);
      if (result?.error) {
        console.log(`[Suggestions] Skipped ${userId}: ${result.error}`);
      }
      return result;
    },
  );

  for (const r of results) {
    if (r.status === "fulfilled" && !r.value?.error) succeeded++;
    else if (r.status === "rejected") {
      failed++;
      console.error(`[Suggestions] Failed for a user:`, r.reason?.message);
    }
  }

  console.log(
    `[Suggestions] Background job done. succeeded=${succeeded} failed=${failed}`,
  );

  // Notify users whose suggestions were successfully generated (fire-and-forget)
  const notifiedIds = eligible.filter(
    (_, i) => results[i].status === "fulfilled" && !results[i].value?.error,
  );
  notifyMany(notifiedIds, "suggestions_ready").catch(() => {});
}
