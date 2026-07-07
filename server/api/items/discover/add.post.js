import { supabase } from "../../../db/supabase.js";

const COPY_SELECT = [
  "title",
  "category",
  "creator",
  "description",
  "image_url",
  "external_url",
  "artwork_url",
  "backdrop_url",
  "release_year",
  "external_rating",
  "genres",
  "runtime",
  "tmdb_id",
  "tmdb_cast",
  "tmdb_director",
  "trailer_url",
  "open_library_id",
  "author_name",
  "author_photo_url",
  "amazon_url",
  "goodreads_url",
  "audible_url",
  "spotify_id",
  "spotify_url",
  "preview_url",
  "artist_image_url",
  "album_name",
  "duration_ms",
  "apple_music_url",
  "youtube_url",
  "deezer_url",
  "tags",
  "confidence",
  "raw_input",
  "input_type",
].join(", ");

// POST /api/items/discover/add — copy a community item into the user's library
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { sourceId, status } = (await readBody(event)) || {};

    if (!sourceId || typeof sourceId !== "string") {
      setResponseStatus(event, 400);
      return { error: "sourceId is required" };
    }
    if (!["want_to", "finished"].includes(status)) {
      setResponseStatus(event, 400);
      return { error: "status must be want_to or finished" };
    }

    const { data: source, error: sourceErr } = await supabase
      .from("items")
      .select(COPY_SELECT)
      .eq("id", sourceId)
      .not("title", "is", null)
      .single();

    if (sourceErr || !source) {
      setResponseStatus(event, 404);
      return { error: "Source item not found" };
    }

    const { data: existing } = await supabase
      .from("items")
      .select("id")
      .eq("user_id", userId)
      .eq("category", source.category)
      .ilike("title", source.title)
      .limit(1);

    if (existing && existing.length > 0) {
      setResponseStatus(event, 409);
      return { error: "Already in your library", itemId: existing[0].id };
    }

    const newItem = {
      ...source,
      user_id: userId,
      status,
      source: "discover",
      raw_input: source.raw_input || source.title,
      input_type: source.input_type || "text",
      include_in_taste: true,
    };

    const { data: created, error: insertErr } = await supabase
      .from("items")
      .insert(newItem)
      .select()
      .single();

    if (insertErr) throw insertErr;

    setResponseStatus(event, 201);
    return { item: created };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
