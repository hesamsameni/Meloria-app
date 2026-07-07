import { exchangeAndStore } from "../../../services/spotify-user.js";
import { verifyState } from "../../../services/spotify-oauth.js";

// GET /api/auth/spotify/callback — public, called by Spotify's redirect
export default defineEventHandler(async (event) => {
  const { code, state, error } = getQuery(event);

  const frontendUrl = process.env.FRONTEND_URL || "https://meloria-app.com";

  if (error || !code || !state) {
    return sendRedirect(event, `${frontendUrl}/settings?spotify=error`);
  }

  let userId;
  try {
    userId = verifyState(state);
  } catch (e) {
    console.error("[Spotify callback] state verification failed:", e.message);
    return sendRedirect(event, `${frontendUrl}/settings?spotify=error`);
  }

  try {
    await exchangeAndStore(userId, code);
    return sendRedirect(event, `${frontendUrl}/settings?spotify=connected`);
  } catch (e) {
    console.error("[Spotify callback] exchangeAndStore failed:", e.message);
    return sendRedirect(event, `${frontendUrl}/settings?spotify=error`);
  }
});
