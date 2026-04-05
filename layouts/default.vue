<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <AppSidebar v-if="isAuthenticated" />
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>
