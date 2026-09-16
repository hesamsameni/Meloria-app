import { supabase } from "../../db/supabase.js";

// GET /api/intelligence/taste-profile
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data, error } = await supabase
    .from("taste_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  if (!data) {
    setResponseStatus(event, 404);
    return { error: "No taste profile yet" };
  }

  return data;
});
