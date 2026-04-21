<template>
  <div
    v-if="item"
    class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div
        class="absolute -left-24 top-8 h-48 w-48 rounded-full bg-primary-400/15 blur-3xl"
      />
      <div
        class="absolute right-0 top-14 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
      />
    </div>

    <div class="flex justify-between">
      <NuxtLink
        to="/library"
        class="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-950/70 backdrop-blur px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to library
      </NuxtLink>
    </div>

    <ItemHero :item="item" @status-change="handleStatusChange" />

    <div class="grid grid-cols-1 gap-5 sm:gap-6 mb-6">
      <UCard
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        v-if="
          item.author_name ||
          (item.tmdb_director && Object.keys(item.tmdb_director).length > 0) ||
          item.tmdb_cast?.length
        "
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Cast & Crew
          </p>
        </template>
        <ItemCastAndCrew :item="item" />
      </UCard>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5 sm:gap-6"
    >
      <div class="space-y-5 sm:space-y-6">
        <UCard
          v-if="embedLabel"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              {{ embedLabel }}
            </p>
          </template>
          <ItemEmbeds :item="item" />
        </UCard>

        <UCard
          v-if="item.description"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Description
            </p>
          </template>
          <p
            class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
          >
            {{ item.description }}
          </p>
        </UCard>

        <UCard
          v-if="item.ai_notes"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              AI Notes
            </p>
          </template>
          <div class="flex items-start gap-2.5">
            <UIcon
              name="i-lucide-sparkles"
              class="w-4 h-4 text-primary-500 shrink-0 mt-0.5"
            />
            <p
              class="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed"
            >
              {{ item.ai_notes }}
            </p>
          </div>
        </UCard>

        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Your Notes
            </p>
          </template>
          <UTextarea
            v-model="userNotes"
            placeholder="Add your thoughts..."
            :rows="4"
            class="w-full"
            @blur="saveNotes"
          />
        </UCard>
      </div>

      <aside class="space-y-5 sm:space-y-6">
        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
          v-if="item.category != 'place'"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              {{ linksLabel }}
            </p>
          </template>
          <ItemPlatformLinks :item="item" />
        </UCard>

        <UCard
          v-if="item.tags?.length"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Tags
            </p>
          </template>
          <div class="flex gap-1.5 flex-wrap">
            <UBadge
              v-for="tag in item.tags"
              :key="tag"
              :label="tag"
              size="sm"
              variant="outline"
              color="neutral"
            />
          </div>
        </UCard>

        <UCard
          v-if="item.confidence"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              AI Confidence
            </p>
          </template>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 text-sm font-semibold capitalize"
                :class="{
                  'text-emerald-600 dark:text-emerald-400':
                    item.confidence === 'high',
                  'text-amber-600 dark:text-amber-400':
                    item.confidence === 'medium',
                  'text-red-500 dark:text-red-400': item.confidence === 'low',
                }"
              >
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="{
                    'bg-emerald-500': item.confidence === 'high',
                    'bg-amber-500': item.confidence === 'medium',
                    'bg-red-400': item.confidence === 'low',
                  }"
                />
                {{ item.confidence }}
              </span>
              <span class="text-xs text-neutral-400">
                {{
                  item.confidence === "high"
                    ? "— AI is certain about this match"
                    : item.confidence === "medium"
                      ? "— AI made a reasonable guess"
                      : "— AI was unsure, verify manually"
                }}
              </span>
            </div>
            <div class="flex items-end justify-between gap-3">
              <p class="text-xs text-neutral-400 leading-relaxed">
                Something look off? Edit the title, creator, or category and
                re-fetch to get the correct data.
              </p>
              <UButton
                size="xs"
                variant="ghost"
                color="primary"
                icon="i-lucide-pencil"
                label="Edit"
                @click="openEditModal"
              />
            </div>
          </div>
        </UCard>

        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p
                class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Include in Taste Profile
              </p>
              <p class="text-xs text-neutral-400 mt-0.5">
                Use this item when generating your taste profile
              </p>
            </div>
            <USwitch
              v-model="includeInTaste"
              @update:model-value="saveIncludeInTaste"
            />
          </div>
        </UCard>

        <UCard
          v-if="['movie', 'show'].includes(item.category)"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Data Sources
            </p>
          </template>
          <p class="text-xs text-neutral-400 leading-relaxed">
            This page uses data from
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-neutral-500 dark:text-neutral-300 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >The Movie Database (TMDB)</a
            >. TMDB is not endorsed or certified by Meloria.
          </p>
        </UCard>

        <UCard
          v-else-if="item.category === 'music'"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Data Sources
            </p>
          </template>
          <p class="text-xs text-neutral-400 leading-relaxed">
            Music data provided by
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-neutral-500 dark:text-neutral-300 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >Spotify</a
            >
            and
            <a
              href="https://www.deezer.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-neutral-500 dark:text-neutral-300 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >Deezer</a
            >.
          </p>
        </UCard>

        <UCard
          v-else-if="item.category === 'book'"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Data Sources
            </p>
          </template>
          <p class="text-xs text-neutral-400 leading-relaxed">
            Book data provided by
            <a
              href="https://openlibrary.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-neutral-500 dark:text-neutral-300 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >Open Library</a
            >.
          </p>
        </UCard>

        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <p class="text-xs text-neutral-400">
              Saved {{ fullDate }} via {{ item.source }}
            </p>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              label="Delete"
              @click="deleteItem"
            />
          </div>
        </UCard>
      </aside>
    </div>

    <!-- Reflection Modal (shown when marking an item as Finished) -->
    <UModal
      v-model:open="reflectionModalOpen"
      :title="
        reflectionStep === 'answering'
          ? `How was ${item?.title}? ✨`
          : reflectionStep === 'synthesizing'
            ? 'Saving your reflection…'
            : 'Generating questions…'
      "
      :dismissible="reflectionStep === 'answering'"
      :ui="{
        content:
          'max-w-2xl rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/95 dark:bg-neutral-950/95 shadow-xl',
      }"
    >
      <template #body>
        <!-- Loading: skeleton while questions are generated -->
        <div v-if="reflectionStep === 'loading'" class="space-y-5 py-1 sm:py-2">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Preparing questions for
            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
              item?.title
            }}</span
            >…
          </p>
          <div class="space-y-3">
            <div
              v-for="n in 3"
              :key="n"
              class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3"
            >
              <USkeleton class="h-4 w-2/3 rounded" />
              <USkeleton class="mt-2 h-14 w-full rounded-lg" />
            </div>
          </div>
          <div
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3"
          >
            <USkeleton class="h-4 w-20 rounded" />
            <div class="mt-2 grid grid-cols-3 gap-2">
              <USkeleton class="h-10 rounded-lg" />
              <USkeleton class="h-10 rounded-lg" />
              <USkeleton class="h-10 rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Answering: questions + rating + optional free text -->
        <div
          v-else-if="reflectionStep === 'answering'"
          class="space-y-5 py-1 sm:py-2"
        >
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Answer as much or as little as you like — your answers will be
            shaped into a personal note.
          </p>

          <!-- Questions -->
          <div
            v-for="(q, i) in reflectionQuestions"
            :key="i"
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3"
          >
            <label
              class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {{ q.question }}
            </label>
            <UTextarea
              v-model="reflectionAnswers[i]"
              placeholder="Your thoughts…"
              :rows="3"
              class="mt-2 w-full"
            />
          </div>

          <!-- Rating -->
          <div
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3 space-y-2"
          >
            <p
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Overall
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                v-for="opt in ratingOptions"
                :key="opt.value"
                class="rounded-lg border py-2.5 text-sm font-medium transition-colors"
                :class="
                  reflectionRating === opt.value
                    ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600'
                "
                @click="
                  reflectionRating =
                    reflectionRating === opt.value ? null : opt.value
                "
              >
                {{ opt.emoji }} {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Optional free text -->
          <div
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3 space-y-1.5"
          >
            <label class="text-sm text-neutral-500 dark:text-neutral-400"
              >Anything else?
              <span class="text-neutral-300 dark:text-neutral-600"
                >(optional)</span
              ></label
            >
            <UTextarea
              v-model="reflectionFreeText"
              placeholder="Anything the questions didn't capture…"
              :rows="3"
              class="w-full"
            />
          </div>

          <button
            v-if="item"
            class="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            @click="goToDiscussion"
          >
            <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5" />
            Discuss {{ item.title }} with AI
          </button>
        </div>

        <!-- Synthesizing -->
        <div
          v-else-if="reflectionStep === 'synthesizing'"
          class="py-8 flex flex-col items-center gap-3 text-center"
        >
          <UIcon
            name="i-lucide-sparkles"
            class="w-7 h-7 text-primary-500 animate-pulse"
          />
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Writing your reflection…
          </p>
        </div>
      </template>

      <template #footer>
        <div
          class="flex justify-end gap-2 border-t border-neutral-200/70 dark:border-neutral-800/70 pt-3"
        >
          <UButton
            v-if="reflectionStep === 'answering'"
            variant="ghost"
            color="neutral"
            label="Skip"
            @click="skipReflection"
          />
          <UButton
            v-if="reflectionStep === 'answering'"
            label="Save reflection"
            :disabled="!hasAnyAnswer"
            @click="submitReflection"
          />
        </div>
      </template>
    </UModal>

    <!-- Edit Item Modal -->
    <UModal v-model:open="editModalOpen" title="Edit Item">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Correct the details below and we'll re-enrich the item with fresh
            data.
          </p>
          <UFormField label="Title" required>
            <UInput
              v-model="editForm.title"
              placeholder="Item title"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Category" required>
            <USelect
              v-model="editForm.category"
              :items="categoryOptions"
              placeholder="Select category"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Creator">
            <UInput
              v-model="editForm.creator"
              placeholder="Director / Artist / Author"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="editModalOpen = false"
          />
          <UButton
            label="Save & Re-enrich"
            :loading="editLoading"
            :disabled="!editForm.title || !editForm.category"
            @click="submitEdit"
          />
        </div>
      </template>
    </UModal>
  </div>

  <div v-else-if="loading" class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <USkeleton class="h-80 sm:h-96 w-full rounded-3xl mb-6" />
    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5 sm:gap-6"
    >
      <div class="space-y-5">
        <USkeleton class="h-44 w-full rounded-2xl" />
        <USkeleton class="h-36 w-full rounded-2xl" />
        <USkeleton class="h-40 w-full rounded-2xl" />
      </div>
      <div class="space-y-5">
        <USkeleton class="h-44 w-full rounded-2xl" />
        <USkeleton class="h-28 w-full rounded-2xl" />
        <USkeleton class="h-20 w-full rounded-2xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createItemsService, type Item } from "~/services/items.service";
import { useItemsStore } from "~/stores/items";

const route = useRoute();
const router = useRouter();
const api = useApiService();
const itemsService = createItemsService(api);

const item = ref<Item | null>(null);
const loading = ref(true);
const userNotes = ref("");
const includeInTaste = ref(true);

// Edit modal state
const editModalOpen = ref(false);
const editLoading = ref(false);
const editForm = ref({ title: "", category: "", creator: "" });

const categoryOptions = [
  { label: "Movie", value: "movie" },
  { label: "Show", value: "show" },
  { label: "Book", value: "book" },
  { label: "Music", value: "music" },
  { label: "Podcast", value: "podcast" },
  { label: "Game", value: "game" },
  { label: "Anime", value: "anime" },
  { label: "Place", value: "place" },
];

const openEditModal = () => {
  if (!item.value) return;
  editForm.value = {
    title: item.value.title || "",
    category: item.value.category || "",
    creator: item.value.creator || "",
  };
  editModalOpen.value = true;
};

const toast = useGlobalToast();

const submitEdit = async () => {
  if (!item.value) return;
  editLoading.value = true;
  try {
    const updated = await itemsService.reprocess(item.value.id, {
      title: editForm.value.title,
      category: editForm.value.category,
      creator: editForm.value.creator.trim() || undefined,
    });
    item.value = updated;
    userNotes.value = updated.your_notes || "";
    includeInTaste.value = updated.include_in_taste ?? true;
    editModalOpen.value = false;
    toast.success("Item updated and re-enriched.");
  } catch (e: any) {
    toast.error(e?.message || "Failed to re-enrich item.");
  } finally {
    editLoading.value = false;
  }
};

const fullDate = computed(() =>
  item.value
    ? new Date(item.value.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "",
);

const linksLabel = computed(() => {
  const map: Record<string, string> = {
    music: "Listen on",
    movie: "Watch on",
    show: "Watch on",
    book: "Read on",
    place: "Find on",
  };
  return map[item.value?.category || ""] || "Links";
});

const updateStatus = async (status: string) => {
  if (!item.value) return;
  await itemsService.updateItem(item.value.id, { status });
  item.value.status = status;
};

// Reflection modal
type ReflectionStep = "loading" | "answering" | "synthesizing";
const reflectionModalOpen = ref(false);
const reflectionStep = ref<ReflectionStep>("loading");
const reflectionQuestions = ref<Array<{ type: string; question: string }>>([]);
const reflectionAnswers = ref<string[]>(["", "", ""]);
const reflectionRating = ref<number | null>(null);
const reflectionFreeText = ref("");

const ratingOptions = [
  { value: 5, label: "Loved it", emoji: "❤️" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 1, label: "Didn't like it", emoji: "👎" },
];

const hasAnyAnswer = computed(
  () =>
    reflectionAnswers.value.some((a) => a.trim().length > 0) ||
    reflectionFreeText.value.trim().length > 0 ||
    reflectionRating.value !== null,
);

const handleStatusChange = async (status: string) => {
  if (!item.value) return;
  if (status === "finished") {
    // Apply status immediately so the UI updates, then open modal
    await itemsService.updateItem(item.value.id, {
      status,
      finished_at: new Date().toISOString(),
    });
    item.value.status = status;
    item.value.finished_at = new Date().toISOString();

    // Open modal in loading state and kick off question generation in parallel
    reflectionStep.value = "loading";
    reflectionQuestions.value = [];
    reflectionAnswers.value = ["", "", ""];
    reflectionRating.value = null;
    reflectionFreeText.value = "";
    reflectionModalOpen.value = true;

    try {
      const result = await itemsService.getReflectionQuestions(item.value.id);
      reflectionQuestions.value = result.questions;
      reflectionStep.value = "answering";
    } catch {
      // If question generation fails, just close without blocking the user
      reflectionModalOpen.value = false;
    }
  } else {
    // If moving away from finished → want_to, clear the reflection note
    if (
      item.value.status === "finished" &&
      status === "want_to" &&
      item.value.reflection_note
    ) {
      await itemsService.updateItem(item.value.id, { reflection_note: null });
      item.value.reflection_note = null;
    }
    await updateStatus(status);
  }
};

const submitReflection = async () => {
  if (!item.value) return;
  reflectionStep.value = "synthesizing";
  try {
    const result = await itemsService.synthesizeReflection(item.value.id, {
      questions: reflectionQuestions.value,
      answers: reflectionAnswers.value,
      user_rate: reflectionRating.value,
      free_text: reflectionFreeText.value,
    });
    item.value.reflection_note = result.reflection_note;
    if (result.rating != null) item.value.rating = result.rating;
  } finally {
    reflectionModalOpen.value = false;
    reflectionStep.value = "loading";
  }
};

const skipReflection = () => {
  reflectionModalOpen.value = false;
  reflectionStep.value = "loading";
};

const goToDiscussion = async () => {
  if (!item.value) return;
  const id = item.value.id;
  reflectionModalOpen.value = false;
  await navigateTo(`/items/${id}/discussion`);
};

const mapQuery = computed(
  () =>
    item.value?.category === "place" &&
    (item.value?.title || item.value?.raw_input),
);

const embedLabel = computed(() => {
  if (!item.value) return null;
  const { category, spotify_id, trailer_url } = item.value;
  if (category === "music" && spotify_id) return "Preview";
  if (category === "place" && mapQuery.value) return "Location";
  if ((category === "movie" || category === "show") && trailer_url)
    return "Trailer";
  return null;
});

const saveNotes = async () => {
  if (!item.value) return;
  await itemsService.updateItem(item.value.id, { your_notes: userNotes.value });
};

const saveIncludeInTaste = async (value: boolean) => {
  if (!item.value) return;
  await itemsService.updateItem(item.value.id, { include_in_taste: value });
  item.value.include_in_taste = value;
};

const deleteItem = async () => {
  if (!item.value) return;
  await itemsService.remove(item.value.id);
  useItemsStore().fetchTotals({ force: true });
  router.push("/library");
};

onMounted(async () => {
  try {
    const data = await itemsService.getById(route.params.id as string);
    item.value = data;
    useHead({ title: data.title || "Item" });
    userNotes.value = data.your_notes || "";
    includeInTaste.value = data.include_in_taste ?? true;
  } finally {
    loading.value = false;
  }
});
</script>
