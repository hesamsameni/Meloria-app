import { supabase } from "../../../db/supabase.js";

// PATCH /api/admin/models/:model — update model status and plans
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const model = getRouterParam(event, "model");
    const { is_active, plans } = (await readBody(event)) || {};

    const updates = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = is_active;
    if (plans !== undefined) updates.plans = plans;

    const { data, error } = await supabase
      .from("available_models")
      .update(updates)
      .eq("model", model)
      .select("model, label, is_active, plans, created_at, updated_at")
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
