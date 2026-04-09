import type { createApiService } from "./api";

export type AvailableModel = {
  model: string;
  label: string | null;
};

export const createModelsService = (
  api: ReturnType<typeof createApiService>,
) => {
  const listAvailableModels = async (): Promise<AvailableModel[]> => {
    return api.call<AvailableModel[]>("/available-models", { method: "GET" });
  };

  return { listAvailableModels };
};
