import { supabase } from "../../../../db/supabase.js";

// GET /api/intelligence/suggestions/dismissed/count
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { count, error } = await supabase
    .from("suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "dismissed");

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return { count: count ?? 0 };
});
