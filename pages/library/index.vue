<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- capture -->
    <div class="mb-8">
      <CaptureBar @captured="handleCaptured" />
    </div>
    <!-- filters -->
    <div class="flex flex-col gap-3 mb-6">
      <UInput
        v-model="search"
        placeholder="Search by title or creator…"
        icon="i-lucide-search"
      />

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

    <div v-if="items.loading.value" class="flex flex-col gap-3">
      <USkeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-xl" />
    </div>

    <div v-else class="space-y-8">
      <section
        v-for="group in groupedCategories"
        :key="group.value"
        class="space-y-3"
      >
        <div class="flex items-center justify-between">
          <h2
            class="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2"
          >
            <UIcon
              :name="group.icon"
              class="w-4 h-4 text-neutral-500 dark:text-neutral-400"
            />
            {{ group.label }}
            <span class="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
              ({{ group.items.length }})
            </span>
          </h2>

          <NuxtLink
            :to="`/library/${group.value}`"
            class="text-xs text-neutral-500 hover:text-primary-500 transition-colors"
          >
            View more →
          </NuxtLink>
        </div>

        <ItemList
          :items="group.items.slice(0, 4)"
          :show-status="true"
          :skeleton-count="3"
          empty-message="No items in this category"
          @status-change="items.updateStatus"
        />
      </section>

      <EmptyState
        v-if="groupedCategories.length === 0"
        description="No items match your filters"
      />
    </div>

    <!-- load more -->
    <div
      v-if="items.hasMore.value && !items.loading.value"
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
import type { Item } from "~/services/items.service";

const items = useItems();
const { setPageHeader } = usePageHeader();
useHead({ title: "Library" });
setPageHeader("Library", "Everything you've captured");

const search = ref("");
const activeStatus = ref("all");

const categories = LIBRARY_CATEGORIES;
const statuses = LIBRARY_STATUSES;

const filterParams = computed(() => ({
  ...(activeStatus.value !== "all" ? { status: activeStatus.value } : {}),
  ...(search.value ? { query: search.value } : {}),
}));

const filtered = computed(() =>
  items.items.value.filter((item: Item) => {
    const matchSearch =
      !search.value ||
      item.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      item.creator?.toLowerCase().includes(search.value.toLowerCase());
    const matchStatus =
      activeStatus.value === "all" || item.status === activeStatus.value;
    return matchSearch && matchStatus;
  }),
);

const groupedCategories = computed(() => {
  return categories
    .map((category) => ({
      ...category,
      items: filtered.value.filter((item) => item.category === category.value),
    }))
    .filter((group) => group.items.length > 0);
});

const statusCount = (status: string) => {
  if (status === "all") return items.totals.value.total;
  if (status === "saved") return items.totals.value.saved;
  if (status === "in_progress") return items.totals.value.in_progress;
  if (status === "done") return items.totals.value.done;
  return 0;
};

const handleCaptured = async () => {
  await Promise.all([items.fetch(), items.fetchTotals()]);
};

const handleLoadMore = () => items.loadMore(filterParams.value);

// re-fetch when filters change
watch([activeStatus], () => {
  items.fetch(filterParams.value);
});

// debounce search
let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => items.fetch(filterParams.value), 600);
});

onMounted(() => {
  items.fetch();
  items.fetchTotals();
});
</script>
