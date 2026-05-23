<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Category filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="tab in CATEGORY_TABS"
        :key="tab.value"
        size="sm"
        :variant="activeCategory === tab.value ? 'solid' : 'outline'"
        :color="activeCategory === tab.value ? 'primary' : 'neutral'"
        :icon="tab.icon"
        @click="setCategory(tab.value)"
      >
        {{ tab.label }}
      </UButton>
    </div>

    <!-- Skeleton on first load -->
    <div
      v-if="loading && items.length === 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="n in 9"
        :key="n"
        class="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      >
        <USkeleton class="h-36 w-full rounded-none" />
        <div class="p-3 space-y-2">
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-3 w-1/2" />
          <div class="flex gap-2 pt-1">
            <USkeleton class="h-7 flex-1 rounded-lg" />
            <USkeleton class="h-7 w-14 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div
      v-else-if="items.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <DiscoverCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        @added="handleAdded"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <UIcon
        name="i-lucide-compass"
        class="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3"
      />
      <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400">
        Nothing to discover here yet
      </p>
      <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        Be the first to add things to your library!
      </p>
    </div>

    <!-- Load more -->
    <div v-if="hasMore && !loading" class="mt-6 text-center">
      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load more
      </UButton>
    </div>

    <!-- Loading more spinner -->
    <div v-if="loadingMore" class="mt-4 flex justify-center">
      <UIcon
        name="i-lucide-loader-2"
        class="w-5 h-5 animate-spin text-neutral-400"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoverItem, Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";

useHead({ title: "Discover" });

const { setPageHeader } = usePageHeader();
setPageHeader("Discover", "What the community is enjoying");

const posthog = usePostHog();
const toast = useGlobalToast();
const api = useApiService();
const itemsService = createItemsService(api);

const CATEGORY_TABS = [
  { label: "All", value: "", icon: "i-lucide-compass" },
  { label: "Movies", value: "movie", icon: "i-lucide-film" },
  { label: "Shows", value: "show", icon: "i-lucide-tv" },
  { label: "Books", value: "book", icon: "i-lucide-book-open" },
  { label: "Music", value: "music", icon: "i-lucide-music-2" },
];

const PAGE_SIZE = 12;

const items = ref<DiscoverItem[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const total = ref(0);
const activeCategory = ref("");

const fetchItems = async (reset = false) => {
  if (reset) {
    loading.value = true;
    items.value = [];
  } else {
    loadingMore.value = true;
  }

  try {
    const offset = reset ? 0 : items.value.length;
    const res = await itemsService.getDiscoverItems({
      category: activeCategory.value || undefined,
      limit: PAGE_SIZE,
      offset,
    });
    if (reset) {
      items.value = res.items;
    } else {
      items.value = [...items.value, ...res.items];
    }
    total.value = res.total;
    hasMore.value = res.hasMore;
  } catch {
    if (reset) toast.error("Failed to load", "Could not load discover items");
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const setCategory = (cat: string) => {
  activeCategory.value = cat;
  fetchItems(true);
};

const loadMore = () => fetchItems(false);

const handleAdded = (item: Item) => {
  posthog?.capture("discover_item_added", {
    category: item.category,
    title: item.title,
    status: item.status,
  });
  toast.success("Added to library", `${item.title} added to your library`);
};

onMounted(() => fetchItems(true));
</script>
