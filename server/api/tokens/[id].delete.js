import { supabase } from "../../db/supabase.js";

// DELETE /api/tokens/:id — revoke a token
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");

  await supabase
    .from("api_tokens")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // safety check

  return { success: true };
});
