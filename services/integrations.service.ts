import type { createApiService } from "./api";

export type TelegramStatus = {
  linked: boolean;
  telegram_username?: string | null;
  linked_at?: string | null;
};

export type TelegramLinkCode = {
  code: string;
};

export type SpotifyStatus = {
  linked: boolean;
  spotify_user_id?: string | null;
  display_name?: string | null;
  linked_at?: string | null;
};

export const createIntegrationsService = (
  api: ReturnType<typeof createApiService>,
) => {
  // --- Telegram ---
  const getTelegramStatus = (): Promise<TelegramStatus> =>
    api.call<TelegramStatus>("/telegram/status");

  const generateTelegramCode = (): Promise<TelegramLinkCode> =>
    api.call<TelegramLinkCode>("/telegram/generate-code", { method: "POST" });

  // --- Spotify ---
  // NOTE: paths are relative to the API base (config.public.apiUrl === "/api"),
  // so the effective URLs are /api/auth/spotify/*.
  const getSpotifyStatus = (): Promise<SpotifyStatus> =>
    api.call<SpotifyStatus>("/auth/spotify/status");

  const getSpotifyAuthUrl = (returnTo: string): Promise<{ url: string }> =>
    api.call<{ url: string }>("/auth/spotify/auth-url", {
      method: "POST",
      body: { return_to: returnTo },
    });

  const disconnectSpotify = (): Promise<void> =>
    api.call<void>("/auth/spotify/disconnect", { method: "DELETE" });

  const updateSpotifyPlaylist = (playlistUrl: string): Promise<void> =>
    api.call<void>("/auth/spotify/playlist", {
      method: "PATCH",
      body: { playlist_url: playlistUrl },
    });

  return {
    getTelegramStatus,
    generateTelegramCode,
    getSpotifyStatus,
    getSpotifyAuthUrl,
    disconnectSpotify,
    updateSpotifyPlaylist,
  };
};
