import { extract } from "../ai/openrouter.js";
import { contentExtractionPrompt } from "../prompts/index.js";
import { supabase } from "../db/supabase.js";
import { enrichUrl } from "./enricher.js";
import { searchTMDB, getTMDBById } from "../enrichers/tmdb.js";
import { searchSpotify, getSpotifyById } from "../enrichers/spotify.js";
import { searchBook, getBookByKey } from "../enrichers/books.js";
import { addTrackToUserPlaylist } from "../services/spotify-user.js";
import { generateAndStoreQuestions } from "../services/reflection-questions.js";

// --- Ingest Limit Logic (moved from router.js) ---
function getMonthlyWindowUtc(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
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

export async function checkIngestLimit(userId) {
  const { start, next: nextMonth } = getMonthlyWindowUtc();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("subscription, current_period_end, preferred_model, role")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  // Bypass limit for admin accounts
  if (profile?.role === "admin") {
    return {
      preferredModel: profile?.preferred_model || null,
      tier: "ultimate",
    };
  }

  const tier = effectiveTier(
    profile?.subscription,
    profile?.current_period_end,
  );
  const limit = tierLimit(tier);

  const { count, error: countError } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lt("created_at", nextMonth.toISOString());
  if (countError) throw countError;
  const used = count ?? 0;
  if (used >= limit) {
    const payload = {
      error:
        "Monthly limit reached. Please upgrade your plan to continue adding items.",
      tier,
      limit,
      used,
      resets_at: nextMonth.toISOString(),
    };
    const err = new Error(payload.error);
    err.code = "INGEST_LIMIT";
    err.payload = payload;
    throw err;
  }
  // Return preferred model and effective tier for downstream use
  return { preferredModel: profile?.preferred_model || null, tier };
}

function isUrl(str) {
  try {
    const url = new URL(str.trim());
    const protocol = url.protocol.toLowerCase();
    return (protocol === "http:" || protocol === "https:") && !!url.hostname;
  } catch {
    return false;
  }
}

function sanitizeInput(str) {
  return str
    .slice(0, 2000)
    .replace(/<[^>]*>/g, "")
    .replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, " ")
    .trim();
}

async function enrich(category, title, creator) {
  if (category === "movie" || category === "show") {
    return await searchTMDB(title, category);
  }
  if (category === "music") {
    return await searchSpotify(title, creator);
  }
  if (category === "book") {
    return await searchBook(title, creator);
  }
  return null;
}

// Fields that indicate enrichment quality — more non-null = richer record
const QUALITY_FIELDS = [
  "tmdb_id",
  "spotify_id",
  "isbn",
  "description",
  "creator",
  "external_url",
  "trailer_url",
  "rating",
  "release_year",
];

function qualityScore(item) {
  return QUALITY_FIELDS.filter((f) => item[f] != null && item[f] !== "").length;
}

async function findDuplicate(userId, title, category) {
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .ilike("title", title.trim())
    .maybeSingle();
  return data || null;
}

export async function processItem({
  content,
  input_type,
  source,
  userId,
  preferredModel,
}) {
  // Fetch user profile/preferred model upfront — always needed for extract
  // Limit enforcement happens later, only for new items
  const { preferredModel: modelFromProfile } = await checkIngestLimit(
    userId,
  ).catch((e) => {
    // If limit is already hit, rethrow immediately (no point continuing)
    throw e;
  });
  if (!preferredModel && modelFromProfile) preferredModel = modelFromProfile;

  const sanitized = sanitizeInput(content);

  let enriched = sanitized;

  if (input_type === "url" || isUrl(content)) {
    const meta = await enrichUrl(content);
    enriched = `
      URL: ${meta.url}
      Site: ${meta.siteName || "unknown"}
      Title: ${meta.title || "unknown"}
      Description: ${meta.description || "none"}
    `.trim();
  }

  const extracted = await extract(
    contentExtractionPrompt({ input_type, source, enriched }),
    preferredModel,
  );

  // Check for duplicate before enforcing ingest limit — updates don't count against the limit
  const dedupeCategories = ["movie", "show", "music", "book"];
  const existing = dedupeCategories.includes(extracted.category)
    ? await findDuplicate(userId, extracted.title, extracted.category)
    : null;

  // Only enforce ingest limit for genuinely new items (duplicates are updates, not new slots)
  if (!existing) {
    await checkIngestLimit(userId);
  }

  if (!extracted.found) {
    const err = new Error(
      extracted.reason ||
        "Could not identify any supported content in your message.",
    );
    err.code = "UNRECOGNISED_CONTENT";
    err.reason = extracted.reason;
    throw err;
  }

  // run enrichment based on category
  const mediaMeta = await enrich(
    extracted.category,
    extracted.title,
    extracted.creator,
  );

  const { found: _found, ...extractedData } = extracted;
  const newData = {
    raw_input: sanitized,
    input_type,
    source,
    user_id: userId,
    external_url: isUrl(content) ? content : null,
    ...extractedData,
    ...(mediaMeta ?? {}),
    // If TMDB returned a real director/creator, prefer it over the AI's guess
    ...(mediaMeta?.tmdb_director?.name
      ? { creator: mediaMeta.tmdb_director.name }
      : {}),
  };

  return persistAndEnrichItem({ newData, userId, existing });
}

// Shared persistence: dedupe-aware insert/update + background post-hooks.
// Used by both the AI extraction path and the direct (sure-mode) path.
async function persistAndEnrichItem({ newData, userId, existing }) {
  let data, error;

  if (existing) {
    const existingScore = qualityScore(existing);
    const newScore = qualityScore(newData);

    if (newScore > existingScore) {
      // New entry is richer — replace the existing record's data
      ({ data, error } = await supabase
        .from("items")
        .update({ ...newData, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single());
    } else {
      // Same or less data — just touch updated_at, return existing
      ({ data, error } = await supabase
        .from("items")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single());
    }
  } else {
    ({ data, error } = await supabase
      .from("items")
      .insert(newData)
      .select()
      .single());
  }

  if (error) throw error;

  // Auto-add to Spotify playlist for any user who has Spotify connected
  if (data.category === "music" && data.spotify_id) {
    addTrackToUserPlaylist(userId, data.spotify_id).catch((e) =>
      console.error("[Spotify] Failed to add track to playlist:", e.message),
    );
  }

  // Generate reflection questions in the background for new items only
  if (!existing) {
    generateAndStoreQuestions(data.id, userId).catch((e) =>
      console.error(
        "[ReflectionQuestions] Background generation failed:",
        e.message,
      ),
    );
  }

  return data;
}

// Direct (sure-mode) add: the user already knows the category and picked an
// exact item from the search dropdown. No AI extraction — fetch full
// enrichment by id and persist. Throws NO_MATCH if the id can't be resolved.
const DIRECT_CATEGORIES = ["movie", "show", "music", "book"];

export async function processDirectItem({ category, id, source, userId }) {
  if (!DIRECT_CATEGORIES.includes(category)) {
    const err = new Error("Unsupported category for direct add.");
    err.code = "UNRECOGNISED_CONTENT";
    throw err;
  }

  // Enforce monthly limit up front (re-checked after dedupe for new items)
  await checkIngestLimit(userId);

  let meta = null;
  if (category === "movie" || category === "show") {
    meta = await getTMDBById(id, category);
  } else if (category === "music") {
    meta = await getSpotifyById(id);
  } else if (category === "book") {
    meta = await getBookByKey(id);
  }

  if (!meta || !meta.title) {
    const err = new Error("Could not load the selected item.");
    err.code = "NO_MATCH";
    throw err;
  }

  const title = meta.title;
  const existing = await findDuplicate(userId, title, category);
  if (!existing) {
    await checkIngestLimit(userId);
  }

  const { title: _title, category: _category, ...enrichFields } = meta;
  const newData = {
    raw_input: title,
    input_type: "text",
    source: source || "manual",
    user_id: userId,
    category,
    title,
    confidence: "high",
    ...enrichFields,
    // If TMDB returned a real director/creator, prefer it
    ...(meta.tmdb_director?.name ? { creator: meta.tmdb_director.name } : {}),
  };

  return persistAndEnrichItem({ newData, userId, existing });
}

export async function reprocessItem({
  itemId,
  title,
  category,
  creator,
  userId,
}) {
  // Re-run enrichment with the user-supplied corrections
  const mediaMeta = await enrich(category, title, creator);

  const updatedFields = {
    title,
    category,
    creator,
    updated_at: new Date().toISOString(),
    // Clear stale enrichment data before applying new
    tmdb_id: null,
    tmdb_cast: null,
    tmdb_director: null,
    trailer_url: null,
    spotify_id: null,
    spotify_url: null,
    preview_url: null,
    artist_image_url: null,
    album_name: null,
    duration_ms: null,
    apple_music_url: null,
    youtube_url: null,
    deezer_url: null,
    open_library_id: null,
    author_name: null,
    author_photo_url: null,
    amazon_url: null,
    goodreads_url: null,
    audible_url: null,
    artwork_url: null,
    backdrop_url: null,
    description: null,
    release_year: null,
    external_rating: null,
    genres: null,
    runtime: null,
    // Clear user reflection data — it was for the old item, not valid for the new one
    reflection_note: null,
    rating: null,
    ...(mediaMeta ?? {}),
    // If TMDB returned a real director/creator, prefer it over the user's guess
    ...(mediaMeta?.tmdb_director?.name
      ? { creator: mediaMeta.tmdb_director.name }
      : {}),
  };

  const { data, error } = await supabase
    .from("items")
    .update(updatedFields)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  // Auto-add to Spotify playlist if applicable
  if (data.category === "music" && data.spotify_id) {
    addTrackToUserPlaylist(userId, data.spotify_id).catch((e) =>
      console.error("[Spotify] Failed to add track to playlist:", e.message),
    );
  }

  return data;
}

export async function processBulkImport(lines, userId) {
  console.log(`Starting bulk import: ${lines.length} items for ${userId}`);

  // Insert a pending record immediately so the status endpoint shows something while processing
  const { data: record } = await supabase
    .from("bulk_imports")
    .insert({ user_id: userId, total: lines.length, success: 0, failed: 0 })
    .select("id")
    .single();
  const recordId = record?.id;

  const results = { success: 0, failed: 0, items: [], limit_reached: false };
  const categoryCounts = {};

  const persistProgress = async ({ completed = false } = {}) => {
    if (!recordId) return;
    const payload = {
      success: results.success,
      failed: results.failed,
      limit_reached: results.limit_reached,
      category_counts: categoryCounts,
    };
    if (completed) {
      payload.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("bulk_imports")
      .update(payload)
      .eq("id", recordId);

    if (updateError) {
      console.error("Failed to update bulk_imports record:", updateError);
    }
  };

  for (const line of lines) {
    try {
      const item = await processItem({
        content: line,
        input_type: "text",
        source: "bulk_import",
        userId,
      });
      results.success++;
      results.items.push(item);
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;

      // small delay to avoid hammering AI + enrichment APIs
      await new Promise((r) => setTimeout(r, 800));
    } catch (e) {
      if (e.code === "INGEST_LIMIT") {
        console.warn(`⚠️ Ingest limit reached — stopping bulk import early`);
        results.limit_reached = true;
        results.failed += lines.length - results.success - results.failed - 1;
        await persistProgress();
        break;
      }
      console.error(`❌ Failed: ${line} — ${e.message}`);
      results.failed++;
    }

    await persistProgress();
  }

  if (recordId) {
    await persistProgress({ completed: true });
  } else {
    const { error: insertError } = await supabase.from("bulk_imports").insert({
      user_id: userId,
      total: lines.length,
      success: results.success,
      failed: results.failed,
      limit_reached: results.limit_reached,
      category_counts: categoryCounts,
      completed_at: new Date().toISOString(),
    });
    if (insertError) {
      console.error("Failed to insert bulk_imports record:", insertError);
    }
  }

  console.log(
    `Bulk import complete: ${results.success} success, ${results.failed} failed`,
  );
}
