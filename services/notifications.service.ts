import type { createApiService } from "./api";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export const createNotificationsService = (
  api: ReturnType<typeof createApiService>,
) => {
  const getNotifications = async (): Promise<AppNotification[]> => {
    return api.call<AppNotification[]>("/notifications", { method: "GET" });
  };

  const markAllRead = async (): Promise<void> => {
    await api.call("/notifications/read-all", { method: "PATCH" });
  };

  const markRead = async (id: string): Promise<void> => {
    await api.call(`/notifications/${id}/read`, { method: "PATCH" });
  };

  return { getNotifications, markAllRead, markRead };
};
