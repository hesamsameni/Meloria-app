import { processBulkImport } from "../../ingest/processor.js";

// POST /api/ingest/bulk — kick off a background bulk import
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { text } = (await readBody(event)) || {};

  if (!text || typeof text !== "string") {
    setResponseStatus(event, 400);
    return { error: "text is required" };
  }

  const separator = text.includes("\n") ? /\n/ : /,/;
  const lines = text
    .split(separator)
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .filter((l) => !l.match(/^[-#*=]+$/))
    .slice(0, 200);

  if (lines.length === 0) {
    setResponseStatus(event, 400);
    return { error: "No valid lines found" };
  }

  // Run in the background but keep the serverless function alive until it settles.
  background(event, () => processBulkImport(lines, userId));

  return {
    queued: lines.length,
    message: `Processing ${lines.length} items in the background`,
  };
});
