import { storeToRefs } from "pinia";
import { useProfileStore } from "~/stores/profile";

export const useProfile = () => {
  const store = useProfileStore();
  const { profile, loading, error, displayLabel } = storeToRefs(store);
  return {
    profile,
    loading,
    error,
    displayLabel,
    fetchProfile: store.fetchProfile,
    updateProfile: store.updateProfile,
    uploadAvatar: store.uploadAvatar,
  };
};
