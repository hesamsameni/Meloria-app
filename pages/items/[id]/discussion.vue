<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <NuxtLink
      :to="`/items/${route.params.id}`"
      class="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-950/70 backdrop-blur px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-8"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to item
    </NuxtLink>

    <div
      class="flex flex-col items-center justify-center gap-4 py-24 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="w-7 h-7 text-primary-500"
        />
      </div>
      <h1 class="text-xl font-semibold text-neutral-900 dark:text-white">
        Discussion — coming soon
      </h1>
      <p
        class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed"
      >
        This is where you'll be able to have a deep conversation with AI about
        this title — themes, recommendations, comparisons, and more.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>
