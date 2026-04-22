<template>
  <div class="mb-6">
    <NuxtLink
      to="/tonight"
      class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150 group"
    >
      <div class="flex items-center gap-3 min-w-0">
        <UIcon
          name="i-lucide-sparkles"
          class="w-4 h-4 text-primary-500 shrink-0"
        />
        <div class="min-w-0">
          <span class="text-sm font-medium text-neutral-900 dark:text-white">
            What tonight?
          </span>
          <span
            class="ml-2 text-xs text-neutral-400 dark:text-neutral-500 hidden sm:inline"
          >
            Get a personal pick from your library
          </span>
        </div>
      </div>
      <UIcon
        name="i-lucide-arrow-right"
        class="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
      />
    </NuxtLink>
  </div>
</template>
