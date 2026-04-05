import { createApiService } from "~/services/api";
import { createItemsService, type Item } from "~/services/items.service";
import { useAuth } from "./useAuth";

export const useItems = () => {
  const config = useRuntimeConfig();
  const { getToken } = useAuth();

  const api = createApiService(config.public.apiUrl, getToken);
  const itemsService = createItemsService(api);

  const items = useState<Item[]>("items:list", () => []);
  const loading = useState<boolean>("items:loading", () => false);
  const error = useState<string | null>("items:error", () => null);

  const fetch = async (params = {}) => {
    loading.value = true;
    error.value = null;
    try {
      items.value = await itemsService.search(params);
    } catch (e: any) {
      error.value = e.data?.error || e.message || "Failed to load items";
    } finally {
      loading.value = false;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await itemsService.updateStatus(id, status);
    const item = items.value.find((i) => i.id === id);
    if (item) item.status = status;
  };

  return { items, loading, error, fetch, updateStatus };
};
