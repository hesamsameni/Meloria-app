import { getCachedSpotify, setCachedSpotify } from "../services/cache.js";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Spotify token");

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function fetchDeezerArtistImage(title, artist = "") {
  try {
    const q = encodeURIComponent(`${title} ${artist}`.trim());
    const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=1`);
    const data = await res.json();
    return data.data?.[0]?.artist?.picture_xl ?? null;
  } catch {
    return null;
  }
}

export async function searchSpotify(title, artist = "") {
  try {
    // Check cache first (before any API calls)
    const cached = await getCachedSpotify(title, artist);
    if (cached) {
      return cached;
    }

    const token = await getToken();

    // build query — artist is optional
    const q = artist ? `track:${title} artist:${artist}` : title;

    const [spotifyRes, artistImageUrl] = await Promise.all([
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
      fetchDeezerArtistImage(title, artist),
    ]);

    const data = await spotifyRes.json();
    const track = data.tracks?.items?.[0];
    if (!track) return null;

    const spotifyId = track.id;

    const searchTerm = encodeURIComponent(`${title} ${artist}`.trim());

    const resultData = {
      spotify_id: spotifyId,
      spotify_url: track.external_urls.spotify,
      preview_url: track.preview_url,
      artwork_url: track.album.images[0]?.url ?? null,
      artist_image_url: artistImageUrl,
      album_name: track.album.name,
      release_year: track.album.release_date?.split("-")[0] ?? null,
      duration_ms: track.duration_ms,
      apple_music_url: `https://music.apple.com/search?term=${searchTerm}`,
      youtube_url: `https://www.youtube.com/results?search_query=${searchTerm}`,
      deezer_url: `https://www.deezer.com/search/${searchTerm}`,
    };

    // Store in cache (keyed by search query)
    await setCachedSpotify(title, artist, resultData);

    return resultData;
  } catch (e) {
    console.error("Spotify enrichment failed:", e.message);
    return null;
  }
}

// Lightweight candidate list for the capture-bar dropdown (sure mode)
export async function searchSpotifyCandidates(title) {
  try {
    const token = await getToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=track&limit=6`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    return (data.tracks?.items ?? []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.map((a) => a.name).join(", ") || null,
      year: track.album?.release_date?.split("-")[0] ?? null,
      image_url:
        track.album?.images?.[track.album.images.length - 1]?.url ?? null,
      subtitle: track.album?.name ?? null,
    }));
  } catch (e) {
    console.error("Spotify candidate search failed:", e.message);
    return [];
  }
}

// Full enrichment for an exact Spotify track id (sure-mode direct add)
export async function getSpotifyById(spotifyId) {
  try {
    const token = await getToken();
    const res = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const track = await res.json();
    if (!track || track.error || !track.id) return null;

    const artist = track.artists?.[0]?.name ?? "";
    const artistImageUrl = await fetchDeezerArtistImage(track.name, artist);
    const searchTerm = encodeURIComponent(`${track.name} ${artist}`.trim());

    return {
      spotify_id: track.id,
      title: track.name,
      category: "music",
      creator: track.artists?.map((a) => a.name).join(", ") || null,
      spotify_url: track.external_urls?.spotify ?? null,
      preview_url: track.preview_url,
      artwork_url: track.album?.images?.[0]?.url ?? null,
      artist_image_url: artistImageUrl,
      album_name: track.album?.name ?? null,
      release_year: track.album?.release_date?.split("-")[0] ?? null,
      duration_ms: track.duration_ms,
      apple_music_url: `https://music.apple.com/search?term=${searchTerm}`,
      youtube_url: `https://www.youtube.com/results?search_query=${searchTerm}`,
      deezer_url: `https://www.deezer.com/search/${searchTerm}`,
    };
  } catch (e) {
    console.error("Spotify getById failed:", e.message);
    return null;
  }
}
