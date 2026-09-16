import { searchTMDBCandidates } from "../../enrichers/tmdb.js";
import { searchSpotifyCandidates } from "../../enrichers/spotify.js";
import { searchBookCandidates } from "../../enrichers/books.js";

const DIRECT_CATEGORIES = ["movie", "show", "music", "book"];

// GET /api/ingest/search — live candidate search for sure mode (no AI)
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const { category, q } = getQuery(event);

  if (!DIRECT_CATEGORIES.includes(category)) {
    setResponseStatus(event, 400);
    return { error: "Invalid category" };
  }
  if (!q || !String(q).trim()) {
    setResponseStatus(event, 400);
    return { error: "Query is required" };
  }

  try {
    let candidates = [];
    if (category === "movie" || category === "show") {
      candidates = await searchTMDBCandidates(String(q), category);
    } else if (category === "music") {
      candidates = await searchSpotifyCandidates(String(q));
    } else if (category === "book") {
      candidates = await searchBookCandidates(String(q));
    }
    return { candidates };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
