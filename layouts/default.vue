<template>
  <div class="relative flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Ambient warm backdrop -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-10%,var(--color-primary-100)_0%,transparent_55%),radial-gradient(50rem_35rem_at_110%_10%,#fce9d8_0%,transparent_50%)] opacity-70 dark:bg-[radial-gradient(60rem_40rem_at_15%_-10%,rgba(232,103,58,0.16)_0%,transparent_55%),radial-gradient(50rem_35rem_at_110%_10%,rgba(232,103,58,0.10)_0%,transparent_50%)] dark:opacity-100"
    />
    <div v-if="mounted && isAuthenticated" class="hidden md:block">
      <AppSidebar />
    </div>

    <div v-if="mounted && isAuthenticated" class="md:hidden">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMobileSidebarOpen"
          class="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            class="absolute inset-0 bg-black/45"
            aria-label="Close navigation menu"
            @click="isMobileSidebarOpen = false"
          />
          <div class="relative h-full pointer-events-none">
            <AppSidebar
              mobile
              class="relative z-10 pointer-events-auto"
              @close="isMobileSidebarOpen = false"
              @navigate="isMobileSidebarOpen = false"
            />
          </div>
        </div>
      </Transition>
    </div>

    <main class="flex-1 min-w-0">
      <div
        v-if="mounted && isAuthenticated"
        class="md:hidden sticky top-0 z-40 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <UButton
            icon="i-lucide-menu"
            size="sm"
            color="neutral"
            variant="soft"
            class="rounded-xl"
            aria-label="Open navigation menu"
            @click="isMobileSidebarOpen = true"
          />

          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-semibold text-neutral-900 dark:text-white truncate"
            >
              {{ pageHeaderTitle || "Meloria" }}
            </p>
            <p
              v-if="pageHeaderDescription"
              class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
            >
              {{ pageHeaderDescription }}
            </p>
          </div>

          <img
            src="/logo.svg"
            alt="Meloria"
            class="w-6 h-6 shrink-0 opacity-90"
          />
        </div>
      </div>

      <slot />
      <footer class="app-footer">
        <span>© 2026 Meloria</span>
        <span class="app-footer-sep">·</span>
        <NuxtLink to="/terms">Terms</NuxtLink>
        <span class="app-footer-sep">·</span>
        <NuxtLink to="/privacy">Privacy</NuxtLink>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated } = useAuth();
const { title: pageHeaderTitle, description: pageHeaderDescription } =
  usePageHeader();
const isMobileSidebarOpen = ref(false);

// Auth is resolved client-side, so the auth-only chrome (sidebar, mobile bar)
// must not render until after mount. Otherwise an SSR page (e.g. /terms) would
// emit the logged-out shell and hydrate into the logged-in shell — a mismatch.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false;
  },
);
</script>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 24px;
  font-size: 12px;
  color: rgb(var(--color-neutral-400));
  border-top: 1px solid rgb(var(--color-neutral-200));
}

.dark .app-footer {
  color: rgb(var(--color-neutral-500));
  border-top-color: rgb(var(--color-neutral-800));
}

.app-footer a {
  color: inherit;
  text-decoration: none;
  transition: color 0.15s;
}

.app-footer a:hover {
  color: rgb(var(--color-neutral-600));
}

.dark .app-footer a:hover {
  color: rgb(var(--color-neutral-300));
}

.app-footer-sep {
  opacity: 0.4;
}
</style>
