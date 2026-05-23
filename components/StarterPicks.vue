<template>
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          What have you seen, read, or listened to?
        </h2>
        <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
          Add a few things to get your recommendations going
        </p>
      </div>
      <NuxtLink
        to="/discover"
        class="text-xs text-neutral-400 hover:text-primary-500 transition-colors shrink-0 ml-4"
      >
        See all →
      </NuxtLink>
    </div>

    <!-- Skeleton while loading -->
    <div
      v-if="loading"
      class="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shrink-0 snap-start"
        style="flex: 0 0 calc(33.333% - 11px); min-width: 220px"
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

    <!-- Cards — 3 visible, scroll to reveal more -->
    <div
      v-else-if="visibleItems.length > 0"
      class="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="shrink-0 snap-start"
        style="flex: 0 0 calc(33.333% - 11px); min-width: 220px"
      >
        <DiscoverCard
          :item="item"
          @added="(newItem) => emit('added', newItem)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoverItem, Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";

const INITIAL_LIMIT = 15;
const SHOW_MORE_LIMIT = 50;

const emit = defineEmits<{
  added: [item: Item];
}>();

const api = useApiService();
const itemsService = createItemsService(api);

const loading = ref(true);
const loadingMore = ref(false);
const items = ref<DiscoverItem[]>([]);
const hasMore = ref(false);

// Always show all fetched items — scroll handles the "3 visible" feel on mobile
const visibleItems = computed(() => items.value);

const loadMore = async () => {
  loadingMore.value = true;
  try {
    const res = await itemsService.getDiscoverItems({
      limit: SHOW_MORE_LIMIT,
      offset: items.value.length,
    });
    items.value = [...items.value, ...res.items];
    hasMore.value = res.hasMore;
  } catch {
    // fail silently
  } finally {
    loadingMore.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await itemsService.getDiscoverItems({ limit: INITIAL_LIMIT });
    items.value = res.items;
    hasMore.value = res.hasMore;
  } catch {
    // fail silently — starter picks are optional
  } finally {
    loading.value = false;
  }
});
</script>
