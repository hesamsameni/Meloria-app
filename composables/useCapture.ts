import {
  createItemsService,
  type Item,
  type SearchCandidate,
} from "~/services/items.service";
import { useItemsStore } from "~/stores/items";

export const useCapture = () => {
  const api = useApiService();
  const itemsService = createItemsService(api);
  const itemsStore = useItemsStore();

  const loading = ref(false);
  const lastCaptured = ref<Item | null>(null);
  const error = ref<string | null>(null);

  const formatResetsAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const capture = async (content: string, source = "dashboard") => {
    if (!content.trim()) return null;

    loading.value = true;
    error.value = null;
    lastCaptured.value = null;

    try {
      const item = await itemsService.capture({ content, source });
      lastCaptured.value = item;
      itemsStore.fetchTotals({ force: true });
      return item;
    } catch (e: any) {
      const baseMessage = e?.data?.error || e?.message || "Failed to capture";
      const resetsAtIso = e?.data?.resets_at;
      const status = e?.statusCode || e?.status || e?.response?.status;

      if (status === 429 && typeof resetsAtIso === "string") {
        const formatted = formatResetsAt(resetsAtIso);
        error.value = formatted
          ? `${baseMessage} Your limit resets at ${formatted}.`
          : baseMessage;
      } else {
        error.value = baseMessage;
      }
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Sure mode: live candidate search (no AI). Returns [] on any failure.
  const searchCandidates = async (
    category: string,
    q: string,
  ): Promise<SearchCandidate[]> => {
    if (!q.trim()) return [];
    try {
      return await itemsService.searchCandidates(category, q);
    } catch {
      return [];
    }
  };

  // Sure mode: add an exact selected item (no AI).
  const captureDirect = async (
    category: string,
    id: string,
    source = "dashboard",
  ) => {
    loading.value = true;
    error.value = null;
    lastCaptured.value = null;

    try {
      const item = await itemsService.captureDirect({ category, id, source });
      lastCaptured.value = item;
      itemsStore.fetchTotals({ force: true });
      return item;
    } catch (e: any) {
      const baseMessage = e?.data?.error || e?.message || "Failed to capture";
      const resetsAtIso = e?.data?.resets_at;
      const status = e?.statusCode || e?.status || e?.response?.status;

      if (status === 429 && typeof resetsAtIso === "string") {
        const formatted = formatResetsAt(resetsAtIso);
        error.value = formatted
          ? `${baseMessage} Your limit resets at ${formatted}.`
          : baseMessage;
      } else {
        error.value = baseMessage;
      }
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    lastCaptured.value = null;
    error.value = null;
  };

  return {
    loading,
    lastCaptured,
    error,
    capture,
    searchCandidates,
    captureDirect,
    reset,
  };
};
