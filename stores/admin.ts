import { defineStore } from "pinia";
import { createApiService } from "~/services/api";
import {
  createAdminService,
  type AdminUser,
  type AdminStats,
  type AvailableModel,
  type UpdateModelPayload,
  type CreateModelPayload,
} from "~/services/admin.service";
import { useAuthStore } from "./auth";

export const useAdminStore = defineStore("admin", () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = createApiService(config.public.apiUrl, authStore.getToken);
  const adminService = createAdminService(api);

  const users = ref<AdminUser[]>([]);
  const stats = ref<AdminStats | null>(null);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(50);
  const search = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);

  const models = ref<AvailableModel[]>([]);
  const modelsLoading = ref(false);
  const modelsError = ref<string | null>(null);

  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await adminService.getUsers(
        page.value,
        limit.value,
        search.value,
      );
      users.value = res.users;
      total.value = res.total;
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || "Failed to load users";
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    try {
      stats.value = await adminService.getStats();
    } catch {
      // non-critical
    }
  };

  const fetchModels = async () => {
    modelsLoading.value = true;
    modelsError.value = null;
    try {
      models.value = await adminService.getModels();
    } catch (e: any) {
      modelsError.value =
        e?.data?.error || e?.message || "Failed to load models";
    } finally {
      modelsLoading.value = false;
    }
  };

  const addModel = async (payload: CreateModelPayload) => {
    try {
      const created = await adminService.createModel(payload);
      models.value.push(created);
      return created;
    } catch (e: any) {
      modelsError.value =
        e?.data?.error || e?.message || "Failed to create model";
      throw e;
    }
  };

  const updateModel = async (model: string, payload: UpdateModelPayload) => {
    try {
      const updated = await adminService.updateModel(model, payload);
      const index = models.value.findIndex((m) => m.model === model);
      if (index !== -1) {
        models.value[index] = updated;
      }
      return updated;
    } catch (e: any) {
      modelsError.value =
        e?.data?.error || e?.message || "Failed to update model";
      throw e;
    }
  };

  const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

  return {
    users,
    stats,
    total,
    page,
    limit,
    search,
    loading,
    error,
    totalPages,
    fetchUsers,
    fetchStats,
    models,
    modelsLoading,
    modelsError,
    fetchModels,
    addModel,
    updateModel,
  };
});
