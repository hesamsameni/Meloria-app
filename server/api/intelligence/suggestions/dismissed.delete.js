import { supabase } from "../../../db/supabase.js";

// DELETE /api/intelligence/suggestions/dismissed — clear all dismissed suggestions
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { count, error } = await supabase
    .from("suggestions")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("status", "dismissed");

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return { cleared: count ?? 0 };
});
