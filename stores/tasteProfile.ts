import { defineStore } from "pinia";
import { createApiService } from "~/services/api";
import {
  createTasteProfileService,
  type TasteProfile,
} from "~/services/tasteProfile.service";
import { useAuthStore } from "./auth";

export const useTasteProfileStore = defineStore("tasteProfile", () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = createApiService(config.public.apiUrl, authStore.getToken);
  const service = createTasteProfileService(api);

  const tasteProfile = ref<TasteProfile | null>(null);
  const loading = ref(false);
  const generating = ref(false);
  const notFound = ref(false);
  const fetched = ref(false);

  const fetch = async () => {
    if (fetched.value) return;
    loading.value = true;
    notFound.value = false;
    try {
      tasteProfile.value = await service.getTasteProfile();
      fetched.value = true;
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        notFound.value = true;
        fetched.value = true;
      }
    } finally {
      loading.value = false;
    }
  };

  const generate = async (): Promise<boolean> => {
    generating.value = true;
    try {
      const res = await service.generateTasteProfile();
      if (res.ok) {
        fetched.value = false;
        notFound.value = false;
        await fetch();
        return true;
      }
      return false;
    } finally {
      generating.value = false;
    }
  };

  return { tasteProfile, loading, generating, notFound, fetch, generate };
});
