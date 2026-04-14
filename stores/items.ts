import { defineStore } from "pinia";
import { createApiService } from "~/services/api";
import {
  createItemsService,
  type Item,
  type ItemTotals,
} from "~/services/items.service";
import { useAuthStore } from "./auth";

const PAGE_SIZE = 20;

export const useItemsStore = defineStore("items", () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = createApiService(config.public.apiUrl, authStore.getToken);
  const itemsService = createItemsService(api);

  const items = ref<Item[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const offset = ref(0);
  const error = ref<string | null>(null);
  const totals = ref<ItemTotals>({
    total: 0,
    movies: 0,
    music: 0,
    show: 0,
    book: 0,
    saved: 0,
    in_progress: 0,
    done: 0,
  });
  const totalsLoading = ref(false);

  const fetchTotals = async () => {
    totalsLoading.value = true;
    try {
      totals.value = await itemsService.getTotals();
    } catch (e: any) {
      error.value = e?.message || "Failed to load totals";
    } finally {
      totalsLoading.value = false;
    }
  };

  const fetch = async (params: Record<string, any> = {}) => {
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

  const loadMore = async (params: Record<string, any> = {}) => {
    if (!hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
    const nextOffset = offset.value + PAGE_SIZE;
    try {
      const results = await itemsService.search({
        ...params,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      items.value = [...items.value, ...results];
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
});
