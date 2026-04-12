<template>
  <UCard>
    <div class="flex items-center gap-3">
      <div
        class="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-base"
      >
        {{ icon }}
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-neutral-900 dark:text-white">
          {{ title }}
        </p>
        <p class="text-xs text-neutral-400">
          {{ description }}
        </p>
      </div>

      <UButton size="sm" variant="outline" color="neutral" disabled>
        Coming soon
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
}>();
</script>
