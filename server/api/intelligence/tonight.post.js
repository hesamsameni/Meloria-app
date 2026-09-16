import { runTonightPipeline } from "../../services/tonight.js";

// POST /api/intelligence/tonight
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { mood, exclude_title } = (await readBody(event)) || {};
    const recommendation = await runTonightPipeline({
      userId,
      mood: mood || null,
      excludeTitle: exclude_title || null,
    });
    return recommendation;
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
