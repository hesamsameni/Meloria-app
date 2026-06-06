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
              >
                ({{ categoryTotal(group.value) }})
              </span>
            </h2>
            <NuxtLink
              v-if="group.hasMore"
              :to="`/profile/${route.params.id}/${group.value}`"
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
          description="Nothing captured yet"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { LIBRARY_CATEGORIES } from "~/constants/items";
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

const isTabActive = (to: string) => {
  if (to === `/profile/${route.params.id}`) return isIndexPage.value;
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

// --- Library content (only on the index tab) ---
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

let _loadGeneration = 0;

const loadAll = async () => {
  if (!isIndexPage.value) return;
  const gen = ++_loadGeneration;
  globalLoading.value = true;

  await Promise.all(
    groups.value.map(async (group) => {
      group.loading = true;
      try {
        const results = await itemsService.search({
          category: group.value,
          limit: PREVIEW_LIMIT + 1,
        });
        if (gen !== _loadGeneration) return;
        group.items = results.slice(0, PREVIEW_LIMIT);
        group.hasMore = results.length > PREVIEW_LIMIT;
      } catch {
        if (gen !== _loadGeneration) return;
        group.items = [];
        group.hasMore = false;
      } finally {
        group.loading = false;
      }
    }),
  );

  if (gen === _loadGeneration) globalLoading.value = false;
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
