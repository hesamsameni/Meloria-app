import { generateAllTasteProfiles } from "../../taste/generator.js";
import { generateAllSuggestions } from "../../services/suggestions.js";

// GET /api/cron/taste-profile — replaces the node-cron bi-weekly job.
// Scheduled by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
export default defineEventHandler(async (event) => {
  requireCronSecret(event);

  console.log("[cron:taste-profile] Starting bi-weekly taste profile generation");
  try {
    const updatedUserIds = await generateAllTasteProfiles();
    if (updatedUserIds?.length) {
      console.log(
        `[cron:taste-profile] Regenerating suggestions for ${updatedUserIds.length} users`,
      );
      await generateAllSuggestions(updatedUserIds);
    }
    return { ok: true, updated: updatedUserIds?.length ?? 0 };
  } catch (err) {
    console.error("[cron:taste-profile] Job error:", err);
    setResponseStatus(event, 500);
    return { ok: false, error: err.message };
  }
});
