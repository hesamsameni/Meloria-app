import { supabase } from "../../../db/supabase.js";

// GET /api/items/:id/discussion — load existing conversation
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  try {
    const { data, error } = await supabase
      .from("item_discussions")
      .select("messages")
      .eq("user_id", userId)
      .eq("item_id", id)
      .maybeSingle();

    if (error) throw error;
    return { messages: data?.messages ?? [] };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
