import { supabase } from "../../db/supabase.js";

// POST /api/telegram/generate-code — short-lived link code for the dashboard
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await supabase.from("telegram_link_codes").delete().eq("user_id", userId);

  const { data, error } = await supabase
    .from("telegram_link_codes")
    .insert({
      user_id: userId,
      code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return { code: data.code, expires_at: data.expires_at };
});
