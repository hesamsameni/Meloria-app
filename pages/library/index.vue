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

    <div v-if="globalLoading" class="flex flex-col gap-3">
      <USkeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-xl" />
    </div>

    <div v-else class="space-y-8">
      <section
        v-for="group in activeGroups"
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
            <span
              v-if="categoryTotal(group.value) !== null"
              class="text-xs font-normal text-neutral-500 dark:text-neutral-400"
              >({{ categoryTotal(group.value) }})</span
            >
          </h2>

          <NuxtLink
            v-if="group.hasMore"
            :to="`/library/${group.value}`"
            class="text-xs text-neutral-500 hover:text-primary-500 transition-colors"
          >
            View more →
          </NuxtLink>
        </div>

        <ItemList
          :items="group.items"
          :show-status="true"
          :skeleton-count="3"
          empty-message="No items in this category"
          @status-change="items.updateLocalStatus"
        />
      </section>

      <EmptyState
        v-if="activeGroups.length === 0"
        description="No items match your filters"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { LIBRARY_CATEGORIES, LIBRARY_STATUSES } from "~/constants/items";
import { createApiService } from "~/services/api";
import { createItemsService, type Item } from "~/services/items.service";

const config = useRuntimeConfig();
const auth = useAuth();
const items = useItems();
const { setPageHeader } = usePageHeader();
useHead({ title: "Library" });
setPageHeader("Library", "Everything you've captured");

const api = createApiService(config.public.apiUrl, auth.getToken);
const itemsService = createItemsService(api);

const search = ref("");
const activeStatus = ref("all");
const statuses = LIBRARY_STATUSES;

const PREVIEW_LIMIT = 6;

type CategoryGroup = {
  value: string;
  label: string;
  icon: string;
  items: Item[];
  loading: boolean;
  hasMore: boolean;
};

const groups = ref<CategoryGroup[]>(
  LIBRARY_CATEGORIES.map((cat) => ({
    ...cat,
    items: [],
    loading: true,
    hasMore: false,
  })),
);

const globalLoading = ref(true);

const activeGroups = computed(() =>
  groups.value.filter((g) => g.items.length > 0),
);

const loadAll = async () => {
  globalLoading.value = true;
  const status = activeStatus.value !== "all" ? activeStatus.value : undefined;
  const query = search.value || undefined;

  await Promise.all(
    groups.value.map(async (group) => {
      group.loading = true;
      try {
        const results = await itemsService.search({
          category: group.value,
          limit: PREVIEW_LIMIT + 1,
          ...(status ? { status } : {}),
          ...(query ? { query } : {}),
        });
        group.items = results.slice(0, PREVIEW_LIMIT);
        group.hasMore = results.length > PREVIEW_LIMIT;
      } catch {
        group.items = [];
        group.hasMore = false;
      } finally {
        group.loading = false;
      }
    }),
  );

  globalLoading.value = false;
};

const CATEGORY_TOTAL_MAP: Record<string, keyof typeof items.totals.value> = {
  movie: "movies",
  music: "music",
  show: "show",
  book: "book",
};

const categoryTotal = (catValue: string): number | null => {
  const key = CATEGORY_TOTAL_MAP[catValue];
  if (!key) return null;
  return items.totals.value[key] as number;
};

const statusCount = (status: string) => {
  if (status === "all") return items.totals.value.total;
  if (status === "want_to") return items.totals.value.want_to;
  if (status === "in_progress") return items.totals.value.in_progress;
  if (status === "finished") return items.totals.value.finished;
  if (status === "not_for_me") return items.totals.value.not_for_me;
  return 0;
};

const handleCaptured = async () => {
  await Promise.all([loadAll(), items.fetchTotals()]);
};

watch(activeStatus, () => loadAll());

let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadAll(), 600);
});

onMounted(() => {
  loadAll();
  items.fetchTotals();
});
</script>
