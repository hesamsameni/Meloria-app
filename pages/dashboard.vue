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
      <CaptureBar @captured="handleCaptured" />
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

    <div
      v-if="items.hasMore.value && !items.loading.value"
      class="mt-4 text-center"
    >
      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="items.loadingMore.value"
        @click="items.loadMore()"
      >
        Load more
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth();
const { displayLabel } = useProfile();
const items = useItems();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const recentItems = computed(() => items.items.value);

const stats = computed(() => [
  { label: "Total saved", value: items.totals.value.total },
  {
    label: "Movies",
    value: items.totals.value.movies,
  },
  {
    label: "Music",
    value: items.totals.value.music,
  },
]);

const handleCaptured = async () => {
  await Promise.all([items.fetch(), items.fetchTotals()]);
};

const greeting = computed(() => {
  const h = new Date().getHours();
  const rawName = (displayLabel.value || user.value?.email || "").trim();
  const firstName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
  const capitalizedName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : "";

  if (h < 12)
    return capitalizedName
      ? `Good morning, ${capitalizedName}`
      : "Good morning";
  if (h < 18)
    return capitalizedName
      ? `Good afternoon, ${capitalizedName}`
      : "Good afternoon";
  return capitalizedName ? `Good evening, ${capitalizedName}` : "Good evening";
});

const today = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

onMounted(() => {
  items.fetch();
  items.fetchTotals();

  if (route.query.upgraded === "true") {
    toast.add({
      title: "You're all upgraded!",
      description: "Your subscription is now active. Enjoy the new features.",
      color: "success",
      duration: 6000,
    });
    router.replace({ query: {} });
  }
});
</script>
