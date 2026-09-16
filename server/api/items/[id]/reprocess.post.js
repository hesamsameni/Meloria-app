import { reprocessItem } from "../../../ingest/processor.js";

// POST /api/items/:id/reprocess — re-run enrichment with user corrections
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  const { title, category, creator } = (await readBody(event)) || {};

  const VALID_CATEGORIES = [
    "movie",
    "show",
    "book",
    "music",
    "podcast",
    "game",
    "anime",
    "place",
  ];
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    setResponseStatus(event, 400);
    return { error: "title is required" };
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    setResponseStatus(event, 400);
    return { error: "valid category is required" };
  }

  try {
    const data = await reprocessItem({
      itemId: id,
      title: title.trim(),
      category,
      creator:
        typeof creator === "string" && creator.trim()
          ? creator.trim()
          : undefined,
      userId,
    });
    return data;
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
