import { supabase } from "../../db/supabase.js";

// GET /api/intelligence/suggestions — pending suggestions, annotated + filtered
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const now = new Date().toISOString();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("ai_confidence", { ascending: false });

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }

  const suggestions = data || [];

  const tmdbIdsWithSuggestions = suggestions
    .map((s) => s.tmdb_id)
    .filter(Boolean);
  const nonTmdbSuggestions = suggestions.filter((s) => !s.tmdb_id);

  let wantToMap = {};
  let excludedTmdbIds = new Set();
  let titleCategoryWantToMap = {};
  let excludedTitleCategoryKeys = new Set();

  const libraryFetches = [];

  if (tmdbIdsWithSuggestions.length > 0) {
    libraryFetches.push(
      supabase
        .from("items")
        .select("id, tmdb_id, status")
        .eq("user_id", userId)
        .in("tmdb_id", tmdbIdsWithSuggestions),
    );
  } else {
    libraryFetches.push(Promise.resolve({ data: [] }));
  }

  if (nonTmdbSuggestions.length > 0) {
    const titles = nonTmdbSuggestions.map((s) => s.title);
    libraryFetches.push(
      supabase
        .from("items")
        .select("id, title, category, status")
        .eq("user_id", userId)
        .in("title", titles),
    );
  } else {
    libraryFetches.push(Promise.resolve({ data: [] }));
  }

  const [tmdbLibResult, titleLibResult] = await Promise.all(libraryFetches);

  for (const item of tmdbLibResult.data || []) {
    if (item.status === "want_to") {
      wantToMap[item.tmdb_id] = item.id;
    } else {
      excludedTmdbIds.add(item.tmdb_id);
    }
  }

  for (const item of titleLibResult.data || []) {
    const key = `${item.title.toLowerCase()}::${item.category}`;
    if (item.status === "want_to") {
      titleCategoryWantToMap[key] = item.id;
    } else {
      excludedTitleCategoryKeys.add(key);
    }
  }

  const annotatedSuggestions = suggestions
    .filter((s) => {
      if (s.tmdb_id) return !excludedTmdbIds.has(s.tmdb_id);
      const key = `${s.title.toLowerCase()}::${s.category}`;
      return !excludedTitleCategoryKeys.has(key);
    })
    .map((s) => {
      if (s.tmdb_id) {
        return { ...s, library_item_id: wantToMap[s.tmdb_id] ?? null };
      }
      const key = `${s.title.toLowerCase()}::${s.category}`;
      return { ...s, library_item_id: titleCategoryWantToMap[key] ?? null };
    });

  const batchCreatedAt =
    annotatedSuggestions.length > 0
      ? annotatedSuggestions.reduce(
          (latest, s) => (s.created_at > latest ? s.created_at : latest),
          annotatedSuggestions[0].created_at,
        )
      : null;

  let refreshEligible = suggestions.length === 0;

  if (!refreshEligible && batchCreatedAt) {
    if (batchCreatedAt < sevenDaysAgo) {
      refreshEligible = true;
    } else {
      const { count } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "finished")
        .gt("updated_at", batchCreatedAt);
      if (count > 0) refreshEligible = true;
    }
  }

  return {
    suggestions: annotatedSuggestions,
    refresh_eligible: refreshEligible,
    batch_created_at: batchCreatedAt,
  };
});
