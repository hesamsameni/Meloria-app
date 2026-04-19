<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- stats -->
    <div
      class="flex items-center justify-between mb-8 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm px-6 py-4"
    >
      <template v-for="(stat, i) in stats" :key="stat.label">
        <div class="text-center min-w-0">
          <p
            class="text-xl font-semibold text-neutral-900 dark:text-white tabular-nums"
          >
            {{ stat.value }}
          </p>
          <p class="text-xs text-neutral-400 mt-0.5 whitespace-nowrap">
            {{ stat.label }}
          </p>
        </div>
        <div
          v-if="i < stats.length - 1"
          class="h-8 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0"
        />
      </template>
    </div>

    <!-- taste profile promo -->
    <NuxtLink
      to="/taste-profile"
      class="group flex items-center justify-between gap-4 mb-8 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/50 bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-950 px-5 py-4 shadow-sm hover:shadow-md transition-all hover:border-primary-300/60 dark:hover:border-primary-700/50"
    >
      <div class="flex items-center gap-4 min-w-0">
        <div
          class="shrink-0 w-9 h-9 rounded-xl bg-primary-500/15 dark:bg-primary-500/20 flex items-center justify-center"
        >
          <UIcon name="i-lucide-fingerprint" class="w-5 h-5 text-primary-500" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            Your taste profile
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            AI-generated insights into your cinema, music &amp; book taste
          </p>
        </div>
      </div>
      <UIcon
        name="i-lucide-arrow-right"
        class="w-4 h-4 text-neutral-400 group-hover:text-primary-500 shrink-0 transition-colors"
      />
    </NuxtLink>

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
        :show-status="true"
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
import type { Item } from "~/services/items.service";

const { user } = useAuth();
const { displayLabel } = useProfile();
const items = useItems();
const route = useRoute();
const router = useRouter();
const toast = useGlobalToast();
const { setPageHeader } = usePageHeader();
useHead({ title: "Dashboard" });

const recentItems = computed(() => items.items.value);

const stats = computed(() => [
  { label: "Total", value: items.totals.value.total },
  { label: "Movies", value: items.totals.value.movies },
  { label: "Musics", value: items.totals.value.music },
  { label: "Shows", value: items.totals.value.show },
  { label: "Books", value: items.totals.value.book },
]);

const handleCaptured = (newItem: Item) => {
  items.items.value.unshift(newItem);
  items.totals.value.total++;
  const catKey = (
    { movie: "movies", music: "music", show: "show", book: "book" } as Record<
      string,
      string
    >
  )[newItem.category];
  if (catKey) (items.totals.value as Record<string, number>)[catKey]++;
  const statusKey = newItem.status as keyof typeof items.totals.value;
  if (statusKey in items.totals.value) items.totals.value[statusKey]++;
};

const greeting = computed(() => {
  const h = new Date().getHours();
  const rawName = (displayLabel.value || user.value?.email || "").trim();
  const firstName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
  const name = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : "";

  if (h < 12) return name ? `Good morning, ${name}` : "Good morning";
  if (h < 18) return name ? `Good afternoon, ${name}` : "Good afternoon";
  return name ? `Good evening, ${name}` : "Good evening";
});

const today = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

watchEffect(() => {
  setPageHeader(greeting.value, today.value);
});

onMounted(() => {
  items.fetch();
  items.fetchTotals();

  if (route.query.upgraded === "true") {
    toast.success(
      "You're all upgraded!",
      "Your subscription is now active. Enjoy the new features.",
    );
    router.replace({ query: {} });
  }
});
</script>
