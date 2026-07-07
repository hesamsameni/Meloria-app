import { supabase } from "../../db/supabase.js";

// GET /api/telegram/status — whether the user has linked Telegram
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data } = await supabase
    .from("telegram_links")
    .select("telegram_username, linked_at")
    .eq("user_id", userId)
    .single();

  return { linked: !!data, ...data };
});
