import type { createApiService } from "./api";
import type { UserRole } from "./profile.service";

export type AdminUser = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription: string;
  subscription_status: string | null;
  preferred_model: string | null;
  role: UserRole;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

export type AdminStats = {
  total_users: number;
  items_today: number;
  active_subscriptions: number;
};

export type AvailableModel = {
  model: string;
  label: string;
  is_active: boolean;
  plans: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateModelPayload = {
  model: string;
  label: string;
  is_active?: boolean;
  plans?: string[] | null;
};

export type UpdateModelPayload = {
  is_active?: boolean;
  plans?: string[] | null;
};

export const createAdminService = (
  api: ReturnType<typeof createApiService>,
) => {
  const getUsers = async (
    page = 1,
    limit = 50,
    search = "",
  ): Promise<AdminUsersResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    return api.call<AdminUsersResponse>(`/admin/users?${params}`);
  };

  const getStats = async (): Promise<AdminStats> => {
    return api.call<AdminStats>("/admin/stats");
  };

  const getModels = async (): Promise<AvailableModel[]> => {
    return api.call<AvailableModel[]>("/admin/models");
  };

  const createModel = async (
    payload: CreateModelPayload,
  ): Promise<AvailableModel> => {
    return api.call<AvailableModel>("/admin/models", {
      method: "POST",
      body: payload,
    });
  };

  const updateModel = async (
    model: string,
    payload: UpdateModelPayload,
  ): Promise<AvailableModel> => {
    return api.call<AvailableModel>(
      `/admin/models/${encodeURIComponent(model)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  };

  return {
    getUsers,
    getStats,
    getModels,
    createModel,
    updateModel,
  };
};
