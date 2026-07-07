import { supabase } from "../../db/supabase.js";

// GET /api/items/:id
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) {
    setResponseStatus(event, 404);
    return { error: "Not found" };
  }
  return data;
});
