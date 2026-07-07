import { supabase } from "../../db/supabase.js";

// PATCH /api/notifications/read-all — mark all as read
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
