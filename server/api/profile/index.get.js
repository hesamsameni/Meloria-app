import { supabase } from "../../db/supabase.js";
import {
  PROFILE_FIELDS,
  withEffectiveSubscription,
  withSignedAvatarUrl,
} from "../../services/profile.js";

// GET /api/profile — fetch (or lazily create) the user's profile
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      const { data: created } = await supabase
        .from("user_profiles")
        .insert({ id: userId })
        .select(PROFILE_FIELDS)
        .single();
      return await withSignedAvatarUrl(withEffectiveSubscription(created));
    }

    return await withSignedAvatarUrl(withEffectiveSubscription(data));
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
