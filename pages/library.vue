<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        Library
      </h1>
      <p class="text-sm text-neutral-400 mt-0.5">Everything you've captured</p>
    </div>

    <!-- filters -->
    <div class="flex flex-col gap-3 mb-6">
      <UInput
        v-model="search"
        placeholder="Search by title or creator…"
        icon="i-lucide-search"
      />

      <div class="flex items-center gap-1.5 flex-wrap">
        <UButton
          v-for="cat in categories"
          :key="cat.value"
          size="xs"
          :variant="activeCategory === cat.value ? 'solid' : 'outline'"
          :color="activeCategory === cat.value ? 'primary' : 'neutral'"
          @click="
            activeCategory = activeCategory === cat.value ? '' : cat.value
          "
        >
          {{ cat.emoji }} {{ cat.label }}
        </UButton>
      </div>

      <div class="flex items-center gap-1.5">
        <UButton
          v-for="s in statuses"
          :key="s.value"
          size="xs"
          :variant="activeStatus === s.value ? 'solid' : 'ghost'"
          :color="activeStatus === s.value ? 'primary' : 'neutral'"
          @click="activeStatus = s.value"
        >
          {{ s.label }}
          <UBadge
            v-if="statusCount(s.value)"
            :label="String(statusCount(s.value))"
            size="xs"
            class="ml-1"
          />
        </UButton>
      </div>
    </div>

    <ItemList
      :items="filtered"
      :loading="items.loading.value"
      :show-status="true"
      empty-message="No items match your filters"
      @status-change="items.updateStatus"
    />

    <!-- load more -->
    <div
      v-if="items.hasMore.value && !items.loading.value && filtered.length > 0"
      class="mt-6 text-center"
    >
      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="items.loadingMore.value"
        @click="handleLoadMore"
      >
        Load more
      </UButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LIBRARY_CATEGORIES, LIBRARY_STATUSES } from "~/constants/items";

const items = useItems();

const search = ref("");
const activeCategory = ref("");
const activeStatus = ref("all");

const categories = LIBRARY_CATEGORIES;
const statuses = LIBRARY_STATUSES;

const filterParams = computed(() => ({
  ...(activeCategory.value ? { category: activeCategory.value } : {}),
  ...(activeStatus.value !== "all" ? { status: activeStatus.value } : {}),
  ...(search.value ? { query: search.value } : {}),
}));

const filtered = computed(() =>
  items.items.value.filter((item: any) => {
    const matchSearch =
      !search.value ||
      item.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      item.creator?.toLowerCase().includes(search.value.toLowerCase());
    const matchCat =
      !activeCategory.value || item.category === activeCategory.value;
    const matchStatus =
      activeStatus.value === "all" || item.status === activeStatus.value;
    return matchSearch && matchCat && matchStatus;
  }),
);

const statusCount = (status: string) => {
  if (status === "all") return items.totals.value.total;
  if (status === "saved") return items.totals.value.saved;
  if (status === "in_progress") return items.totals.value.in_progress;
  if (status === "done") return items.totals.value.done;
  return 0;
};

const handleLoadMore = () => items.loadMore(filterParams.value);

// re-fetch when filters change
watch([activeCategory, activeStatus], () => {
  items.fetch(filterParams.value);
});

// debounce search
let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => items.fetch(filterParams.value), 400);
});

onMounted(() => {
  items.fetch();
  items.fetchTotals();
});
</script>
