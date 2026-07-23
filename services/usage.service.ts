import type { createApiService } from "./api";

export type UsageMetric = {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  resets_at: string;
};

export type Usage = {
  tier: string;
  captures: UsageMetric;
  discussions: UsageMetric & { max_messages: number };
};

export const createUsageService = (
  api: ReturnType<typeof createApiService>,
) => {
  const get = async (): Promise<Usage> => {
    return api.call<Usage>("/usage", { method: "GET" });
  };

  return { get };
};
