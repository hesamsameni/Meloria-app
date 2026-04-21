<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <UCard class="text-center py-16">
      <UIcon
        name="i-lucide-sparkles"
        class="w-10 h-10 mx-auto mb-4 text-neutral-400"
      />
      <p class="text-sm font-medium text-neutral-900 dark:text-white mb-1">
        Coming soon
      </p>
      <p class="text-xs text-neutral-400 max-w-xs mx-auto">
        Keep capturing things you enjoy and Meloria will start generating smart
        cross-category recommendations
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { setPageHeader } = usePageHeader();
useHead({ title: "Suggestions" });
setPageHeader("Suggestions", "Based on your taste profile");
</script>
