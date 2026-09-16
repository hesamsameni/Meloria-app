import { supabase } from "../../db/supabase.js";

// GET /api/tokens — list the user's API tokens
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data } = await supabase
    .from("api_tokens")
    .select("id, name, last_used_at, created_at, token")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data;
});
