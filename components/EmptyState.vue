<template>
  <div class="text-center py-12">
    <p v-if="icon" class="text-4xl mb-3">{{ icon }}</p>
    <p class="text-sm font-medium text-neutral-900 dark:text-white mb-1">
      {{ title || "Nothing here yet" }}
    </p>
    <p v-if="description" class="text-xs text-neutral-400 max-w-xs mx-auto">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title?: string;
  description?: string;
}>();
</script>
