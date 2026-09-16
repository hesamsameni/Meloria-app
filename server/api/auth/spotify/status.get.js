import { getStatus } from "../../../services/spotify-user.js";

// GET /api/auth/spotify/status
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    return await getStatus(userId);
  } catch (e) {
    setResponseStatus(event, 500);
    return { error: e.message };
  }
});
