<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div v-if="isAuthenticated" class="hidden md:block">
      <AppSidebar />
    </div>

    <div v-if="isAuthenticated" class="md:hidden">
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
        v-if="isAuthenticated"
        class="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <UButton
            icon="i-lucide-menu"
            size="sm"
            color="neutral"
            variant="soft"
            aria-label="Open navigation menu"
            @click="isMobileSidebarOpen = true"
          />

          <div class="min-w-0 flex-1 text-right">
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
        </div>
      </div>

      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated } = useAuth();
const { title: pageHeaderTitle, description: pageHeaderDescription } =
  usePageHeader();
const isMobileSidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false;
  },
);
</script>
