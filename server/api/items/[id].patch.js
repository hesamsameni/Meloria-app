import { supabase } from "../../db/supabase.js";
import { triggerSimilarsForFinishedItem } from "../../enrichers/similars.js";

// PATCH /api/items/:id — update allowed fields
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");

  const ALLOWED_FIELDS = [
    "status",
    "rating",
    "your_notes",
    "tags",
    "include_in_taste",
    "finished_at",
    "reflection_note",
  ];
  const body = (await readBody(event)) || {};
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key)),
  );

  if (Object.keys(updates).length === 0) {
    setResponseStatus(event, 400);
    return { error: "No valid fields to update" };
  }

  const { error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }

  // When an item is marked finished, seed similar/recommended items in the
  // background (kept alive with waitUntil so it survives on serverless).
  if (updates.status === "finished") {
    background(event, async () => {
      const [{ data: item }, { data: userProfile }] = await Promise.all([
        supabase
          .from("items")
          .select("title, category, creator, genres, tmdb_id")
          .eq("id", id)
          .eq("user_id", userId)
          .single(),
        supabase
          .from("user_profiles")
          .select("preferred_model")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      if (item) {
        await triggerSimilarsForFinishedItem({
          itemId: id,
          userId,
          title: item.title,
          category: item.category,
          creator: item.creator ?? null,
          genres: item.genres ?? [],
          tmdbId: item.tmdb_id ?? null,
          model: userProfile?.preferred_model ?? "openai/gpt-4o-mini",
        });
      }
    });
  }

  setResponseStatus(event, 204);
  return null;
});
