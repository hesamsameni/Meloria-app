import { supabase } from "../../db/supabase.js";

// GET /api/items/search — filtered, paginated list of the user's items
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const {
    query,
    category,
    status,
    limit = "20",
    offset = "0",
  } = getQuery(event);
  const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  let q = supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + cappedLimit - 1);

  if (category) q = q.eq("category", category);
  if (status) q = q.eq("status", status);
  if (query) q = q.ilike("title", `%${query}%`);

  const { data, error } = await q;
  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return data;
});
