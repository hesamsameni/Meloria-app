<template>
  <div class="flex flex-col items-center text-center py-14">
    <div
      v-if="icon"
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-2xl ring-1 ring-primary-500/15"
    >
      {{ icon }}
    </div>
    <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
      {{ title || "Nothing here yet" }}
    </p>
    <p
      v-if="description"
      class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed"
    >
      {{ description }}
    </p>
    <div class="mt-4 empty:mt-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title?: string;
  description?: string;
}>();
</script>
