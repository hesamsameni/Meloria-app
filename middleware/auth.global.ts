export default defineNuxtRouteMiddleware(async (to) => {
  // only runs client-side
  if (import.meta.server) return;

  const { user, init, loading } = useAuth();

  if (loading.value) await init();

  const publicRoutes = ["/login", "/welcome"];
  const isPublic = publicRoutes.includes(to.path);
  const isLoginRoute = to.path === "/login";

  if (!user.value && !isPublic) return navigateTo("/login");
  if (user.value && isLoginRoute) return navigateTo("/dashboard");

  // Admin-only routes
  if (to.path.startsWith("/admin")) {
    const { isAdmin, profile, fetchProfile } = useProfile();
    if (!profile.value) await fetchProfile();
    if (!isAdmin.value) return navigateTo("/dashboard");
  }
});
