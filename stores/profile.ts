import { defineStore } from "pinia";
import { createApiService } from "~/services/api";
import {
  createProfileService,
  type UserProfile,
} from "~/services/profile.service";
import { useAuthStore } from "./auth";

export const useProfileStore = defineStore("profile", () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = createApiService(config.public.apiUrl, authStore.getToken);
  const profileService = createProfileService(api);

  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProfile = async () => {
    if (!authStore.user) return;
    loading.value = true;
    error.value = null;
    try {
      profile.value = await profileService.getProfile();
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || "Failed to load profile";
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (payload: {
    display_name?: string | null;
    username?: string | null;
    preferred_model?: string;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      profile.value = await profileService.updateProfile(payload);
      return profile.value;
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || "Failed to update profile";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const uploadAvatar = async (file: File) => {
    loading.value = true;
    error.value = null;
    try {
      profile.value = await profileService.uploadAvatar(file);
      return profile.value;
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || "Failed to upload avatar";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const displayLabel = computed(
    () =>
      profile.value?.display_name ||
      profile.value?.username ||
      authStore.user?.email ||
      "",
  );

  // Auto-fetch profile whenever the logged-in user changes
  watch(
    () => authStore.user?.id,
    async (id) => {
      profile.value = null;
      if (id) await fetchProfile();
    },
    { immediate: true },
  );

  return {
    profile,
    loading,
    error,
    displayLabel,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  };
});
