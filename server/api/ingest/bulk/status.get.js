import { supabase } from "../../../db/supabase.js";

// GET /api/ingest/bulk/status — recent bulk import records for the user
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data, error } = await supabase
    .from("bulk_imports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return data || [];
});
