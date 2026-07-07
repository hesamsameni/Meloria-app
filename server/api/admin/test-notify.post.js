import { notify } from "../../services/notify.js";

const VALID_EVENT_TYPES = ["taste_profile_updated", "suggestions_ready"];

// POST /api/admin/test-notify — fire a notification for a specific user
export default defineEventHandler(async (event) => {
  const adminId = await requireAdmin(event);
  try {
    const { event_type, user_id } = (await readBody(event)) || {};

    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      setResponseStatus(event, 400);
      return {
        error: `event_type must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
      };
    }

    const targetUserId = user_id || adminId;
    await notify(targetUserId, event_type);

    return { ok: true, user_id: targetUserId, event_type };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
