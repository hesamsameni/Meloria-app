import { sendDigestForUser } from "../../services/weekly-digest.js";

// POST /api/admin/test-weekly-digest — send the weekly digest to a single user
export default defineEventHandler(async (event) => {
  const adminId = await requireAdmin(event);
  try {
    const body = (await readBody(event)) || {};
    const targetUserId = body?.user_id || adminId;
    const result = await sendDigestForUser(targetUserId, true);
    return { ok: true, user_id: targetUserId, ...result };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
