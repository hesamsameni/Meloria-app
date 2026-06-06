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

  // journey
  finished_at: string | null;
  reflection_note: string | null;
};

export type TonightRecommendation = {
  title: string;
  category: string;
  reason: string;
  is_from_library: boolean;
  mood_match: string;
  saved_at?: string;
  item?: Item;
};

export type CapturePayload = {
  content: string;
  input_type?: string;
  source?: string;
};

export type SearchCandidate = {
  id: string;
  title: string;
  year: string | null;
  image_url: string | null;
  subtitle?: string | null;
  artist?: string | null;
  author?: string | null;
};

export type ItemTotals = {
  total: number;
  movies: number;
  music: number;
  show: number;
  book: number;
  want_to: number;
  in_progress: number;
  finished: number;
  not_for_me: number;
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

export type Suggestion = {
  id: string;
  user_id: string;
  batch_id: string;
  title: string;
  category: string;
  creator: string | null;
  artwork_url: string | null;
  backdrop_url: string | null;
  external_rating: number | null;
  release_year: string | null;
  description: string | null;
  tmdb_id: string | null;
  reason: string;
  cross_category_connection: string | null;
  mood_match: string;
  ai_confidence: number;
  status: string;
  expires_at: string;
  created_at: string;
  library_item_id: string | null;
};

export type DiscoverItem = {
  id: string;
  title: string;
  category: string;
  creator: string | null;
  description: string | null;
  image_url: string | null;
  artwork_url: string | null;
  backdrop_url: string | null;
  release_year: string | null;
  external_rating: number | null;
  genres: string[] | null;
  runtime: number | null;
  tmdb_id: string | null;
  open_library_id: string | null;
  spotify_id: string | null;
  tags: string[] | null;
  artist_image_url: string | null;
  album_name: string | null;
  author_name: string | null;
  popularity: number;
};

export type DiscoverResponse = {
  items: DiscoverItem[];
  total: number;
  hasMore: boolean;
};

export type SuggestionsResponse = {
  suggestions: Suggestion[];
  refresh_eligible: boolean;
  batch_created_at: string | null;
};

export type DiscussionMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DiscussionLimitError = {
  error: string;
  limit_type: "daily" | "conversation";
  tier: string;
  limit: number;
  upgrade_required: true;
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

  // Sure mode: live candidate search (no AI)
  const searchCandidates = async (
    category: string,
    q: string,
  ): Promise<SearchCandidate[]> => {
    const params = new URLSearchParams({ category, q });
    const result = await api.call<{ candidates: SearchCandidate[] }>(
      `/ingest/search?${params.toString()}`,
      { method: "GET" },
    );
    return result.candidates ?? [];
  };

  // Sure mode: add an exact selected item (no AI)
  const captureDirect = async (payload: {
    category: string;
    id: string;
    source?: string;
  }): Promise<Item> => {
    const result = await api.call<{ success: boolean; item: Item }>(
      "/ingest/direct",
      {
        method: "POST",
        body: {
          category: payload.category,
          id: payload.id,
          source: payload.source || "dashboard",
        },
      },
    );
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
    payload: Partial<
      Pick<
        Item,
        | "status"
        | "rating"
        | "your_notes"
        | "include_in_taste"
        | "finished_at"
        | "reflection_note"
      >
    >,
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

  const getTotals = async (
    params: { category?: string } = {},
  ): Promise<ItemTotals> => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    const url = `/items/totals${q.toString() ? `?${q.toString()}` : ""}`;
    return api.call<ItemTotals>(url, {
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

  const getReflectPending = async (): Promise<{ pending: boolean }> => {
    return api.call<{ pending: boolean }>("/items/reflect-pending", {
      method: "GET",
    });
  };

  const getReflectionQuestions = async (
    id: string,
  ): Promise<{ questions: Array<{ type: string; question: string }> }> => {
    return api.call(`/items/${id}/reflection-questions`, { method: "POST" });
  };

  const synthesizeReflection = async (
    id: string,
    payload: {
      questions: Array<{ type: string; question: string }>;
      answers: string[];
      user_rate: number | null;
      free_text?: string;
    },
  ): Promise<{ reflection_note: string; rating: number | null }> => {
    return api.call(`/items/${id}/reflection-synthesize`, {
      method: "POST",
      body: payload,
    });
  };

  const getWhatTonight = async (
    params: { mood?: string; excludeTitle?: string } = {},
  ): Promise<TonightRecommendation> => {
    return api.call<TonightRecommendation>("/intelligence/tonight", {
      method: "POST",
      body: {
        mood: params.mood || null,
        exclude_title: params.excludeTitle || null,
      },
    });
  };

  const getSuggestions = async (): Promise<SuggestionsResponse> => {
    return api.call<SuggestionsResponse>("/intelligence/suggestions", {
      method: "GET",
    });
  };

  const generateSuggestions = async (): Promise<Suggestion[]> => {
    return api.call<Suggestion[]>("/intelligence/suggestions/generate", {
      method: "POST",
    });
  };

  const dismissSuggestion = async (id: string): Promise<void> => {
    await api.call(`/intelligence/suggestions/${id}/dismiss`, {
      method: "PATCH",
    });
  };

  const saveSuggestion = async (
    id: string,
  ): Promise<{ success: boolean; item: Item }> => {
    return api.call(`/intelligence/suggestions/${id}/save`, {
      method: "POST",
    });
  };

  const getDismissedCount = async (): Promise<{ count: number }> => {
    return api.call<{ count: number }>(
      "/intelligence/suggestions/dismissed/count",
      { method: "GET" },
    );
  };

  const clearDismissed = async (): Promise<{ cleared: number }> => {
    return api.call<{ cleared: number }>(
      "/intelligence/suggestions/dismissed",
      {
        method: "DELETE",
      },
    );
  };

  const getDiscoverItems = async (
    params: { category?: string; limit?: number; offset?: number } = {},
  ): Promise<DiscoverResponse> => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.offset != null) q.set("offset", String(params.offset));
    const url = `/items/discover${q.toString() ? `?${q.toString()}` : ""}`;
    return api.call<DiscoverResponse>(url, { method: "GET" });
  };

  const addDiscoverItem = async (
    sourceId: string,
    status: "want_to" | "finished",
  ): Promise<{ item: Item }> => {
    return api.call<{ item: Item }>("/items/discover/add", {
      method: "POST",
      body: { sourceId, status },
    });
  };

  const getDiscussion = async (
    itemId: string,
  ): Promise<{ messages: DiscussionMessage[] }> => {
    return api.call<{ messages: DiscussionMessage[] }>(
      `/items/${itemId}/discussion`,
      { method: "GET" },
    );
  };

  const sendDiscussionMessage = async (
    itemId: string,
    messages: DiscussionMessage[],
  ): Promise<Response> => {
    return api.fetchStream(`/items/${itemId}/discussion`, {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  };

  return {
    capture,
    searchCandidates,
    captureDirect,
    search,
    updateStatus,
    getById,
    updateItem,
    reprocess,
    remove,
    getTotals,
    bulkImport,
    getBulkImportStatus,
    getReflectPending,
    getReflectionQuestions,
    synthesizeReflection,
    getWhatTonight,
    getSuggestions,
    generateSuggestions,
    dismissSuggestion,
    saveSuggestion,
    getDismissedCount,
    clearDismissed,
    getDiscoverItems,
    addDiscoverItem,
    getDiscussion,
    sendDiscussionMessage,
  };
};
