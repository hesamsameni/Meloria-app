<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- capture -->
    <div class="mb-8">
      <CaptureBar @captured="handleCaptured" />
    </div>

    <!-- suggestions -->
    <div v-if="visibleSuggestions.length > 0" class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          Suggested for you
        </h2>
        <NuxtLink
          to="/suggestions"
          class="text-xs text-neutral-400 hover:text-primary-500 transition-colors"
        >
          See all →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SuggestionCard
          v-for="suggestion in visibleSuggestions"
          :key="suggestion.id"
          :suggestion="suggestion"
          :saving="savingIds.has(suggestion.id)"
          :dismissing="dismissingIds.has(suggestion.id)"
          :saved="!!savedItems[suggestion.id]"
          @save="saveSuggestion"
          @dismiss="dismissSuggestion"
          @view="viewSaved"
        />
      </div>
    </div>

    <!-- what tonight button -->
    <WhatTonightButton />

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
import type { Item, Suggestion } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";

const { user } = useAuth();
const { displayLabel } = useProfile();
const items = useItems();
const route = useRoute();
const router = useRouter();
const toast = useGlobalToast();
const posthog = usePostHog();
const { setPageHeader } = usePageHeader();
useHead({ title: "Dashboard" });

const api = useApiService();
const itemsService = createItemsService(api);

const recentItems = computed(() => items.items.value);

// --- Suggestions ---
const suggestions = ref<Suggestion[]>([]);
const savingIds = ref(new Set<string>());
const dismissingIds = ref(new Set<string>());
const savedItems = ref<Record<string, Item>>({});

const visibleSuggestions = computed(() => {
  const active = suggestions.value.filter(
    (s) => !dismissingIds.value.has(s.id),
  );
  const SCREEN_CATS = new Set(["movie", "show", "anime"]);
  const screen = active.filter((s) => SCREEN_CATS.has(s.category));
  return (screen.length > 0 ? screen : active).slice(0, 3);
});

const saveSuggestion = async (suggestion: Suggestion) => {
  savingIds.value = new Set([...savingIds.value, suggestion.id]);
  try {
    const { item } = await itemsService.saveSuggestion(suggestion.id);
    savedItems.value = { ...savedItems.value, [suggestion.id]: item };
    posthog?.capture("suggestion_saved", {
      category: suggestion.category,
      title: suggestion.title,
      source: "dashboard",
    });
    toast.success(
      "Saved to library",
      `${suggestion.title} added to your library`,
    );
  } catch (e: any) {
    toast.error(
      "Failed to save",
      e?.data?.error || e?.message || "Something went wrong",
    );
  } finally {
    const next = new Set(savingIds.value);
    next.delete(suggestion.id);
    savingIds.value = next;
  }
};

const dismissSuggestion = async (suggestion: Suggestion) => {
  dismissingIds.value = new Set([...dismissingIds.value, suggestion.id]);
  try {
    await itemsService.dismissSuggestion(suggestion.id);
    posthog?.capture("suggestion_dismissed", { source: "dashboard" });
    suggestions.value = suggestions.value.filter((s) => s.id !== suggestion.id);
  } catch (e: any) {
    toast.error(
      "Failed to dismiss",
      e?.data?.error || e?.message || "Something went wrong",
    );
  } finally {
    const next = new Set(dismissingIds.value);
    next.delete(suggestion.id);
    dismissingIds.value = next;
  }
};

const viewSaved = (suggestion: Suggestion) => {
  const item = savedItems.value[suggestion.id];
  if (item) router.push(`/items/${item.id}`);
};
// --- End suggestions ---

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
  items.fetchTotals();

  // Fetch pending suggestions silently — no generation on dashboard
  itemsService
    .getSuggestions()
    .then(({ suggestions: data }) => {
      suggestions.value = data;
    })
    .catch(() => {});

  if (user.value?.email) {
    posthog?.identify(user.value.email);
  }

  if (route.query.upgraded === "true") {
    posthog?.capture("upgrade_completed");
    toast.success(
      "You're all upgraded!",
      "Your subscription is now active. Enjoy the new features.",
    );
    router.replace({ query: {} });
  }
});
</script>
