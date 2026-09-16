import { supabase } from "../../../../db/supabase.js";
import { searchTMDB } from "../../../../enrichers/tmdb.js";
import { searchBook } from "../../../../enrichers/books.js";
import { searchSpotify } from "../../../../enrichers/spotify.js";
import { generateAndStoreQuestions } from "../../../../services/reflection-questions.js";
import { addTrackToUserPlaylist } from "../../../../services/spotify-user.js";

// POST /api/intelligence/suggestions/:id/save — enrich + save a suggestion to the library
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");

  const { data: suggestion, error: fetchError } = await supabase
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !suggestion) {
    setResponseStatus(event, 404);
    return { error: "Suggestion not found" };
  }

  // Full enrichment by category — same data as a manual capture
  let enrichedMeta = null;
  if (suggestion.category === "movie" || suggestion.category === "show") {
    const tmdb = await searchTMDB(suggestion.title, suggestion.category).catch(
      () => null,
    );
    if (tmdb) {
      enrichedMeta = {
        artwork_url: tmdb.artwork_url,
        backdrop_url: tmdb.backdrop_url,
        external_rating: tmdb.external_rating,
        release_year: tmdb.release_year,
        description: tmdb.description,
        genres: tmdb.genres ?? null,
        runtime: tmdb.runtime ?? null,
        tmdb_id: tmdb.tmdb_id,
        tmdb_cast: tmdb.tmdb_cast ?? null,
        tmdb_director: tmdb.tmdb_director ?? null,
        trailer_url: tmdb.trailer_url ?? null,
        creator: tmdb.tmdb_director?.name ?? null,
      };
    }
  } else if (suggestion.category === "book") {
    const book = await searchBook(
      suggestion.title,
      suggestion.creator || "",
    ).catch(() => null);
    if (book) {
      enrichedMeta = {
        artwork_url: book.artwork_url ?? null,
        release_year: book.release_year ?? null,
        genres: book.genres ?? null,
        open_library_id: book.open_library_id ?? null,
        amazon_url: book.amazon_url ?? null,
        goodreads_url: book.goodreads_url ?? null,
        audible_url: book.audible_url ?? null,
        creator: book.author_name ?? suggestion.creator ?? null,
      };
    }
  } else if (suggestion.category === "music") {
    const music = await searchSpotify(
      suggestion.title,
      suggestion.creator || "",
    ).catch(() => null);
    if (music) {
      enrichedMeta = {
        artwork_url: music.artwork_url ?? null,
        release_year: music.release_year ?? null,
        spotify_id: music.spotify_id ?? null,
        spotify_url: music.spotify_url ?? null,
        preview_url: music.preview_url ?? null,
        artist_image_url: music.artist_image_url ?? null,
        album_name: music.album_name ?? null,
        duration_ms: music.duration_ms ?? null,
        apple_music_url: music.apple_music_url ?? null,
        youtube_url: music.youtube_url ?? null,
        deezer_url: music.deezer_url ?? null,
        creator: suggestion.creator ?? null,
      };
    }
  }

  const { data: item, error: insertError } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      title: suggestion.title,
      category: suggestion.category,
      description: enrichedMeta?.description ?? suggestion.description,
      artwork_url: enrichedMeta?.artwork_url ?? suggestion.artwork_url,
      backdrop_url: enrichedMeta?.backdrop_url ?? suggestion.backdrop_url,
      external_rating:
        enrichedMeta?.external_rating ?? suggestion.external_rating,
      release_year: enrichedMeta?.release_year ?? suggestion.release_year,
      genres: enrichedMeta?.genres ?? null,
      creator: enrichedMeta?.creator ?? suggestion.creator ?? null,
      // TMDB
      tmdb_id: enrichedMeta?.tmdb_id ?? suggestion.tmdb_id,
      runtime: enrichedMeta?.runtime ?? null,
      tmdb_cast: enrichedMeta?.tmdb_cast ?? null,
      tmdb_director: enrichedMeta?.tmdb_director ?? null,
      trailer_url: enrichedMeta?.trailer_url ?? null,
      // Book
      open_library_id: enrichedMeta?.open_library_id ?? null,
      amazon_url: enrichedMeta?.amazon_url ?? null,
      goodreads_url: enrichedMeta?.goodreads_url ?? null,
      audible_url: enrichedMeta?.audible_url ?? null,
      // Music
      spotify_id: enrichedMeta?.spotify_id ?? null,
      spotify_url: enrichedMeta?.spotify_url ?? null,
      preview_url: enrichedMeta?.preview_url ?? null,
      artist_image_url: enrichedMeta?.artist_image_url ?? null,
      album_name: enrichedMeta?.album_name ?? null,
      duration_ms: enrichedMeta?.duration_ms ?? null,
      apple_music_url: enrichedMeta?.apple_music_url ?? null,
      youtube_url: enrichedMeta?.youtube_url ?? null,
      deezer_url: enrichedMeta?.deezer_url ?? null,
      source: "suggestion",
      input_type: "suggestion",
      status: "want_to",
      ai_notes: suggestion.reason,
    })
    .select()
    .single();

  if (insertError) {
    setResponseStatus(event, 500);
    return { error: insertError.message };
  }

  await supabase
    .from("suggestions")
    .update({ status: "saved" })
    .eq("id", suggestion.id);

  // --- Background work (kept alive with waitUntil so it survives on serverless) ---

  // Auto-add to Spotify playlist for music items (same as manual capture)
  if (item.category === "music" && item.spotify_id) {
    background(event, () => addTrackToUserPlaylist(userId, item.spotify_id));
  }

  // Generate reflection questions in the background (same as manual capture)
  background(event, () => generateAndStoreQuestions(item.id, userId));

  // Background enrichment retry if Open Library / Spotify was unavailable at save time
  if (suggestion.category === "book" && !enrichedMeta?.open_library_id) {
    background(event, () =>
      (async () => {
        try {
          const book = await searchBook(
            suggestion.title,
            suggestion.creator || "",
          );
          const updates = {};
          if (book.open_library_id) updates.open_library_id = book.open_library_id;
          if (book.artwork_url && !item.artwork_url)
            updates.artwork_url = book.artwork_url;
          if (book.release_year) updates.release_year = book.release_year;
          if (book.genres?.length) updates.genres = book.genres;
          if (book.amazon_url) updates.amazon_url = book.amazon_url;
          if (book.goodreads_url) updates.goodreads_url = book.goodreads_url;
          if (book.audible_url) updates.audible_url = book.audible_url;
          if (book.author_name) updates.creator = book.author_name;
          if (Object.keys(updates).length > 0) {
            await supabase.from("items").update(updates).eq("id", item.id);
          }
        } catch (e) {
          console.error(
            `[Books] Background enrichment failed for "${suggestion.title}":`,
            e.message,
          );
        }
      })(),
    );
  }

  if (suggestion.category === "music" && !enrichedMeta?.spotify_id) {
    background(event, () =>
      (async () => {
        try {
          const music = await searchSpotify(
            suggestion.title,
            suggestion.creator || "",
          );
          if (!music?.spotify_id) return;
          await supabase
            .from("items")
            .update({
              ...(music.artwork_url && !item.artwork_url
                ? { artwork_url: music.artwork_url }
                : {}),
              spotify_id: music.spotify_id,
              spotify_url: music.spotify_url ?? null,
              preview_url: music.preview_url ?? null,
              artist_image_url: music.artist_image_url ?? null,
              album_name: music.album_name ?? null,
              duration_ms: music.duration_ms ?? null,
              apple_music_url: music.apple_music_url ?? null,
              youtube_url: music.youtube_url ?? null,
              deezer_url: music.deezer_url ?? null,
            })
            .eq("id", item.id);
        } catch (e) {
          console.error(
            `[Music] Background enrichment failed for "${suggestion.title}":`,
            e.message,
          );
        }
      })(),
    );
  }

  return { success: true, item };
});
