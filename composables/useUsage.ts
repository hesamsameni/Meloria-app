import { createUsageService, type Usage } from "~/services/usage.service";

// Shared, app-wide usage state. Any surface (Capture bar, Settings) reads the
// same value, and `refresh()` after a capture/discussion keeps every meter in
// sync without re-fetching per component.
export const useUsage = () => {
  const usage = useState<Usage | null>("usage", () => null);
  const loading = useState<boolean>("usage-loading", () => false);
  const error = useState<string | null>("usage-error", () => null);

  const api = useApiService();
  const usageService = createUsageService(api);

  const refresh = async () => {
    loading.value = true;
    error.value = null;
    try {
      usage.value = await usageService.get();
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || "Failed to load usage";
    } finally {
      loading.value = false;
    }
  };

  // Fetch once if we don't have data yet (safe to call from multiple places).
  const ensureLoaded = async () => {
    if (usage.value || loading.value) return;
    await refresh();
  };

  return { usage, loading, error, refresh, ensureLoaded };
};
