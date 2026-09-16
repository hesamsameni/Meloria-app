import { generateAllTasteProfiles } from "../../taste/generator.js";
import { generateAllSuggestions } from "../../services/suggestions.js";

// POST /api/admin/run-job — manually trigger the taste-profile + suggestions pipeline
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  // Run in the background but keep the function alive until it settles.
  background(event, async () => {
    try {
      console.log("[Admin] Manual job trigger started");
      const updatedUserIds = await generateAllTasteProfiles();
      if (updatedUserIds?.length) {
        await generateAllSuggestions(updatedUserIds);
      }
      console.log("[Admin] Manual job trigger complete");
    } catch (err) {
      console.error("[Admin] Manual job trigger failed:", err.message);
    }
  });

  return { ok: true, message: "Job started — check server logs for progress." };
});
