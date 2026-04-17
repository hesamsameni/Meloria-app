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
  confidence: string | null;

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
  tmdb_cast:
    | {
        id: string;
        name: string;
        character: string | null;
        profile_url: string | null;
        source: string;
      }[]
    | null;
  tmdb_director: {
    id: string;
    name: string;
    profile_url: string | null;
    source: string;
  } | null;
  trailer_url: string | null;

  // spotify (music)
  spotify_id: string | null;
  spotify_url: string | null;
  preview_url: string | null;
  artist_image_url: string | null;
  album_name: string | null;
  duration_ms: number | null;
  apple_music_url: string | null;
  youtube_url: string | null;
  deezer_url: string | null;

  // taste profile
  include_in_taste: boolean;

  // books
  open_library_id: string | null;
  author_name: string | null;
  author_photo_url: string | null;
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
  show: number;
  book: number;
  saved: number;
  in_progress: number;
  done: number;
};

export type BulkImportRecord = {
  id: string;
  created_at: string;
  completed_at: string | null;
  user_id: string;
  total: number;
  success: number;
  failed: number;
  category_counts: Record<string, number> | null;
  limit_reached: boolean | null;
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
    const query = new URLSearchParams();
    if (params.query) query.set("query", params.query);
    if (params.category) query.set("category", params.category);
    if (params.status) query.set("status", params.status);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));

    return api.call<Item[]>(`/items/search?${query.toString()}`, {
      method: "GET",
    });
  };

  const updateStatus = async (id: string, status: string): Promise<void> => {
    await api.call(`/items/${id}`, {
      method: "PATCH",
      body: { status },
    });
  };

  const getById = async (id: string): Promise<Item> => {
    return api.call<Item>(`/items/${id}`, { method: "GET" });
  };

  const updateItem = async (
    id: string,
    payload: Partial<Pick<Item, "status" | "your_notes" | "include_in_taste">>,
  ): Promise<void> => {
    await api.call(`/items/${id}`, { method: "PATCH", body: payload });
  };

  const reprocess = async (
    id: string,
    payload: { title: string; category: string; creator?: string },
  ): Promise<Item> => {
    return api.call<Item>(`/items/${id}/reprocess`, {
      method: "POST",
      body: payload,
    });
  };

  const remove = async (id: string): Promise<void> => {
    await api.call(`/items/${id}`, { method: "DELETE" });
  };

  const getTotals = async (): Promise<ItemTotals> => {
    return api.call<ItemTotals>("/items/totals", {
      method: "GET",
    });
  };

  const bulkImport = async (
    text: string,
  ): Promise<{ queued: number; message: string }> => {
    return api.call("/ingest/bulk", { method: "POST", body: { text } });
  };

  const getBulkImportStatus = async (): Promise<BulkImportRecord[]> => {
    return api.call("/ingest/bulk/status", { method: "GET" });
  };

  return {
    capture,
    search,
    updateStatus,
    getById,
    updateItem,
    reprocess,
    remove,
    getTotals,
    bulkImport,
    getBulkImportStatus,
  };
};
