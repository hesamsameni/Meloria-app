import { supabase } from "../../db/supabase.js";

// GET /api/notifications — latest 30 notifications for the user
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return data || [];
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
