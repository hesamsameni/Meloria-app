import { supabase } from "../../db/supabase.js";

// DELETE /api/items/:id
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return { success: true };
});
