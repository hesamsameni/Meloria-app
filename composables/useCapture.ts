import { createApiService } from "~/services/api";
import { createItemsService, type Item } from "~/services/items.service";
import { useAuth } from "./useAuth";

export const useCapture = () => {
  const config = useRuntimeConfig();
  const { getToken } = useAuth();

  const api = createApiService(config.public.apiUrl, getToken);
  const itemsService = createItemsService(api);

  const loading = ref(false);
  const lastCaptured = ref<Item | null>(null);
  const error = ref<string | null>(null);

  const capture = async (content: string, source = "dashboard") => {
    if (!content.trim()) return null;

    loading.value = true;
    error.value = null;
    lastCaptured.value = null;

    try {
      const item = await itemsService.capture({ content, source });
      lastCaptured.value = item;
      return item;
    } catch (e: any) {
      error.value = e.data?.error || e.message || "Failed to capture";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    lastCaptured.value = null;
    error.value = null;
  };

  return { loading, lastCaptured, error, capture, reset };
};
