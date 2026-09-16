import { supabase } from "../../db/supabase.js";
import {
  PROFILE_FIELDS,
  withEffectiveSubscription,
  withSignedAvatarUrl,
} from "../../services/profile.js";

// PATCH /api/profile — update profile fields
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const {
      display_name,
      username,
      preferred_model,
      notify_telegram,
      notify_email,
    } = (await readBody(event)) || {};

    // Validate that the requested model is available for the user's plan
    if (preferred_model !== undefined) {
      const { data: modelData, error: modelError } = await supabase
        .from("available_models")
        .select("plans, is_active")
        .eq("model", preferred_model)
        .single();

      if (modelError || !modelData) {
        setResponseStatus(event, 400);
        return { error: "Model not found" };
      }

      if (!modelData.is_active) {
        setResponseStatus(event, 400);
        return { error: "Model is not available" };
      }

      if (modelData.plans && modelData.plans.length > 0) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("subscription, subscription_status, current_period_end")
          .eq("id", userId)
          .single();

        const effective = withEffectiveSubscription(profileData);
        const userPlan = effective?.subscription || "free";

        if (!modelData.plans.includes(userPlan)) {
          setResponseStatus(event, 403);
          return { error: "This model is not available on your current plan" };
        }
      }
    }

    const updates = {
      ...(display_name !== undefined ? { display_name } : {}),
      ...(username !== undefined ? { username } : {}),
      ...(preferred_model !== undefined ? { preferred_model } : {}),
      ...(notify_telegram !== undefined
        ? { notify_telegram: Boolean(notify_telegram) }
        : {}),
      ...(notify_email !== undefined
        ? { notify_email: Boolean(notify_email) }
        : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select(PROFILE_FIELDS)
      .single();

    if (error) throw error;
    return await withSignedAvatarUrl(withEffectiveSubscription(data));
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
