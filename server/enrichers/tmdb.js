import { getCachedTMDB, setCachedTMDB } from "../services/cache.js";
import { supabase } from "../db/supabase.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

async function tmdbFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

function storeSimilars(tmdbId, category, recommendations, similar) {
  // Limit to top 4 recommendations and top 4 similar by vote_average
  const topRecommendations = (recommendations ?? [])
    .filter(
      (item) => (item.vote_average ?? 0) > 0 && (item.vote_count ?? 0) >= 50,
    )
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 4);

  const topSimilar = (similar ?? [])
    .filter(
      (item) => (item.vote_average ?? 0) > 0 && (item.vote_count ?? 0) >= 50,
    )
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 4);

  // Merge, dedupe by tmdb_id
  const seen = new Set();
  const merged = [];
  for (const item of [...topRecommendations, ...topSimilar]) {
    const id = String(item.id);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }

  if (merged.length === 0) return;

  const rows = merged.map((item) => ({
    source_tmdb_id: String(tmdbId),
    source_type: category,
    tmdb_id: String(item.id),
    title: item.title ?? item.name ?? null,
    poster_url: item.poster_path ? `${IMG_BASE}/w500${item.poster_path}` : null,
    backdrop_url: item.backdrop_path
      ? `${IMG_BASE}/w1280${item.backdrop_path}`
      : null,
    vote_average: item.vote_average ?? null,
    popularity: item.popularity ?? null,
    release_date: item.release_date ?? item.first_air_date ?? null,
    overview: item.overview ?? null,
  }));

  // fire-and-forget — never block enrichment
  supabase
    .from("tmdb_suggestions")
    .upsert(rows, { onConflict: "source_tmdb_id,source_type,tmdb_id" })
    .then(({ error }) => {
      if (error) {
        console.error("[TMDB] Failed to store similars:", error.message);
      }
    })
    .catch((e) => console.error("[TMDB] upsert threw:", e.message));
}

export async function searchTMDB(title, category) {
  try {
    const type = category === "show" ? "tv" : "movie";

    const data = await tmdbFetch(
      `/search/${type}?query=${encodeURIComponent(title)}&page=1`,
    );

    const result = data.results?.[0];
    if (!result) return null;

    const tmdbId = String(result.id);
    const isMovie = type === "movie";
    const year =
      (isMovie ? result.release_date : result.first_air_date)?.split("-")[0] ??
      null;

    // check cache first
    const cached = await getCachedTMDB(title, category, year);
    if (cached) {
      return cached;
    }

    const details = await tmdbFetch(
      `/${type}/${result.id}?append_to_response=credits,videos,recommendations,similar`,
    );

    // trailer
    const trailer = details.videos?.results?.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );

    // cast
    const cast =
      details.credits?.cast?.slice(0, 10).map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_url: actor.profile_path
          ? `${IMG_BASE}/w185${actor.profile_path}`
          : null,
        source: "tmdb",
      })) ?? [];

    // director / creator
    let directorData = null;
    if (isMovie) {
      const director = details.credits?.crew?.find((p) => p.job === "Director");
      if (director) {
        directorData = {
          id: director.id,
          name: director.name,
          profile_url: director.profile_path
            ? `${IMG_BASE}/w185${director.profile_path}`
            : null,
          source: "tmdb",
        };
      }
    } else {
      const creator = details.created_by?.[0];
      if (creator) {
        directorData = {
          id: creator.id,
          name: creator.name,
          profile_url: creator.profile_path
            ? `${IMG_BASE}/w185${creator.profile_path}`
            : null,
          source: "tmdb",
        };
      }
    }

    const resultData = {
      tmdb_id: tmdbId,
      artwork_url: result.poster_path
        ? `${IMG_BASE}/w500${result.poster_path}`
        : null,
      backdrop_url: result.backdrop_path
        ? `${IMG_BASE}/w1280${result.backdrop_path}`
        : null,
      release_year: year,
      external_rating: result.vote_average
        ? parseFloat(result.vote_average.toFixed(1))
        : null,
      genres: details.genres?.map((g) => g.name) ?? [],
      runtime: isMovie
        ? (details.runtime ?? null)
        : (details.episode_run_time?.[0] ?? null),
      description: result.overview || null,
      tmdb_cast: cast,
      tmdb_director: directorData,
      trailer_url: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : null,
    };

    // cache for future lookups
    await setCachedTMDB(title, category, year, resultData);

    return resultData;
  } catch (e) {
    console.error("TMDB enrichment failed:", e.message);
    return null;
  }
}

// Lightweight candidate list for the capture-bar dropdown (sure mode)
export async function searchTMDBCandidates(title, category) {
  try {
    const type = category === "show" ? "tv" : "movie";
    const isMovie = type === "movie";
    const data = await tmdbFetch(
      `/search/${type}?query=${encodeURIComponent(title)}&page=1`,
    );
    return (data.results ?? []).slice(0, 6).map((r) => {
      const year =
        (isMovie ? r.release_date : r.first_air_date)?.split("-")[0] ?? null;
      return {
        id: String(r.id),
        title: isMovie ? r.title : r.name,
        year,
        image_url: r.poster_path ? `${IMG_BASE}/w185${r.poster_path}` : null,
        subtitle: r.overview ? r.overview.slice(0, 100) : null,
      };
    });
  } catch (e) {
    console.error("TMDB candidate search failed:", e.message);
    return [];
  }
}

// Full enrichment for an exact TMDB id (sure-mode direct add)
export async function getTMDBById(tmdbId, category) {
  try {
    const type = category === "show" ? "tv" : "movie";
    const isMovie = type === "movie";
    const details = await tmdbFetch(
      `/${type}/${tmdbId}?append_to_response=credits,videos,recommendations,similar`,
    );

    const year =
      (isMovie ? details.release_date : details.first_air_date)?.split(
        "-",
      )[0] ?? null;

    const trailer = details.videos?.results?.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );

    const cast =
      details.credits?.cast?.slice(0, 10).map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_url: actor.profile_path
          ? `${IMG_BASE}/w185${actor.profile_path}`
          : null,
        source: "tmdb",
      })) ?? [];

    let directorData = null;
    if (isMovie) {
      const director = details.credits?.crew?.find((p) => p.job === "Director");
      if (director) {
        directorData = {
          id: director.id,
          name: director.name,
          profile_url: director.profile_path
            ? `${IMG_BASE}/w185${director.profile_path}`
            : null,
          source: "tmdb",
        };
      }
    } else {
      const creator = details.created_by?.[0];
      if (creator) {
        directorData = {
          id: creator.id,
          name: creator.name,
          profile_url: creator.profile_path
            ? `${IMG_BASE}/w185${creator.profile_path}`
            : null,
          source: "tmdb",
        };
      }
    }

    return {
      tmdb_id: String(details.id),
      title: isMovie ? details.title : details.name,
      category,
      artwork_url: details.poster_path
        ? `${IMG_BASE}/w500${details.poster_path}`
        : null,
      backdrop_url: details.backdrop_path
        ? `${IMG_BASE}/w1280${details.backdrop_path}`
        : null,
      release_year: year,
      external_rating: details.vote_average
        ? parseFloat(details.vote_average.toFixed(1))
        : null,
      genres: details.genres?.map((g) => g.name) ?? [],
      runtime: isMovie
        ? (details.runtime ?? null)
        : (details.episode_run_time?.[0] ?? null),
      description: details.overview || null,
      tmdb_cast: cast,
      tmdb_director: directorData,
      trailer_url: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : null,
    };
  } catch (e) {
    console.error("TMDB getById failed:", e.message);
    return null;
  }
}

/**
 * Fetch and store similar/recommended items from TMDB for a known tmdb_id.
 * Called when a user marks a movie or show as finished.
 */
export async function fetchAndStoreSimilars(tmdbId, category) {
  try {
    const type = category === "show" ? "tv" : "movie";
    const details = await tmdbFetch(
      `/${type}/${tmdbId}?append_to_response=recommendations,similar`,
    );
    storeSimilars(
      tmdbId,
      category,
      details.recommendations?.results,
      details.similar?.results,
    );
  } catch (e) {
    console.error(
      `[TMDB] fetchAndStoreSimilars failed for ${category}/${tmdbId}:`,
      e.message,
    );
  }
}
