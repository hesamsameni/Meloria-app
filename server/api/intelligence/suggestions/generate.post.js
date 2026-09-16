import { generateSuggestions } from "../../../services/suggestions.js";

// POST /api/intelligence/suggestions/generate
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const result = await generateSuggestions(userId);
    if (result?.error) {
      setResponseStatus(event, 422);
      return result;
    }
    return result;
  } catch (e) {
    console.error("[Suggestions] Generation failed:", e.message);
    setResponseStatus(event, 500);
    return { error: e.message };
  }
});
