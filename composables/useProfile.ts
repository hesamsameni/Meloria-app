import { storeToRefs } from "pinia";
import { useProfileStore } from "~/stores/profile";

export const useProfile = () => {
  const store = useProfileStore();
  const { profile, loading, error, displayLabel, isAdmin } = storeToRefs(store);
  return {
    profile,
    loading,
    error,
    displayLabel,
    isAdmin,
    hasRole: store.hasRole,
    fetchProfile: store.fetchProfile,
    updateProfile: store.updateProfile,
    uploadAvatar: store.uploadAvatar,
  };
};
