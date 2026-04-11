<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div v-if="isAuthenticated" class="hidden md:block">
      <AppSidebar />
    </div>

    <main
      class="flex-1 min-w-0"
      :class="isAuthenticated ? 'pb-24 md:pb-0' : ''"
      :style="
        isAuthenticated
          ? { paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }
          : ''
      "
    >
      <slot />
    </main>

    <AppBottomNav v-if="isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>
