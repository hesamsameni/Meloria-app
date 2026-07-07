import { supabase } from "../../db/supabase.js";

const DISCOVER_SELECT = [
  "id",
  "title",
  "category",
  "creator",
  "description",
  "image_url",
  "artwork_url",
  "backdrop_url",
  "release_year",
  "external_rating",
  "genres",
  "runtime",
  "tmdb_id",
  "open_library_id",
  "spotify_id",
  "tags",
  "artist_image_url",
  "album_name",
  "author_name",
  "confidence",
  "status",
].join(", ");

const VALID_DISCOVER_CATEGORIES = [
  "movie",
  "show",
  "book",
  "music",
  "podcast",
  "game",
  "anime",
];

// GET /api/items/discover — paginated, community-popular titles
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const q = getQuery(event);
    const { category } = q;
    const cappedLimit = Math.min(Math.max(Number(q.limit) || 12, 1), 50);
    const safeOffset = Math.max(Number(q.offset) || 0, 0);

    if (category && !VALID_DISCOVER_CATEGORIES.includes(category)) {
      setResponseStatus(event, 400);
      return { error: "Invalid category" };
    }

    // 1. Get this user's existing title+category pairs to exclude from results
    const { data: userItems, error: userErr } = await supabase
      .from("items")
      .select("title, category")
      .eq("user_id", userId)
      .not("title", "is", null);

    if (userErr) throw userErr;

    const userTitleCats = new Set(
      (userItems || []).map(
        (i) => `${(i.title || "").toLowerCase()}|${i.category}`,
      ),
    );

    // 2. Fetch items from other users with valid statuses
    let query = supabase
      .from("items")
      .select(DISCOVER_SELECT)
      .neq("user_id", userId)
      .in("status", ["want_to", "in_progress", "finished"])
      .not("title", "is", null)
      .limit(500);

    if (category) query = query.eq("category", category);

    const { data: allItems, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    // 3. Deduplicate by title+category, count popularity, keep one representative item
    const groupMap = new Map();
    for (const item of allItems || []) {
      if (item.confidence === "low") continue;
      const key = `${(item.title || "").toLowerCase()}|${item.category}`;
      if (userTitleCats.has(key)) continue;
      if (!groupMap.has(key)) {
        groupMap.set(key, { item, count: 1 });
      } else {
        groupMap.get(key).count++;
      }
    }

    // 4. Sort by popularity, paginate
    const sorted = Array.from(groupMap.values()).sort(
      (a, b) => b.count - a.count,
    );
    const total = sorted.length;
    const page = sorted.slice(safeOffset, safeOffset + cappedLimit);

    const items = page.map(({ item, count }) => {
      const { confidence, status, ...safeItem } = item;
      return { ...safeItem, popularity: count };
    });

    return { items, total, hasMore: safeOffset + cappedLimit < total };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
