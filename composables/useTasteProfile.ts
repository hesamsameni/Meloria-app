import {
  createTasteProfileService,
  type TasteProfile,
} from "~/services/tasteProfile.service";

export const useTasteProfile = () => {
  const api = useApiService();
  const service = createTasteProfileService(api);

  const tasteProfile = ref<TasteProfile | null>(null);
  const loading = ref(false);
  const generating = ref(false);
  const notFound = ref(false);

  const fetch = async () => {
    loading.value = true;
    notFound.value = false;
    try {
      tasteProfile.value = await service.getTasteProfile();
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        notFound.value = true;
      }
    } finally {
      loading.value = false;
    }
  };

  const { error: showError, success: showSuccess } = useGlobalToast();

  const generate = async () => {
    generating.value = true;
    try {
      const res = await service.generateTasteProfile();
      if (res.ok) {
        showSuccess("Taste profile updated");
        await fetch();
      }
    } catch (e: any) {
      const message =
        e?.data?.error ||
        e?.response?.data?.error ||
        "Failed to generate taste profile";
      showError("Nothing to regenerate", message);
    } finally {
      generating.value = false;
    }
  };

  return { tasteProfile, loading, generating, notFound, fetch, generate };
};
