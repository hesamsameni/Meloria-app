import crypto from "crypto";
import { supabase } from "../../db/supabase.js";

// POST /api/tokens — create a new API token
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { name } = (await readBody(event)) || {};

  // generate a secure token and prefix with `meloria__`
  const token = `meloria__${crypto.randomBytes(32).toString("hex")}`;

  const { data, error } = await supabase
    .from("api_tokens")
    .insert({ user_id: userId, name, token })
    .select()
    .single();

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
  return data; // show token once — user must copy it
});
