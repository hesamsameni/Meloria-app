import { supabase } from "../db/supabase.js";

/**
 * Resolve the authenticated user id from the request.
 * Supports two schemes (same as the old Express `authenticate` middleware):
 *   - API token  (Authorization: Bearer meloria__...)  — Apple Shortcut etc.
 *   - Supabase JWT (Authorization: Bearer ey...)        — dashboard session
 *
 * Throws a 401 h3 error when authentication fails.
 * Returns the user id string on success.
 */
export async function requireUser(event) {
  const authHeader = getHeader(event, "authorization");

  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: "No authorization header" });
  }

  // API token auth (Apple Shortcut)
  if (authHeader.startsWith("Bearer meloria__")) {
    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase
      .from("api_tokens")
      .select("user_id, id")
      .eq("token", token)
      .single();

    if (error || !data) {
      throw createError({ statusCode: 401, statusMessage: "Invalid API token" });
    }

    // update last used
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return data.user_id;
  }

  // Supabase JWT auth (dashboard)
  if (authHeader.startsWith("Bearer ey")) {
    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw createError({ statusCode: 401, statusMessage: "Invalid session token" });
    }

    return data.user.id;
  }

  throw createError({ statusCode: 401, statusMessage: "Unrecognized auth format" });
}

/**
 * Require that the authenticated user has the `admin` role.
 * Returns the user id on success, throws 403 otherwise.
 */
export async function requireAdmin(event) {
  const userId = await requireUser(event);

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" });
  }

  return userId;
}

/**
 * Guard for internal cron endpoints. Vercel Cron sends the CRON_SECRET as a
 * Bearer token in the Authorization header. Rejects with 401 when it doesn't match.
 */
export function requireCronSecret(event) {
  const secret = process.env.CRON_SECRET;
  const authHeader = getHeader(event, "authorization");
  const provided = authHeader?.replace("Bearer ", "");

  if (!secret || provided !== secret) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}
