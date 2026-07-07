import { updateTargetPlaylist } from "../../../services/spotify-user.js";

// PATCH /api/auth/spotify/playlist — set the target playlist from a URL or ID
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { playlist_url } = (await readBody(event)) || {};

  if (!playlist_url || typeof playlist_url !== "string") {
    setResponseStatus(event, 400);
    return { error: "playlist_url is required" };
  }

  try {
    const playlistId = await updateTargetPlaylist(userId, playlist_url);
    return { success: true, target_playlist_id: playlistId };
  } catch (e) {
    setResponseStatus(event, 400);
    return { error: e.message };
  }
});
