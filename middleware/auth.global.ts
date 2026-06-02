export default defineNuxtRouteMiddleware(async (to) => {
  // only runs client-side
  if (import.meta.server) return;

  const { user, init, loading } = useAuth();

  if (loading.value) await init();

  // Routes anyone can access (no redirect either way)
  const publicRoutes = ["/terms", "/privacy", "/reset-password"];

  // Routes only unauthenticated users should see (authenticated → /dashboard)
  const guestOnlyRoutes = ["/login", "/welcome"];

  const isPublic = publicRoutes.includes(to.path);
  const isGuestOnly = guestOnlyRoutes.includes(to.path);

  // Unauthenticated user trying to access a private route → send to /login
  if (!user.value && !isPublic && !isGuestOnly) return navigateTo("/login");

  // Authenticated user trying to access guest-only pages → send to /dashboard
  if (user.value && isGuestOnly) return navigateTo("/dashboard");

  // Admin-only routes
  if (to.path.startsWith("/admin")) {
    const { isAdmin, profile, fetchProfile } = useProfile();
    if (!profile.value) await fetchProfile();
    if (!isAdmin.value) return navigateTo("/dashboard");
  }
});
