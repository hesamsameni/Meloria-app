import { createApiService } from "~/services/api";
import {
  createItemsService,
  type Item,
  type ItemTotals,
} from "~/services/items.service";

const PAGE_SIZE = 20;

export const useItems = () => {
  const config = useRuntimeConfig();
  const { getToken } = useAuth();

  const api = createApiService(config.public.apiUrl, getToken);
  const itemsService = createItemsService(api);

  const items = useState<Item[]>("items:list", () => []);
  const loading = useState<boolean>("items:loading", () => false);
  const loadingMore = useState<boolean>("items:loadingMore", () => false);
  const hasMore = useState<boolean>("items:hasMore", () => true);
  const offset = useState<number>("items:offset", () => 0);
  const error = useState<string | null>("items:error", () => null);

  const totals = useState<ItemTotals>("items:totals", () => ({
    total: 0,
    movies: 0,
    music: 0,
    saved: 0,
    in_progress: 0,
    done: 0,
  }));
  const totalsLoading = useState<boolean>("items:totalsLoading", () => false);

  const fetchTotals = async () => {
    totalsLoading.value = true;
    try {
      totals.value = await itemsService.getTotals();
    } catch (e: any) {
      // Keep the last known totals; surface an error for visibility.
      error.value = e?.message || "Failed to load totals";
    } finally {
      totalsLoading.value = false;
    }
  };

  const fetch = async (params = {}) => {
    loading.value = true;
    error.value = null;
    offset.value = 0;

    try {
      const results = await itemsService.search({
        ...params,
        limit: PAGE_SIZE,
        offset: 0,
      });
      items.value = results;
      hasMore.value = results.length === PAGE_SIZE;
    } catch (e: any) {
      error.value = e.data?.error || e.message || "Failed to load items";
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async (params = {}) => {
    if (!hasMore.value || loadingMore.value) return;

    loadingMore.value = true;
    const nextOffset = offset.value + PAGE_SIZE;

    try {
      const results = await itemsService.search({
        ...params,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      items.value = [...items.value, ...results]; // append
      offset.value = nextOffset;
      hasMore.value = results.length === PAGE_SIZE;
    } catch (e: any) {
      error.value = e.data?.error || e.message || "Failed to load more";
    } finally {
      loadingMore.value = false;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await itemsService.updateStatus(id, status);
    const item = items.value.find((i) => i.id === id);
    if (item) item.status = status;
    fetchTotals();
  };

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    totals,
    totalsLoading,
    fetch,
    loadMore,
    fetchTotals,
    updateStatus,
  };
};
