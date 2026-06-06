<template>
  <div
    class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-2">
      <span
        class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wide uppercase"
        >Capture</span
      >
      <NuxtLink
        to="/import"
        class="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-neutral-400 dark:text-neutral-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 shrink-0" />
        Bulk import
      </NuxtLink>
    </div>

    <!-- Category chips -->
    <div class="px-4 pb-2 flex gap-1.5 flex-nowrap">
      <button
        v-for="chip in categoryChips"
        :key="chip.key"
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors shrink-0"
        :class="
          selectedCategory === chip.key
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
        "
        @click="toggleCategory(chip.key)"
      >
        <UIcon :name="chip.icon" class="w-3 h-3 shrink-0" />
        {{ chip.label }}
      </button>
    </div>

    <!-- Input area -->
    <div class="px-4 pb-4">
      <!-- AI mode (no chip selected) -->
      <template v-if="!selectedCategory">
        <UTextarea
          v-model="input"
          :placeholder="placeholder"
          :rows="3"
          autoresize
          class="capture-textarea w-full"
          @keydown.meta.enter="handleCapture"
          @keydown.ctrl.enter="handleCapture"
        />

        <!-- Footer row -->
        <div
          class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800"
        >
          <span
            class="text-xs text-neutral-400 dark:text-neutral-600 tabular-nums"
          >
            {{
              input.trim().length > 0
                ? `${input.trim().length} chars`
                : "⌘ + Enter to capture"
            }}
          </span>
          <UButton
            @click="handleCapture"
            :loading="loading"
            :disabled="!input.trim()"
            color="primary"
            size="sm"
            class="capture-cta rounded-lg px-4"
          >
            Capture
          </UButton>
        </div>
      </template>

      <!-- Sure mode (chip selected): search + dropdown -->
      <template v-else>
        <div
          class="flex items-center gap-2 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 transition focus-within:ring-2 focus-within:ring-primary-500"
        >
          <span
            class="inline-flex items-center gap-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-medium pl-2 pr-1 py-0.5 shrink-0"
          >
            <UIcon
              v-if="selectedChip"
              :name="selectedChip.icon"
              class="w-3 h-3"
            />
            {{ selectedLabel }}
            <button
              type="button"
              aria-label="Remove category"
              class="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-primary-500/20 transition-colors"
              @click="switchToAuto"
            >
              <UIcon name="i-heroicons-x-mark-16-solid" class="w-3 h-3" />
            </button>
          </span>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search by title…"
            class="flex-1 min-w-0 bg-transparent outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            @keydown.backspace="onSearchBackspace"
          />
          <UIcon
            v-if="searching"
            name="i-heroicons-arrow-path"
            class="w-4 h-4 text-neutral-400 animate-spin shrink-0"
          />
        </div>

        <!-- Results -->
        <div class="mt-3">
          <ul
            v-if="candidates.length"
            class="flex flex-col gap-1 max-h-72 overflow-y-auto"
          >
            <li v-for="c in candidates" :key="c.id">
              <button
                type="button"
                :disabled="loading"
                class="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                @click="selectCandidate(c)"
              >
                <img
                  v-if="c.image_url"
                  :src="c.image_url"
                  :alt="c.title"
                  class="w-10 h-14 object-cover rounded shrink-0 bg-neutral-100 dark:bg-neutral-800"
                />
                <div
                  v-else
                  class="w-10 h-14 rounded shrink-0 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-photo"
                    class="w-4 h-4 text-neutral-400"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate"
                  >
                    {{ c.title }}
                    <span
                      v-if="c.year"
                      class="text-neutral-400 dark:text-neutral-500 font-normal"
                      >({{ c.year }})</span
                    >
                  </p>
                  <p
                    v-if="c.subtitle || c.artist || c.author"
                    class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
                  >
                    {{ c.subtitle || c.artist || c.author }}
                  </p>
                </div>
              </button>
            </li>
          </ul>

          <p
            v-else-if="searchQuery.trim() && !searching && searchedOnce"
            class="text-sm text-neutral-500 dark:text-neutral-400 py-2"
          >
            No matches — switch to
            <button
              type="button"
              class="underline underline-offset-2 hover:text-primary-500"
              @click="switchToAuto"
            >
              Auto
            </button>
            to let AI find it.
          </p>

          <p
            v-else-if="!searchQuery.trim()"
            class="text-xs text-neutral-400 dark:text-neutral-600 py-2"
          >
            Start typing to search.
          </p>
        </div>
      </template>
    </div>

    <!-- Feedback -->
    <Transition name="slide-fade">
      <div
        v-if="lastCaptured || error"
        class="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3"
      >
        <UAlert
          v-if="lastCaptured"
          color="success"
          variant="soft"
          :title="lastCaptured.title || 'Saved'"
          :description="
            lastCaptured.category +
            (lastCaptured.creator ? ` · ${lastCaptured.creator}` : '')
          "
          :close-button="{ onClick: reset }"
        />
        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          title="Something went wrong"
          :close-button="{ onClick: reset }"
        >
          <template #description>
            <span v-if="upgradeParts">
              {{ upgradeParts.before }}
              <NuxtLink
                to="/settings"
                class="underline underline-offset-2 hover:text-primary-500 transition-colors"
              >
                {{ upgradeParts.match }}
              </NuxtLink>
              {{ upgradeParts.after }}
            </span>
            <span v-else>{{ error }}</span>
          </template>
        </UAlert>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Item, SearchCandidate } from "~/services/items.service";
import { useCapture } from "~/composables/useCapture";

const emit = defineEmits<{ captured: [item: Item] }>();

const {
  loading,
  lastCaptured,
  error,
  capture,
  searchCandidates,
  captureDirect,
  reset,
} = useCapture();
const posthog = usePostHog();

const input = ref("");
const source = "Meloria Dashboard";

const placeholder = "Drop anything - a title, link, note, or idea";

// --- Sure mode (category chips + search dropdown) ---
const categoryChips = [
  { key: "movie", label: "Movie", icon: "i-heroicons-film" },
  { key: "show", label: "Show", icon: "i-heroicons-tv" },
  { key: "music", label: "Music", icon: "i-heroicons-musical-note" },
  { key: "book", label: "Book", icon: "i-heroicons-book-open" },
] as const;

const selectedCategory = ref<string | null>(null);
const searchQuery = ref("");
const candidates = ref<SearchCandidate[]>([]);
const searching = ref(false);
const searchedOnce = ref(false);

const selectedLabel = computed(
  () =>
    categoryChips.find((c) => c.key === selectedCategory.value)?.label || "",
);

const toggleCategory = (key: string) => {
  selectedCategory.value = selectedCategory.value === key ? null : key;
  searchQuery.value = "";
  candidates.value = [];
  searchedOnce.value = false;
  reset();
};

// Typed-prefix shortcuts (e.g. "movie: Inception") → auto sure mode.
// Ordered longest-first so "tv show:" wins over "tv:"/"show:".
const PREFIX_RULES: { prefix: string; category: string }[] = [
  { prefix: "tv show:", category: "show" },
  { prefix: "series:", category: "show" },
  { prefix: "movie:", category: "movie" },
  { prefix: "film:", category: "movie" },
  { prefix: "music:", category: "music" },
  { prefix: "song:", category: "music" },
  { prefix: "album:", category: "music" },
  { prefix: "book:", category: "book" },
  { prefix: "show:", category: "show" },
  { prefix: "tv:", category: "show" },
];

const detectPrefix = (
  text: string,
): { category: string; query: string } | null => {
  const lower = text.toLowerCase().trimStart();
  for (const rule of PREFIX_RULES) {
    if (lower.startsWith(rule.prefix)) {
      const query = text.trimStart().slice(rule.prefix.length).trim();
      return { category: rule.category, query };
    }
  }
  return null;
};

// The currently selected category chip (for the in-input pill icon).
const selectedChip = computed(
  () => categoryChips.find((c) => c.key === selectedCategory.value) || null,
);

const searchInputRef = ref<HTMLInputElement | null>(null);
const focusSearch = () => nextTick(() => searchInputRef.value?.focus());

// Move the current query into AI mode (pill X / "switch to Auto").
const switchToAuto = () => {
  const text = searchQuery.value;
  selectedCategory.value = null;
  searchQuery.value = "";
  candidates.value = [];
  searchedOnce.value = false;
  input.value = text;
};

// Backspace on an empty query removes the category pill (back to AI mode).
const onSearchBackspace = () => {
  if (!searchQuery.value) switchToAuto();
};

// Live detection while in AI mode: a matching prefix switches to sure mode,
// showing the category as a removable pill and using the rest as the query.
watch(input, (val) => {
  if (selectedCategory.value) return;
  const match = detectPrefix(val);
  if (match) {
    selectedCategory.value = match.category;
    searchQuery.value = match.query;
    input.value = "";
    candidates.value = [];
    searchedOnce.value = false;
    reset();
  }
});

// Focus the search field whenever sure mode becomes active.
watch(selectedCategory, (cat) => {
  if (cat) focusSearch();
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch([searchQuery, selectedCategory], () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  const category = selectedCategory.value;
  const q = searchQuery.value.trim();

  if (!category) {
    candidates.value = [];
    return;
  }
  if (!q) {
    candidates.value = [];
    searchedOnce.value = false;
    return;
  }

  debounceTimer = setTimeout(async () => {
    searching.value = true;
    const results = await searchCandidates(category, q);
    // Guard against stale responses after the user changed input/category
    if (selectedCategory.value === category && searchQuery.value.trim() === q) {
      candidates.value = results;
      searchedOnce.value = true;
    }
    searching.value = false;
  }, 300);
});

const selectCandidate = async (c: SearchCandidate) => {
  if (!selectedCategory.value) return;
  const category = selectedCategory.value;
  const item = await captureDirect(category, c.id, source);
  if (item) {
    posthog?.capture("item_captured", {
      category: item.category,
      source,
      mode: "sure",
    });
    searchQuery.value = "";
    candidates.value = [];
    searchedOnce.value = false;
    selectedCategory.value = null;
    emit("captured", item);
  }
};

const upgradeParts = computed(() => {
  if (!error.value) return null;
  const msg = String(error.value);

  // Turn the first occurrence of the word "upgrade" into a link.
  const idx = msg.toLowerCase().indexOf("upgrade");
  if (idx === -1) return null;

  return {
    before: msg.slice(0, idx),
    match: msg.slice(idx, idx + "upgrade".length),
    after: msg.slice(idx + "upgrade".length),
  };
});

const handleCapture = async () => {
  const item = await capture(input.value, source);
  if (item) {
    posthog?.capture("item_captured", {
      category: item.category,
      source: source,
      mode: "ai",
    });
    input.value = "";
    emit("captured", item);
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.capture-cta {
  box-shadow: 0 6px 18px -6px
    color-mix(in srgb, var(--color-primary-500) 60%, transparent);
  transition: box-shadow 0.2s ease;
}

.capture-cta:hover:not(:disabled) {
  box-shadow: 0 8px 22px -6px
    color-mix(in srgb, var(--color-primary-500) 80%, transparent);
}

:deep(.capture-textarea textarea) {
  background: transparent !important;
  resize: none;
}
</style>
