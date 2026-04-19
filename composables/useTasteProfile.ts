import { storeToRefs } from "pinia";
import { useTasteProfileStore } from "~/stores/tasteProfile";

export const useTasteProfile = () => {
  const store = useTasteProfileStore();
  const { tasteProfile, loading, generating, notFound } = storeToRefs(store);

  const { error: showError, success: showSuccess } = useGlobalToast();

  const generate = async () => {
    try {
      const ok = await store.generate();
      if (ok) showSuccess("Taste profile updated");
    } catch (e: any) {
      const message =
        e?.data?.error ||
        e?.response?.data?.error ||
        "Failed to generate taste profile";
      showError("Nothing to regenerate", message);
    }
  };

  return {
    tasteProfile,
    loading,
    generating,
    notFound,
    fetch: store.fetch,
    generate,
  };
};
