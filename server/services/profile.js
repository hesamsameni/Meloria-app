import { supabase } from "../db/supabase.js";

export const PROFILE_FIELDS =
  "id, username, avatar_url, subscription, subscription_status, preferred_model, display_name, current_period_end, role, notify_telegram, notify_email, created_at, updated_at";

export function withEffectiveSubscription(profileRow) {
  if (!profileRow) return profileRow;

  const tier = profileRow.subscription || "free";
  if (tier === "free") return profileRow;

  const expires = profileRow.current_period_end;
  const status = profileRow.subscription_status;

  if (expires) {
    const expiresAt = new Date(expires);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date()) {
      return { ...profileRow, subscription: "free" };
    }
  }

  if (
    (status === "canceled" ||
      status === "unpaid" ||
      status === "incomplete_expired") &&
    !expires
  ) {
    return { ...profileRow, subscription: "free" };
  }

  return profileRow;
}

export async function withSignedAvatarUrl(profileRow) {
  if (!profileRow) return profileRow;

  const avatar = profileRow.avatar_url;
  if (!avatar || typeof avatar !== "string" || avatar.startsWith("http")) {
    return profileRow;
  }

  const bucket = process.env.SUPABASE_AVATARS_BUCKET || "profile_pictures";
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(avatar, 60 * 60); // 1 hour

  if (error) return profileRow;

  return { ...profileRow, avatar_url: data?.signedUrl || null };
}
