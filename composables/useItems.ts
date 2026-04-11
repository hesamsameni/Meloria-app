import { storeToRefs } from "pinia";
import { useItemsStore } from "~/stores/items";

export const useItems = () => {
  const store = useItemsStore();
  const { items, loading, loadingMore, hasMore, error, totals, totalsLoading } =
    storeToRefs(store);
  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    totals,
    totalsLoading,
    fetch: store.fetch,
    loadMore: store.loadMore,
    fetchTotals: store.fetchTotals,
    updateStatus: store.updateStatus,
  };
};
