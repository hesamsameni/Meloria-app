import { storeToRefs } from "pinia";
import { useItemsStore } from "~/stores/items";

export const useItems = () => {
  const store = useItemsStore();
  const {
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
  } = storeToRefs(store);
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
    fetch: store.fetch,
    loadMore: store.loadMore,
    fetchTotals: store.fetchTotals,
    fetchCategoryTotals: store.fetchCategoryTotals,
    updateStatus: store.updateStatus,
    updateLocalStatus: store.updateLocalStatus,
    deleteItem: store.deleteItem,
  };
};
