import type { createApiService } from "./api";

export type Item = {
  id: string;
  created_at: string;
  title: string | null;
  category: string;
  creator: string | null;
  description: string | null;
  tags: string[];
  source: string;
  status: string;
  rating: number | null;
  ai_notes: string | null;
  raw_input: string;
  image_url: string | null;
  external_url: string | null;
};

export type CapturePayload = {
  content: string;
  input_type?: string;
  source?: string;
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
    } = {},
  ): Promise<Item[]> => {
    return api.call<Item[]>("/mcp-test/search_items", {
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

  return { capture, search, updateStatus };
};
