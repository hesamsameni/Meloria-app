import { supabase } from "../db/supabase.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getIntegration(userId) {
  const { data, error } = await supabase
    .from("spotify_integrations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data; // null if not connected
}

/**
 * Returns a valid access token, refreshing it first if it expires within
 * the next 5 minutes.  Updates the row in-place so the next call is fast.
 */
async function resolveAccessToken(integration) {
  const expiresAt = new Date(integration.token_expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return integration.access_token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to refresh Spotify token");

  const newExpiry = new Date(
    Date.now() + (data.expires_in - 60) * 1000,
  ).toISOString();

  await supabase
    .from("spotify_integrations")
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiry,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    })
    .eq("user_id", integration.user_id);

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a "Meloria" playlist on the user's Spotify account if one hasn't
 * been recorded yet, stores its ID, and returns the playlist ID.
 * Safe to call multiple times — idempotent.
 */
export async function ensureMeloriaPlaylist(userId) {
  const integration = await getIntegration(userId);
  if (!integration) return null;

  if (integration.meloria_playlist_id) {
    return integration.meloria_playlist_id;
  }

  const token = await resolveAccessToken(integration);

  // We need the Spotify user ID to create a playlist in their account.
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = await meRes.json();
  if (!me.id) throw new Error("Could not fetch Spotify user ID");

  const createRes = await fetch(
    `https://api.spotify.com/v1/users/${me.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Meloria",
        public: false,
        description: "Your saved music from Meloria",
      }),
    },
  );

  const playlist = await createRes.json();
  if (!playlist.id) throw new Error("Failed to create Meloria playlist");

  await supabase
    .from("spotify_integrations")
    .update({
      meloria_playlist_id: playlist.id,
      target_playlist_id: playlist.id,
    })
    .eq("user_id", userId);

  return playlist.id;
}

/**
 * Adds a track (by Spotify track ID) to the user's target playlist.
 * Silently skips users who haven't connected Spotify.
 * Only performs the action — caller is responsible for checking tier.
 */
export async function addTrackToUserPlaylist(userId, spotifyTrackId) {
  const integration = await getIntegration(userId);
  if (!integration) return;

  const token = await resolveAccessToken(integration);

  // Resolve which playlist to target
  let playlistId =
    integration.target_playlist_id || integration.meloria_playlist_id;

  if (!playlistId) {
    // First time — create the Meloria playlist
    playlistId = await ensureMeloriaPlaylist(userId);
    if (!playlistId) return;
  }

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [`spotify:track:${spotifyTrackId}`],
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    console.error("[Spotify] addTrackToUserPlaylist failed:", err);
  }
}

/**
 * Exchanges a Spotify authorization code for tokens and stores the integration.
 * Also ensures the Meloria playlist exists.
 */
export async function exchangeAndStore(userId, code) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }),
  });

  const tokens = await res.json();
  if (!tokens.access_token)
    throw new Error(tokens.error_description || "Token exchange failed");

  const expiresAt = new Date(
    Date.now() + (tokens.expires_in - 60) * 1000,
  ).toISOString();

  // Fetch the connected Spotify user's profile
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = await meRes.json();

  // Upsert so reconnecting works cleanly
  const { error } = await supabase.from("spotify_integrations").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      spotify_user_id: me.id,
      display_name: me.display_name || me.id,
      linked_at: new Date().toISOString(),
      // Reset playlist IDs on reconnect so ensureMeloriaPlaylist re-runs
      meloria_playlist_id: null,
      target_playlist_id: null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  // Create the Meloria playlist right away (best-effort)
  await ensureMeloriaPlaylist(userId).catch((e) =>
    console.error("[Spotify] Could not create playlist on connect:", e.message),
  );
}

/**
 * Deletes the stored integration for a user.
 */
export async function removeIntegration(userId) {
  const { error } = await supabase
    .from("spotify_integrations")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

/**
 * Returns the status object sent to the frontend.
 */
export async function getStatus(userId) {
  const data = await getIntegration(userId);
  if (!data) return { linked: false };
  return {
    linked: true,
    display_name: data.display_name,
    spotify_user_id: data.spotify_user_id,
    linked_at: data.linked_at,
    meloria_playlist_id: data.meloria_playlist_id,
    target_playlist_id: data.target_playlist_id,
  };
}

/**
 * Updates the user's target playlist from a pasted Spotify URL or raw ID.
 * Returns the resolved playlist ID.
 */
export async function updateTargetPlaylist(userId, urlOrId) {
  // Accept both full URLs and bare IDs
  // https://open.spotify.com/playlist/37i9dQZEVXcJZyENOWUFo7
  const match = urlOrId.match(/playlist\/([A-Za-z0-9]+)/);
  const playlistId = match ? match[1] : urlOrId.trim();

  if (!playlistId || playlistId.length < 10) {
    throw new Error("Invalid playlist URL or ID");
  }

  const { error } = await supabase
    .from("spotify_integrations")
    .update({ target_playlist_id: playlistId })
    .eq("user_id", userId);
  if (error) throw error;

  return playlistId;
}
