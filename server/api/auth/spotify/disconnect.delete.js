import { removeIntegration } from "../../../services/spotify-user.js";

// DELETE /api/auth/spotify/disconnect
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    await removeIntegration(userId);
    return { success: true };
  } catch (e) {
    setResponseStatus(event, 500);
    return { error: e.message };
  }
});
