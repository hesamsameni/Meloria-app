import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";

export const useAuth = () => {
  const store = useAuthStore();
  const { user, loading, isAuthenticated } = storeToRefs(store);
  return {
    user,
    loading,
    isAuthenticated,
    init: store.init,
    signInWithEmail: store.signInWithEmail,
    signUpWithEmail: store.signUpWithEmail,
    signInWithMagicLink: store.signInWithMagicLink,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
    getToken: store.getToken,
  };
};
