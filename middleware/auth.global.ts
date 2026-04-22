export default defineNuxtRouteMiddleware(async (to) => {
  // only runs client-side
  if (import.meta.server) return;

  const { user, init, loading } = useAuth();

  if (loading.value) await init();

  const publicRoutes = ["/login", "/welcome"];
  const isPublic = publicRoutes.includes(to.path);

  if (!user.value && !isPublic) return navigateTo("/login");
  if (user.value && isPublic) return navigateTo("/dashboard");
});
