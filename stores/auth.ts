import { defineStore } from "pinia";
import { createAuthService } from "~/services/auth.service";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<any>(null);
  const loading = ref(true);

  // Auth service is created lazily to handle the client-only Supabase plugin
  let _authService: ReturnType<typeof createAuthService> | null = null;
  const getService = () => {
    if (!_authService) {
      const { $supabase } = useNuxtApp();
      _authService = createAuthService($supabase as any);
    }
    return _authService;
  };

  // Guard so init() runs exactly once even though it's called from both the
  // global auth middleware and app.vue (onMounted). Without this we'd fetch the
  // session twice and register two onAuthStateChange listeners.
  let initPromise: Promise<void> | null = null;

  const init = (): Promise<void> => {
    if (import.meta.server) return Promise.resolve();
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const svc = getService();
      const session = await svc.getSession();
      user.value = session?.user ?? null;
      loading.value = false;
      svc.onAuthChange((u: any, event: string) => {
        user.value = u;
        if (event === "PASSWORD_RECOVERY") {
          navigateTo("/reset-password");
        }
      });
    })();

    return initPromise;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const data = await getService().signInWithEmail(email, password);
    user.value = data.user;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    return getService().signUpWithEmail(email, password);
  };

  const signInWithMagicLink = async (email: string) => {
    return getService().signInWithMagicLink(email);
  };

  const signInWithGoogle = async () => {
    return getService().signInWithGoogle();
  };

  const signOut = async () => {
    await getService().signOut();
    user.value = null;
    await navigateTo("/welcome");
  };

  const getToken = (): Promise<string | null> => {
    if (import.meta.server) return Promise.resolve(null);
    return getService().getToken();
  };

  const sendPasswordReset = async (email: string) => {
    return getService().sendPasswordReset(email);
  };

  const updatePassword = async (newPassword: string) => {
    return getService().updatePassword(newPassword);
  };

  const isAuthenticated = computed(() => !!user.value);

  return {
    user,
    loading,
    isAuthenticated,
    init,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    getToken,
    sendPasswordReset,
    updatePassword,
  };
});
