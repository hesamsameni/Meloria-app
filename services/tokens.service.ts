import type { createApiService } from "./api";

export type ApiToken = {
  id: string;
  name: string | null;
  last_used_at: string | null;
  created_at: string;
  token?: string;
};

export const createTokensService = (
  api: ReturnType<typeof createApiService>,
) => {
  const list = async (): Promise<ApiToken[]> => {
    return api.call<ApiToken[]>("/tokens", { method: "GET" });
  };

  const create = async (payload: { name?: string }): Promise<ApiToken> => {
    return api.call<ApiToken>("/tokens", {
      method: "POST",
      body: payload,
    });
  };

  const revoke = async (id: string): Promise<void> => {
    await api.call(`/tokens/${id}`, { method: "DELETE" });
  };

  return { list, create, revoke };
};
