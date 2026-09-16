import { supabase } from "../db/supabase.js";
import { extract } from "../ai/openrouter.js";
import { fetchAndStoreSimilars } from "./tmdb.js";
import { searchBook } from "./books.js";
import { searchSpotify } from "./spotify.js";
import { itemSimilarsPrompt } from "../prompts/index.js";

const TMDB_CATEGORIES = new Set(["movie", "show", "anime"]);
const AI_SIMILAR_CATEGORIES = new Set([
  "book",
  "music",
  "podcast",
  "game",
  "place",
]);

/**
 * Triggered fire-and-forget when a user marks an item as finished.
 * - movie/show/anime: fetches TMDB recommendations + similar → seeds tmdb_suggestions pool
 * - book/music/etc: uses AI to find similar items → enriches → upserts into ai_item_suggestions pool
 */
export async function triggerSimilarsForFinishedItem({
  itemId,
  userId,
  title,
  category,
  creator,
  genres,
  tmdbId,
  model,
}) {
  if (TMDB_CATEGORIES.has(category)) {
    if (!tmdbId) return;
    await fetchAndStoreSimilars(tmdbId, category);
    return;
  }

  if (AI_SIMILAR_CATEGORIES.has(category)) {
    await generateAndStoreAiSimilars({
      itemId,
      title,
      creator,
      category,
      genres,
      model,
    });
    return;
  }
}

// Enrich a single AI-suggested item using the appropriate API
async function enrichSimilar(title, creator, category) {
  if (category === "book") {
    try {
      const meta = await searchBook(title, creator || "");
      if (!meta) return {};
      return {
        artwork_url: meta.artwork_url ?? null,
        release_year: meta.release_year ?? null,
        genres: meta.genres?.length ? meta.genres : null,
        open_library_id: meta.open_library_id ?? null,
      };
    } catch {
      return {};
    }
  }
  if (category === "music") {
    try {
      const meta = await searchSpotify(title, creator || "");
      if (!meta) return {};
      return {
        artwork_url: meta.artwork_url ?? null,
        release_year: meta.release_year ?? null,
        spotify_id: meta.spotify_id ?? null,
        description: meta.album_name ?? null,
      };
    } catch {
      return {};
    }
  }
  return {};
}

async function generateAndStoreAiSimilars({
  itemId,
  title,
  creator,
  category,
  genres,
  model,
}) {
  const prompt = itemSimilarsPrompt({ title, creator, category, genres });

  let aiResults;
  try {
    const response = await extract(prompt, model || "openai/gpt-4o-mini");
    aiResults = response?.suggestions;
  } catch (e) {
    console.error(`[Similars] AI call failed for "${title}":`, e.message);
    return;
  }

  if (!Array.isArray(aiResults) || aiResults.length === 0) {
    return;
  }

  // Enrich all results in parallel using the right API per category
  const enriched = await Promise.allSettled(
    aiResults.map((s) => enrichSimilar(s.title, s.creator, category)),
  );

  const rows = aiResults
    .filter((s) => s.title)
    .map((s, i) => {
      const meta = enriched[i]?.status === "fulfilled" ? enriched[i].value : {};
      return {
        source_item_id: itemId,
        source_category: category,
        title: s.title,
        creator: s.creator ?? null,
        category,
        artwork_url: meta.artwork_url ?? null,
        description: meta.description ?? null,
        release_year: meta.release_year ?? null,
        genres: meta.genres ?? null,
        open_library_id: meta.open_library_id ?? null,
        spotify_id: meta.spotify_id ?? null,
        ai_confidence: typeof s.confidence === "number" ? s.confidence : null,
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    });

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("ai_item_suggestions").upsert(rows, {
    onConflict: "source_item_id,title,category",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(
      `[Similars] Failed to upsert AI similars for "${title}":`,
      error.message,
    );
  }
}
