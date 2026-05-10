import { createNotificationsService } from "~/services/notifications.service";
import type { AppNotification } from "~/services/notifications.service";

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export const useNotifications = () => {
  const api = useApiService();
  const notificationsService = createNotificationsService(api);

  const notifications = useState<AppNotification[]>("notifications", () => []);
  const loading = useState<boolean>("notifications-loading", () => false);

  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.read).length,
  );

  const fetch = async () => {
    if (import.meta.server) return;
    try {
      notifications.value = await notificationsService.getNotifications();
    } catch {
      // Non-critical — leave existing state
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      notifications.value = notifications.value.map((n) => ({
        ...n,
        read: true,
      }));
    } catch {
      // Ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      const n = notifications.value.find((n) => n.id === id);
      if (n) n.read = true;
    } catch {
      // Ignore
    }
  };

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (import.meta.server || pollTimer) return;
    pollTimer = setInterval(fetch, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    fetch,
    markAllRead,
    markRead,
    startPolling,
    stopPolling,
  };
};
