import { createItemsService } from "~/services/items.service";

const STORAGE_KEY = "meloria:reflect-pending";

function readCache(): boolean | null {
  if (import.meta.server) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function writeCache(value: boolean) {
  if (import.meta.server) return;
  localStorage.setItem(STORAGE_KEY, String(value));
}

/**
 * Singleton composable that tracks whether the current user has any finished
 * items still missing a reflection note.
 *
 * Seeded from localStorage on first access to avoid sidebar flicker.
 * Uses the dedicated GET /items/reflect-pending endpoint (returns only a boolean).
 *
 * `hasPending`:
 *   null  → cache miss on first ever visit; sidebar hides Reflect until fetch resolves
 *   true  → at least one item needs a reflection
 *   false → nothing pending; hide Reflect from sidebar
 */
export const useReflectPending = () => {
  const hasPending = useState<boolean | null>("reflect-pending", () =>
    readCache(),
  );

  const api = useApiService();
  const itemsService = createItemsService(api);

  const refresh = async () => {
    try {
      const { pending } = await itemsService.getReflectPending();
      hasPending.value = pending;
      writeCache(pending);
    } catch {
      // Leave existing cached value intact on error
    }
  };

  return { hasPending, refresh };
};
