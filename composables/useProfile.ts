import { createApiService } from "~/services/api";
import {
  createProfileService,
  type UserProfile,
} from "~/services/profile.service";

export const useProfile = () => {
  const config = useRuntimeConfig();
  const { getToken, user } = useAuth();

  const api = createApiService(config.public.apiUrl, getToken);
  const profileService = createProfileService(api);

  const profile = useState<UserProfile | null>("profile:data", () => null);
  const loading = useState<boolean>("profile:loading", () => false);
  const error = useState<string | null>("profile:error", () => null);

  const fetchProfile = async () => {
    if (!user.value) return;

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

  const displayLabel = computed(() => {
    return (
      profile.value?.display_name ||
      profile.value?.username ||
      user.value?.email ||
      ""
    );
  });

  watch(
    () => user.value?.id,
    async () => {
      profile.value = null;
      if (user.value?.id) await fetchProfile();
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
};
