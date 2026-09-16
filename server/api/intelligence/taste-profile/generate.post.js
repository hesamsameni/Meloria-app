import { supabase } from "../../../db/supabase.js";
import { generateTasteProfile } from "../../../taste/generator.js";

// POST /api/intelligence/taste-profile/generate — manual generation for the user
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { data: existing } = await supabase
      .from("taste_profiles")
      .select("generated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.generated_at) {
      const { count } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("include_in_taste", true)
        .gt("created_at", existing.generated_at);

      if (count === 0) {
        setResponseStatus(event, 422);
        return {
          error:
            "Your taste profile is already up to date. Add more items to regenerate it.",
        };
      }
    }

    const profile = await generateTasteProfile(userId);
    if (!profile) {
      setResponseStatus(event, 422);
      return {
        error: "Not enough items to generate a taste profile (minimum 3)",
      };
    }

    return { ok: true, profile };
  } catch (err) {
    console.error("[taste-profile] Manual generation error:", err);
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
