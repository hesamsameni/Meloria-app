import { processItem } from "../../ingest/processor.js";

// POST /api/ingest — AI capture
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { content, input_type, source } = (await readBody(event)) || {};

  try {
    const item = await processItem({
      content,
      input_type,
      source,
      userId,
    });
    return { success: true, item };
  } catch (err) {
    if (err.code === "INGEST_LIMIT") {
      setResponseStatus(event, 429);
      return err.payload;
    }
    if (err.code === "UNRECOGNISED_CONTENT") {
      setResponseStatus(event, 422);
      return { error: err.message, code: "UNRECOGNISED_CONTENT" };
    }
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
