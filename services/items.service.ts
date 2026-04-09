import type { createApiService } from "./api";

export type Item = {
  // core
  id: string;
  created_at: string;
  raw_input: string;
  input_type: string;
  source: string;
  status: string;
  rating: number | null;
  your_notes: string | null;

  // AI extracted
  category: string;
  title: string | null;
  creator: string | null;
  description: string | null;
  tags: string[] | null;
  ai_notes: string | null;
  note_type: string | null;

  // urls
  image_url: string | null;
  external_url: string | null;

  // shared enrichment
  artwork_url: string | null;
  backdrop_url: string | null;
  release_year: string | null;
  external_rating: number | null;
  genres: string[] | null;
  runtime: number | null;

  // tmdb (movies & shows)
  tmdb_id: string | null;

  // spotify (music)
  spotify_id: string | null;
  spotify_url: string | null;
  preview_url: string | null;
  album_name: string | null;
  duration_ms: number | null;
  apple_music_url: string | null;
  youtube_url: string | null;
  deezer_url: string | null;

  // books
  open_library_id: string | null;
  amazon_url: string | null;
  goodreads_url: string | null;
  audible_url: string | null;
};

export type CapturePayload = {
  content: string;
  input_type?: string;
  source?: string;
};

export type ItemTotals = {
  total: number;
  movies: number;
  music: number;
  saved: number;
  in_progress: number;
  done: number;
};

export const createItemsService = (
  api: ReturnType<typeof createApiService>,
) => {
  const capture = async (payload: CapturePayload): Promise<Item> => {
    const result = await api.call<{ success: boolean; item: Item }>("/ingest", {
      method: "POST",
      body: {
        content: payload.content,
        input_type: payload.input_type || "text",
        source: payload.source || "dashboard",
      },
    });
    return result.item;
  };

  const search = async (
    params: {
      query?: string;
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Item[]> => {
    return api.call<Item[]>("/mcp/search_items", {
      method: "POST",
      body: params,
    });
  };

  const updateStatus = async (id: string, status: string): Promise<void> => {
    await api.call(`/items/${id}`, {
      method: "PATCH",
      body: { status },
    });
  };

  const getTotals = async (): Promise<ItemTotals> => {
    return api.call<ItemTotals>("/items/totals", {
      method: "GET",
    });
  };

  return { capture, search, updateStatus, getTotals };
};
