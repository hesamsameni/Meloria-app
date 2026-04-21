import { defineStore } from "pinia";
import { createApiService } from "~/services/api";
import {
  createItemsService,
  type Item,
  type ItemTotals,
} from "~/services/items.service";
import { useAuthStore } from "./auth";

const PAGE_SIZE = 21;

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
  const TOTALS_CACHE_KEY = "meloria:item-totals";

  const loadCachedTotals = (): ItemTotals | null => {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOTALS_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveCachedTotals = (data: ItemTotals) => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(TOTALS_CACHE_KEY, JSON.stringify(data));
    } catch {}
  };

  const cached = loadCachedTotals();
  const totals = ref<ItemTotals>(
    cached ?? {
      total: 0,
      movies: 0,
      music: 0,
      show: 0,
      book: 0,
      want_to: 0,
      in_progress: 0,
      finished: 0,
      not_for_me: 0,
    },
  );
  const totalsLoading = ref(false);
  const totalsLoaded = ref(!!cached);

  // Category-scoped totals (for library page status filters)
  const categoryTotals = ref<ItemTotals>({
    total: 0,
    movies: 0,
    music: 0,
    show: 0,
    book: 0,
    want_to: 0,
    in_progress: 0,
    finished: 0,
    not_for_me: 0,
  });
  const categoryTotalsLoading = ref(false);

  // Fetches global totals; skips if cached unless force: true
  const fetchTotals = async (params: { force?: boolean } = {}) => {
    if (!params.force && totalsLoaded.value) return;
    totalsLoading.value = true;
    try {
      const data = await itemsService.getTotals({});
      totals.value = data;
      totalsLoaded.value = true;
      saveCachedTotals(data);
    } catch (e: any) {
      error.value = e?.message || "Failed to load totals";
    } finally {
      totalsLoading.value = false;
    }
  };

  // Fetches totals scoped to a category; always fetches, never touches global totals
  const fetchCategoryTotals = async (category: string) => {
    categoryTotalsLoading.value = true;
    try {
      categoryTotals.value = await itemsService.getTotals({ category });
    } catch (e: any) {
      error.value = e?.message || "Failed to load category totals";
    } finally {
      categoryTotalsLoading.value = false;
    }
  };

  const deleteItem = async (id: string) => {
    await itemsService.remove(id);
    items.value = items.value.filter((i) => i.id !== id);
    await fetchTotals({ force: true });
  };

  const fetch = async (params: Record<string, any> = {}) => {
    const limit = params.limit ?? PAGE_SIZE;
    loading.value = true;
    error.value = null;
    offset.value = 0;
    try {
      const results = await itemsService.search({
        ...params,
        limit,
        offset: 0,
      });
      items.value = results;
      hasMore.value = results.length === limit;
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

  const patchStatusTotals = (oldStatus: string, newStatus: string) => {
    const t = totals.value as Record<string, number>;
    if (t[oldStatus] !== undefined) t[oldStatus]--;
    if (t[newStatus] !== undefined) t[newStatus]++;
  };

  const updateStatus = async (id: string, status: string) => {
    await itemsService.updateStatus(id, status);
    const item = items.value.find((i) => i.id === id);
    if (item) {
      patchStatusTotals(item.status, status);
      item.status = status;
    }
  };

  // Used when the API call has already been made by the caller (e.g. ItemCard)
  const updateLocalStatus = (id: string, status: string) => {
    const item = items.value.find((i) => i.id === id);
    if (item) {
      patchStatusTotals(item.status, status);
      item.status = status;
    }
  };

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    totals,
    totalsLoading,
    totalsLoaded,
    categoryTotals,
    categoryTotalsLoading,
    fetch,
    loadMore,
    fetchTotals,
    fetchCategoryTotals,
    updateStatus,
    updateLocalStatus,
    deleteItem,
  };
});
