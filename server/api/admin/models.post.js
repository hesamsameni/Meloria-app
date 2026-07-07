import { supabase } from "../../db/supabase.js";

// POST /api/admin/models — add a new available model
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const { model, label, is_active = true, plans = null } =
      (await readBody(event)) || {};
    if (!model || !label) {
      setResponseStatus(event, 400);
      return { error: "model and label are required" };
    }

    const { data, error } = await supabase
      .from("available_models")
      .insert({ model, label, is_active, plans })
      .select("model, label, is_active, plans, created_at, updated_at")
      .single();

    if (error) throw error;
    setResponseStatus(event, 201);
    return data;
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
