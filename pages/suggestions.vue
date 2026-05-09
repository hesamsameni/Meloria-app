<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Loading / generating skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center justify-between">
        <div
          class="h-4 w-36 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse"
        />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 overflow-hidden animate-pulse"
        >
          <div class="h-44 bg-neutral-100 dark:bg-neutral-800" />
          <div class="p-4 space-y-3">
            <div class="h-4 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div class="h-3 w-1/3 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div class="space-y-1.5">
              <div
                class="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-800"
              />
              <div
                class="h-3 w-4/5 rounded bg-neutral-100 dark:bg-neutral-800"
              />
            </div>
            <div
              class="h-8 w-full rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Soft error states -->
    <div
      v-else-if="softError"
      class="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
      >
        <UIcon :name="softError.icon" class="w-7 h-7 text-neutral-400" />
      </div>
      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          {{ softError.title }}
        </p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
          {{ softError.message }}
        </p>
      </div>
    </div>

    <!-- Hard error state -->
    <div
      v-else-if="fetchError"
      class="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center"
      >
        <UIcon name="i-lucide-alert-circle" class="w-7 h-7 text-red-400" />
      </div>
      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          Something went wrong
        </p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {{ fetchError }}
        </p>
        <UButton
          size="sm"
          variant="soft"
          color="neutral"
          @click="loadSuggestions"
        >
          Try again
        </UButton>
      </div>
    </div>

    <!-- Suggestions grid -->
    <div v-else-if="suggestions.length > 0" class="space-y-10">
      <!-- Header row -->
      <div class="flex items-center justify-between">
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ totalNewCount }} personalised pick{{
            totalNewCount !== 1 ? "s" : ""
          }}
          for you
        </p>
        <UButton
          v-if="refreshEligible"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="generating"
          @click="refresh"
        >
          Refresh
        </UButton>
      </div>

      <!-- Per-category sections -->
      <div v-for="section in sections" :key="section.key" class="space-y-4">
        <!-- Section header -->
        <div class="flex items-center gap-2">
          <UIcon
            :name="section.icon"
            class="w-4 h-4 text-neutral-500 dark:text-neutral-400"
          />
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ section.label }}
          </h2>
          <span class="text-xs text-neutral-400 dark:text-neutral-500">
            ({{ section.newItems.length + section.wantToItems.length }})
          </span>
        </div>

        <!-- New suggestions for this section -->
        <TransitionGroup
          v-if="section.newItems.length > 0"
          name="card-list"
          tag="div"
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <SuggestionCard
            v-for="suggestion in section.newItems"
            :key="suggestion.id"
            :suggestion="suggestion"
            :saving="savingIds.has(suggestion.id)"
            :dismissing="dismissingIds.has(suggestion.id)"
            :saved="!!savedItems[suggestion.id]"
            @save="save"
            @dismiss="(s) => dismiss(s.id)"
            @view="(s) => viewSaved(s.id)"
          />
        </TransitionGroup>

        <!-- Already in library (want_to) for this section -->
        <div v-if="section.wantToItems.length > 0" class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <div class="flex items-center gap-1.5 shrink-0">
              <UIcon
                name="i-lucide-bookmark"
                class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500"
              />
              <p
                class="text-xs font-medium text-neutral-400 dark:text-neutral-500"
              >
                Already on your list
              </p>
            </div>
            <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <TransitionGroup
            name="card-list"
            tag="div"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <SuggestionCard
              v-for="suggestion in section.wantToItems"
              :key="suggestion.id"
              :suggestion="suggestion"
              :saving="savingIds.has(suggestion.id)"
              :dismissing="dismissingIds.has(suggestion.id)"
              :saved="!!savedItems[suggestion.id]"
              @save="save"
              @dismiss="(s) => dismiss(s.id)"
              @view="(s) => viewSaved(s.id)"
            />
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-24 gap-5 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 flex items-center justify-center"
      >
        <UIcon name="i-lucide-sparkles" class="w-7 h-7 text-primary-500" />
      </div>
      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          {{
            refreshEligible ? "You've seen everything" : "No suggestions yet"
          }}
        </p>
        <p
          class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs"
          :class="{ 'mb-4': refreshEligible }"
        >
          {{
            refreshEligible
              ? "You dismissed all current picks. Generate a fresh batch?"
              : "Keep capturing things you enjoy and Meloria will generate smart cross-category recommendations"
          }}
        </p>
      </div>
      <UButton
        v-if="refreshEligible"
        size="sm"
        color="primary"
        variant="soft"
        icon="i-lucide-refresh-cw"
        :loading="generating"
        @click="refresh"
      >
        Get new suggestions
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Suggestion, Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";

const GENERATING_KEY = "meloria_suggestions_generating";
const GENERATING_TTL_MS = 3 * 60 * 1000; // 3 minutes max

function isGeneratingFlagSet(): boolean {
  const raw = sessionStorage.getItem(GENERATING_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (Date.now() - ts > GENERATING_TTL_MS) {
    sessionStorage.removeItem(GENERATING_KEY);
    return false;
  }
  return true;
}

function setGeneratingFlag() {
  sessionStorage.setItem(GENERATING_KEY, String(Date.now()));
}

function clearGeneratingFlag() {
  sessionStorage.removeItem(GENERATING_KEY);
}

useHead({ title: "Suggestions" });
const { setPageHeader } = usePageHeader();
setPageHeader("Suggestions", "Based on your taste profile");

const api = useApiService();
const itemsService = createItemsService(api);
const router = useRouter();
const toast = useGlobalToast();
const posthog = usePostHog();

const loading = ref(true);
const generating = ref(false);
const fetchError = ref<string | null>(null);
const softError = ref<{
  icon: string;
  title: string;
  message: string;
} | null>(null);
const suggestions = ref<Suggestion[]>([]);
const refreshEligible = ref(false);
const savedItems = ref<Record<string, Item>>({});
const savingIds = ref(new Set<string>());
const dismissingIds = ref(new Set<string>());

const newSuggestions = computed(() =>
  suggestions.value.filter((s) => !s.library_item_id),
);
const wantToSuggestions = computed(() =>
  suggestions.value.filter((s) => !!s.library_item_id),
);

const SECTION_DEFS = [
  {
    key: "screen",
    label: "Movies & Shows",
    icon: "i-lucide-film",
    categories: ["movie", "show", "anime"],
  },
  {
    key: "books",
    label: "Books",
    icon: "i-lucide-book-open",
    categories: ["book"],
  },
  {
    key: "music",
    label: "Music",
    icon: "i-lucide-music",
    categories: ["music"],
  },
  {
    key: "other",
    label: "More",
    icon: "i-lucide-shapes",
    categories: [] as string[],
  },
];

const knownCategories = SECTION_DEFS.flatMap((s) => s.categories);

type SuggestionSection = {
  key: string;
  label: string;
  icon: string;
  newItems: typeof suggestions.value;
  wantToItems: typeof suggestions.value;
};

const sections = computed((): SuggestionSection[] => {
  return SECTION_DEFS.map((def) => {
    const inSection =
      def.categories.length > 0
        ? suggestions.value.filter((s) => def.categories.includes(s.category))
        : suggestions.value.filter(
            (s) => !knownCategories.includes(s.category),
          );
    return {
      key: def.key,
      label: def.label,
      icon: def.icon,
      newItems: inSection.filter((s) => !s.library_item_id),
      wantToItems: inSection.filter((s) => !!s.library_item_id),
    };
  }).filter((s) => s.newItems.length > 0 || s.wantToItems.length > 0);
});

const totalNewCount = computed(
  () => suggestions.value.filter((s) => !s.library_item_id).length,
);

let pollTimer: ReturnType<typeof setTimeout> | null = null;

const softErrorMap: Record<
  string,
  { icon: string; title: string; message: string }
> = {
  no_profile: {
    icon: "i-lucide-user-circle",
    title: "No taste profile yet",
    message: "Finish a few items and generate your taste profile first.",
  },
  no_finished_items: {
    icon: "i-lucide-library",
    title: "Finish some items first",
    message:
      "Finish some movies, books, or music to get personalised suggestions.",
  },
  insufficient_candidates: {
    icon: "i-lucide-library",
    title: "Not enough data yet",
    message:
      "Not enough new content to suggest yet. Capture more movies or shows.",
  },
};

// Poll GET /intelligence/suggestions every 3s until suggestions appear or TTL expires.
function startPolling() {
  const started = Date.now();
  const poll = async () => {
    if (!isGeneratingFlagSet()) {
      // TTL expired or flag was cleared by another tab — stop
      loading.value = false;
      return;
    }
    try {
      const { suggestions: data } = await itemsService.getSuggestions();
      if (data.length > 0) {
        suggestions.value = data;
        refreshEligible.value = false;
        clearGeneratingFlag();
        loading.value = false;
        posthog?.capture("suggestions_generated", {
          count: data.length,
          trigger: "auto",
        });
        return;
      }
    } catch {
      // ignore poll errors, keep waiting
    }
    if (Date.now() - started < GENERATING_TTL_MS) {
      pollTimer = setTimeout(poll, 3000);
    } else {
      clearGeneratingFlag();
      loading.value = false;
    }
  };
  pollTimer = setTimeout(poll, 3000);
}

const loadSuggestions = async () => {
  loading.value = true;
  fetchError.value = null;
  softError.value = null;

  // If a generation was already started (this tab or another, even after refresh),
  // just poll for results instead of triggering another generation.
  if (isGeneratingFlagSet()) {
    startPolling();
    return;
  }

  try {
    const { suggestions: data, refresh_eligible } =
      await itemsService.getSuggestions();

    refreshEligible.value = refresh_eligible;
    suggestions.value = data;

    if (data.length === 0 && refresh_eligible) {
      await autoGenerate();
    }
  } catch (e: any) {
    fetchError.value =
      e?.data?.error || e?.message || "Failed to load suggestions";
  } finally {
    loading.value = false;
  }
};

const autoGenerate = async () => {
  setGeneratingFlag();
  try {
    await itemsService.generateSuggestions();
    // Re-fetch via GET to get annotated results (library_item_id etc.)
    const { suggestions: data } = await itemsService.getSuggestions();
    suggestions.value = data;
    refreshEligible.value = false;
    posthog?.capture("suggestions_generated", {
      count: data.length,
      trigger: "auto",
    });
  } catch (e: any) {
    const errorCode = e?.data?.error;
    if (errorCode && softErrorMap[errorCode]) {
      softError.value = softErrorMap[errorCode];
    } else {
      fetchError.value =
        e?.data?.message || e?.message || "Failed to generate suggestions";
    }
  } finally {
    clearGeneratingFlag();
  }
};

const refresh = async () => {
  generating.value = true;
  try {
    await itemsService.generateSuggestions();
    // Re-fetch via GET to get annotated results (library_item_id etc.)
    const { suggestions: data } = await itemsService.getSuggestions();
    suggestions.value = data;
    savedItems.value = {};
    refreshEligible.value = false;
    posthog?.capture("suggestions_generated", {
      count: data.length,
      trigger: "manual",
    });
    toast.success("Refreshed", "New suggestions are ready");
  } catch (e: any) {
    const errorCode = e?.data?.error;
    if (errorCode && softErrorMap[errorCode]) {
      toast.error("Couldn't refresh", softErrorMap[errorCode].message);
    } else {
      toast.error(
        "Failed to refresh",
        e?.data?.error || e?.message || "Something went wrong",
      );
    }
  } finally {
    generating.value = false;
  }
};

const save = async (suggestion: Suggestion) => {
  savingIds.value = new Set([...savingIds.value, suggestion.id]);
  try {
    const { item } = await itemsService.saveSuggestion(suggestion.id);
    savedItems.value = { ...savedItems.value, [suggestion.id]: item };
    posthog?.capture("suggestion_saved", {
      category: suggestion.category,
      title: suggestion.title,
    });
    toast.success(
      "Saved to library",
      `${suggestion.title} has been added to your library`,
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

const dismiss = async (id: string) => {
  dismissingIds.value = new Set([...dismissingIds.value, id]);
  try {
    await itemsService.dismissSuggestion(id);
    posthog?.capture("suggestion_dismissed");
    suggestions.value = suggestions.value.filter((s) => s.id !== id);
    // If the user dismissed the last card, immediately allow a refresh
    if (suggestions.value.length === 0) {
      refreshEligible.value = true;
    }
  } catch (e: any) {
    toast.error(
      "Failed to dismiss",
      e?.data?.error || e?.message || "Something went wrong",
    );
  } finally {
    const next = new Set(dismissingIds.value);
    next.delete(id);
    dismissingIds.value = next;
  }
};

const viewSaved = (id: string) => {
  const item = savedItems.value[id];
  if (item) router.push(`/items/${item.id}`);
  else {
    // library_item_id from suggestion (want_to case)
    const s = suggestions.value.find((s) => s.id === id);
    if (s?.library_item_id) router.push(`/items/${s.library_item_id}`);
  }
};

onMounted(loadSuggestions);

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer);
});
</script>

<style scoped>
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}
.card-list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.card-list-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
