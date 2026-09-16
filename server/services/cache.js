import { supabase } from "../db/supabase.js";

// Normalize query key by lowercasing, trimming, and removing leading articles
function normalizeQueryKey(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/i, ""); // Remove leading articles
}

// TMDB Cache Operations - keyed by search query + year
export async function getCachedTMDB(title, category, year = null) {
  const yearSuffix = year ? `|${year}` : "";
  const queryKey = `${normalizeQueryKey(title)}|${category}${yearSuffix}`;
  const { data, error } = await supabase
    .from("tmdb_cache")
    .select("data")
    .eq("query_key", queryKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("[Cache] Error reading TMDB cache:", error);
    return null;
  }

  if (data) {
    return data.data;
  }

  return null;
}

export async function setCachedTMDB(title, category, year, data) {
  const yearSuffix = year ? `|${year}` : "";
  const queryKey = `${normalizeQueryKey(title)}|${category}${yearSuffix}`;
  const { error } = await supabase.from("tmdb_cache").upsert(
    {
      query_key: queryKey,
      category,
      title: title.trim(),
      data,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "query_key" },
  );

  if (error) {
    console.error("[Cache] Error writing TMDB cache:", error);
  }
}

// Spotify Cache Operations - keyed by search query
export async function getCachedSpotify(title, artist = "") {
  const queryKey = artist
    ? `${normalizeQueryKey(title)}|${normalizeQueryKey(artist)}`
    : normalizeQueryKey(title);
  const { data, error } = await supabase
    .from("spotify_cache")
    .select("data")
    .eq("query_key", queryKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("[Cache] Error reading Spotify cache:", error);
    return null;
  }

  if (data) {
    return data.data;
  }

  return null;
}

export async function setCachedSpotify(title, artist, data) {
  const queryKey = artist
    ? `${normalizeQueryKey(title)}|${normalizeQueryKey(artist)}`
    : normalizeQueryKey(title);
  const { error } = await supabase.from("spotify_cache").upsert(
    {
      query_key: queryKey,
      title: title.trim(),
      artist: artist?.trim() || null,
      data,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "query_key" },
  );

  if (error) {
    console.error("[Cache] Error writing Spotify cache:", error);
  }
}

// Books Cache Operations - keyed by search query
export async function getCachedBook(title, author = "") {
  const queryKey = author
    ? `${normalizeQueryKey(title)}|${normalizeQueryKey(author)}`
    : normalizeQueryKey(title);
  const { data, error } = await supabase
    .from("books_cache")
    .select("data")
    .eq("query_key", queryKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("[Cache] Error reading Books cache:", error);
    return null;
  }

  if (data) {
    return data.data;
  }

  return null;
}

export async function setCachedBook(title, author, data) {
  const queryKey = author
    ? `${normalizeQueryKey(title)}|${normalizeQueryKey(author)}`
    : normalizeQueryKey(title);
  const { error } = await supabase.from("books_cache").upsert(
    {
      query_key: queryKey,
      title: title.trim(),
      author: author?.trim() || null,
      data,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "query_key" },
  );

  if (error) {
    console.error("[Cache] Error writing Books cache:", error);
  }
}
