import { supabase } from "../../db/supabase.js";
import {
  PROFILE_FIELDS,
  withEffectiveSubscription,
  withSignedAvatarUrl,
} from "../../services/profile.js";

const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1 MB

// POST /api/profile/avatar — multipart upload (replaces multer)
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const parts = await readMultipartFormData(event);
    const file = parts?.find((p) => p.name === "file");

    if (!file || !file.data) {
      setResponseStatus(event, 400);
      return { error: "No file uploaded" };
    }

    if (file.data.length > MAX_AVATAR_BYTES) {
      setResponseStatus(event, 413);
      return { error: "Avatar must be 1MB or smaller" };
    }

    const mimetype = file.type || "";
    if (!mimetype.startsWith("image/")) {
      setResponseStatus(event, 400);
      return { error: "File must be an image" };
    }

    const bucket = process.env.SUPABASE_AVATARS_BUCKET || "profile_pictures";
    const ext = (file.filename?.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file.data, {
        upsert: true,
        contentType: mimetype || "image/png",
      });
    if (uploadError) throw uploadError;

    const { data, error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select(PROFILE_FIELDS)
      .single();
    if (updateError) throw updateError;

    return await withSignedAvatarUrl(withEffectiveSubscription(data));
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err?.message || "Upload failed" };
  }
});
