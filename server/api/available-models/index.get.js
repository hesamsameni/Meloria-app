import { supabase } from "../../db/supabase.js";

// GET /api/available-models — active LLM models the user can choose from
export default defineEventHandler(async (event) => {
  await requireUser(event);
  try {
    const { data, error } = await supabase
      .from("available_models")
      .select("model, label, plans")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
