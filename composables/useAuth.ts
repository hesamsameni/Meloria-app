import { createAuthService } from "~/services/auth.service";

export const useAuth = () => {
  const { $supabase } = useNuxtApp();
  const authService = createAuthService($supabase as any);

  const user = useState<any>("auth:user", () => null);
  const loading = useState<boolean>("auth:loading", () => true);

  // call once on app init
  const init = async () => {
    const session = await authService.getSession();
    user.value = session?.user ?? null;
    loading.value = false;

    authService.onAuthChange((u) => {
      user.value = u;
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const data = await authService.signInWithEmail(email, password);
    user.value = data.user;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    return authService.signUpWithEmail(email, password);
  };

  const signInWithMagicLink = async (email: string) => {
    return authService.signInWithMagicLink(email);
  };

  const signInWithGoogle = async () => {
    return authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
    user.value = null;
    await navigateTo("/login");
  };

  const getToken = () => authService.getToken();

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
  };
};
