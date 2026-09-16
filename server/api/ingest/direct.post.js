import { processDirectItem } from "../../ingest/processor.js";

// POST /api/ingest/direct — add an exact item the user selected (no AI)
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { category, id, source } = (await readBody(event)) || {};

  if (!category || !id) {
    setResponseStatus(event, 400);
    return { error: "category and id are required" };
  }

  try {
    const item = await processDirectItem({ category, id, source, userId });
    return { success: true, item };
  } catch (err) {
    if (err.code === "INGEST_LIMIT") {
      setResponseStatus(event, 429);
      return err.payload;
    }
    if (err.code === "NO_MATCH") {
      setResponseStatus(event, 422);
      return { error: err.message, code: "NO_MATCH" };
    }
    if (err.code === "UNRECOGNISED_CONTENT") {
      setResponseStatus(event, 422);
      return { error: err.message, code: "UNRECOGNISED_CONTENT" };
    }
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
