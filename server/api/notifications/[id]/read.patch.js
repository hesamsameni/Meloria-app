import { supabase } from "../../../db/supabase.js";

// PATCH /api/notifications/:id/read — mark a single notification as read
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
