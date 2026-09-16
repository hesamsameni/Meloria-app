import { supabase } from "../../db/supabase.js";

// GET /api/admin/models — all available AI models with full details
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const { data, error } = await supabase
      .from("available_models")
      .select("model, label, is_active, plans, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
