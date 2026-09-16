import { signState } from "../../../services/spotify-oauth.js";

// POST /api/auth/spotify/auth-url — returns the Spotify OAuth URL
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const state = signState(userId);

  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
    "user-read-email",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scopes,
    state,
  });

  return { url: `https://accounts.spotify.com/authorize?${params}` };
});
