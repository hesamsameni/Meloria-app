<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- header -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        {{ greeting }}
      </h1>
      <p class="text-sm text-neutral-400 mt-0.5">{{ today }}</p>
    </div>

    <!-- stats -->
    <div class="grid grid-cols-3 gap-3 mb-8">
      <UCard v-for="stat in stats" :key="stat.label" class="text-center">
        <p class="text-2xl font-semibold text-neutral-900 dark:text-white">
          {{ stat.value }}
        </p>
        <p class="text-xs text-neutral-400 mt-0.5">{{ stat.label }}</p>
      </UCard>
    </div>

    <!-- capture -->
    <div class="mb-8">
      <CaptureBar @captured="items.fetch()" />
    </div>

    <!-- recent -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          Recently captured
        </h2>
        <NuxtLink
          to="/library"
          class="text-xs text-neutral-400 hover:text-primary-500 transition-colors"
        >
          View all →
        </NuxtLink>
      </div>

      <ItemList
        :items="recentItems"
        :loading="items.loading.value"
        empty-message="Nothing captured yet — use the bar above to add your first item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth();
const items = useItems();

const recentItems = computed(() => items.items.value.slice(0, 8));

const stats = computed(() => [
  { label: "Total saved", value: items.items.value.length },
  {
    label: "Movies",
    value: items.items.value.filter((i: any) => i.category === "movie").length,
  },
  {
    label: "Music",
    value: items.items.value.filter((i: any) => i.category === "music").length,
  },
]);

const greeting = computed(() => {
  const h = new Date().getHours();
  const name = user.value?.email?.split("@")[0] ?? "";
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  if (h < 12) return `Good morning, ${capitalizedName}`;
  if (h < 18) return `Good afternoon, ${capitalizedName}`;
  return `Good evening, ${capitalizedName}`;
});

const today = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

onMounted(() => items.fetch());
</script>
