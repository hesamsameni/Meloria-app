<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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

const handleCaptured = (newItem: Item) => {
  items.items.value.unshift(newItem);
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
  items.fetchTotals(); // uses localStorage cache, no-op if already loaded

  if (route.query.upgraded === "true") {
    toast.success(
      "You're all upgraded!",
      "Your subscription is now active. Enjoy the new features.",
    );
    router.replace({ query: {} });
  }
});
</script>
