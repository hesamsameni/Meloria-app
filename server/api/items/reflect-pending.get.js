import { supabase } from "../../db/supabase.js";

// GET /api/items/reflect-pending — does the user have finished items lacking a reflection?
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "finished")
      .is("reflection_note", null)
      .limit(1);

    if (error) throw error;
    return { pending: data.length > 0 };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
