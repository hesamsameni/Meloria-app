<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Profile header -->
    <div
      class="mb-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6"
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <!-- Avatar -->
        <UAvatar
          :src="profile?.avatar_url || undefined"
          :alt="displayLabel || user?.email"
          size="xl"
          :style="`background: var(--ui-color-primary-500)`"
          class="shrink-0"
        />

        <!-- Meta -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1
              class="text-xl font-semibold text-neutral-900 dark:text-white truncate"
            >
              {{ displayLabel || user?.email }}
            </h1>
            <span
              v-if="profile?.subscription"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide capitalize"
              :class="{
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400':
                  profile.subscription === 'free',
                'bg-primary-500/10 text-primary-600 dark:text-primary-400':
                  profile.subscription === 'pro',
                'bg-amber-500/10 text-amber-600 dark:text-amber-400':
                  profile.subscription === 'ultimate',
              }"
            >
              {{ profile.subscription }}
            </span>
          </div>

          <div
            class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400"
          >
            <!-- Captured items total -->
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-library" class="w-3.5 h-3.5" />
              <strong class="text-neutral-900 dark:text-white">{{
                items.totals.value.total
              }}</strong>
              captured
            </span>
            <!-- Join date -->
            <span v-if="profile?.created_at" class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
              Joined {{ joinedDate }}
            </span>
          </div>
        </div>

        <!-- Edit button (own profile only) -->
        <NuxtLink v-if="isOwnProfile" to="/settings" class="shrink-0">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-pencil"
          >
            Edit profile
          </UButton>
        </NuxtLink>
      </div>

      <!-- Profile nav grid -->
      <div
        class="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-5 gap-2"
      >
        <NuxtLink
          v-for="tab in profileTabs"
          :key="tab.to"
          :to="tab.to"
          :title="tab.label"
          class="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all"
          :class="
            isTabActive(tab.to)
              ? 'border-primary-500 bg-primary-500/8 text-primary-600 dark:text-primary-400'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400'
          "
        >
          <UIcon :name="tab.icon" class="w-5 h-5 shrink-0" />
          <span class="hidden sm:block">{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </div>
    <!-- Sub-route child pages (suggest/reflect/etc.) -->
    <div class="mt-2">
      <NuxtPage />
    </div>

    <!-- Library content — only on the index profile page -->
    <template v-if="isIndexPage">
      <!-- Category filter buttons -->
      <div class="mt-4 grid grid-cols-4 gap-2 mb-4">
        <button
          v-for="cat in mainCategories"
          :key="cat.value"
          type="button"
          class="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all"
          :class="
            activeCategory === cat.value
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-500'
          "
          @click="toggleCategory(cat.value)"
        >
          <UIcon :name="cat.icon" class="w-5 h-5" />
          {{ cat.label }}
          <span class="text-[10px] opacity-60">{{
            categoryCount(cat.value)
          }}</span>
        </button>
      </div>

      <!-- Status filter chips -->
      <div class="flex gap-1.5 flex-wrap mb-4">
        <button
          v-for="s in LIBRARY_STATUSES"
          :key="s.value"
          type="button"
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="
            activeStatus === s.value
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          "
          @click="activeStatus = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <div
        v-if="libraryLoading && items.items.value.length === 0"
        class="flex flex-col gap-3"
      >
        <USkeleton v-for="i in 6" :key="i" class="h-24 w-full rounded-xl" />
      </div>

      <template v-else>
        <ItemList
          :items="filteredItems"
          :show-status="true"
          :skeleton-count="6"
          empty-message="Nothing captured yet"
          @status-change="items.updateLocalStatus"
        />

        <div v-if="hasMore" class="mt-4 text-center">
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
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { LIBRARY_STATUSES } from "~/constants/items";
import { createItemsService, type Item } from "~/services/items.service";

const route = useRoute();
const { user } = useAuth();
const { profile, displayLabel } = useProfile();
const items = useItems();
const api = useApiService();
const itemsService = createItemsService(api);
const { setPageHeader } = usePageHeader();
useHead({ title: "Profile" });

const isOwnProfile = computed(() => user.value?.id === route.params.id);

// Redirect if someone navigates to another user's id — future feature
// For now just show own profile for any id access while authenticated

const profileTabs = computed(() => {
  const id = route.params.id as string;
  return [
    {
      to: `/profile/${id}`,
      label: "Library",
      icon: "i-lucide-library",
    },
    {
      to: `/profile/${id}/suggestions`,
      label: "Suggestions",
      icon: "i-lucide-sparkles",
    },
    {
      to: `/profile/${id}/taste-profile`,
      label: "Taste Profile",
      icon: "i-lucide-fingerprint",
    },
    {
      to: `/profile/${id}/reflect`,
      label: "Reflect",
      icon: "i-lucide-notebook-pen",
    },
    {
      to: `/profile/${id}/tonight`,
      label: "Tonight",
      icon: "i-lucide-moon",
    },
  ];
});

const isIndexPage = computed(
  () => route.path === `/profile/${route.params.id}`,
);

const CATEGORY_SLUGS = ["movie", "show", "music", "book"];

const isOnCategorySubRoute = computed(() =>
  CATEGORY_SLUGS.some((s) => route.path === `/profile/${route.params.id}/${s}`),
);

const isTabActive = (to: string) => {
  if (to === `/profile/${route.params.id}`)
    return isIndexPage.value || isOnCategorySubRoute.value;
  return route.path.startsWith(to);
};

const joinedDate = computed(() => {
  if (!profile.value?.created_at) return null;
  return new Date(profile.value.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

watchEffect(() => {
  setPageHeader(displayLabel.value || "Profile", "Your Meloria profile");
});

watch(
  () => route.path,
  (path) => {
    if (path === `/profile/${route.params.id}` || isOnCategorySubRoute.value) {
      setPageHeader(displayLabel.value || "Profile", "Your Meloria profile");
      useHead({ title: "Profile" });
    }
  },
);

// --- Library content (only on the index tab) ---
const mainCategories = [
  { value: "movie", label: "Movies", icon: "i-lucide-film" },
  { value: "music", label: "Music", icon: "i-lucide-music-2" },
  { value: "book", label: "Books", icon: "i-lucide-book-open" },
  { value: "show", label: "TV Shows", icon: "i-lucide-tv" },
];

const PAGE_SIZE = 48;

const activeCategory = ref<string | null>(null);
const activeStatus = ref("all");
const itemsByCategory = ref<Record<string, Item[]>>({});
const offsetByCategory = ref<Record<string, number>>({});
const hasMoreByCategory = ref<Record<string, boolean>>({});
const libraryLoading = ref(true);
const loadingMore = ref(false);

const baseItems = computed(() => {
  if (activeCategory.value) {
    return itemsByCategory.value[activeCategory.value] ?? [];
  }
  // Merge all per-category results if loaded, otherwise fall back to dashboard store items
  const hasCategoryData = mainCategories.some(
    (c) => (itemsByCategory.value[c.value] ?? []).length > 0,
  );
  if (!hasCategoryData) {
    return items.items.value;
  }
  const all = mainCategories.flatMap(
    (c) => itemsByCategory.value[c.value] ?? [],
  );
  return all.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
});

const filteredItems = computed(() => {
  if (activeStatus.value === "all") return baseItems.value;
  return baseItems.value.filter((i) => i.status === activeStatus.value);
});

const hasMore = computed(() => {
  if (activeCategory.value) {
    return hasMoreByCategory.value[activeCategory.value] ?? false;
  }
  return mainCategories.some((c) => hasMoreByCategory.value[c.value]);
});

const CATEGORY_TOTAL_KEY: Record<string, string> = {
  movie: "movies",
  music: "music",
  show: "show",
  book: "book",
};

const categoryCount = (val: string): number => {
  const key = CATEGORY_TOTAL_KEY[val];
  return key ? ((items.totals.value as Record<string, number>)[key] ?? 0) : 0;
};

const toggleCategory = (val: string) => {
  activeCategory.value = activeCategory.value === val ? null : val;
};

const saveCache = () => {
  items.setProfileLibraryCache({
    itemsByCategory: { ...itemsByCategory.value },
    offsetByCategory: { ...offsetByCategory.value },
    hasMoreByCategory: { ...hasMoreByCategory.value },
  });
};

const loadAll = async () => {
  if (!isIndexPage.value) return;

  // Restore from Pinia cache if available — skip re-fetch
  const cache = items.profileLibraryCache.value;
  if (cache) {
    itemsByCategory.value = cache.itemsByCategory;
    offsetByCategory.value = cache.offsetByCategory;
    hasMoreByCategory.value = cache.hasMoreByCategory;
    libraryLoading.value = false;
    return;
  }

  libraryLoading.value = true;
  itemsByCategory.value = {};
  offsetByCategory.value = {};
  hasMoreByCategory.value = {};
  try {
    await Promise.all(
      mainCategories.map(async (cat) => {
        const results = await itemsService.search({
          category: cat.value,
          limit: PAGE_SIZE,
          offset: 0,
        });
        itemsByCategory.value[cat.value] = results;
        offsetByCategory.value[cat.value] = results.length;
        hasMoreByCategory.value[cat.value] = results.length === PAGE_SIZE;
      }),
    );
    saveCache();
  } catch {
    // silent
  } finally {
    libraryLoading.value = false;
  }
};

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const categoriesToLoad = activeCategory.value
      ? [activeCategory.value]
      : mainCategories
          .filter((c) => hasMoreByCategory.value[c.value])
          .map((c) => c.value);

    await Promise.all(
      categoriesToLoad.map(async (cat) => {
        const offset = offsetByCategory.value[cat] ?? 0;
        const results = await itemsService.search({
          category: cat,
          limit: PAGE_SIZE,
          offset,
        });
        itemsByCategory.value[cat] = [
          ...(itemsByCategory.value[cat] ?? []),
          ...results,
        ];
        offsetByCategory.value[cat] = offset + results.length;
        hasMoreByCategory.value[cat] = results.length === PAGE_SIZE;
      }),
    );
    saveCache();
  } catch {
    // silent
  } finally {
    loadingMore.value = false;
  }
};

watch(
  () => route.path,
  () => {
    if (isIndexPage.value) loadAll();
  },
);

onMounted(() => {
  loadAll();
  items.fetchTotals();
});
</script>
