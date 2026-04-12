<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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
        </UButton>
      </div>
    </div>

    <ItemList
      v-if="selectedCategory"
      :items="filtered"
      :loading="items.loading.value"
      :show-status="true"
      empty-message="No items in this category yet"
      @status-change="items.updateStatus"
    />

    <EmptyState
      v-else
      description="Unknown category. Please choose a valid category from Library."
    />

    <div
      v-if="selectedCategory && items.hasMore.value && !items.loading.value"
      class="mt-6 text-center"
    >
      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="items.loadingMore.value"
        @click="items.loadMore(filterParams)"
      >
        Load more
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LIBRARY_CATEGORIES, LIBRARY_STATUSES } from "~/constants/items";
import type { Item } from "~/services/items.service";

const route = useRoute();
const items = useItems();
const { setPageHeader } = usePageHeader();

const search = ref("");
const activeStatus = ref("all");
const statuses = LIBRARY_STATUSES;

const categoryParam = computed(() => {
  const raw = route.params.category;
  return Array.isArray(raw) ? raw[0] : raw;
});

const selectedCategory = computed(() =>
  LIBRARY_CATEGORIES.find((c) => c.value === categoryParam.value),
);

const filterParams = computed(() => ({
  ...(selectedCategory.value ? { category: selectedCategory.value.value } : {}),
  ...(activeStatus.value !== "all" ? { status: activeStatus.value } : {}),
  ...(search.value ? { query: search.value } : {}),
}));

const filtered = computed(() =>
  items.items.value.filter((item: Item) => {
    if (!selectedCategory.value) return false;

    const matchCategory = item.category === selectedCategory.value.value;
    const matchSearch =
      !search.value ||
      item.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      item.creator?.toLowerCase().includes(search.value.toLowerCase());
    const matchStatus =
      activeStatus.value === "all" || item.status === activeStatus.value;

    return matchCategory && matchSearch && matchStatus;
  }),
);

watchEffect(() => {
  if (!selectedCategory.value) {
    setPageHeader("Library", "Unknown category");
    return;
  }

  setPageHeader(
    selectedCategory.value.label,
    `Browse your ${selectedCategory.value.label.toLowerCase()}`,
  );
});

watch(
  [categoryParam, activeStatus],
  () => {
    if (!selectedCategory.value) return;
    items.fetch(filterParams.value);
  },
  { immediate: true },
);

let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (!selectedCategory.value) return;
    items.fetch(filterParams.value);
  }, 400);
});
</script>
