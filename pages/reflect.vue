<template>
  <div class="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Intro -->
    <div
      v-if="!loading"
      class="mb-8 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50 dark:bg-neutral-900/50 px-5 py-4 flex gap-4 items-start"
    >
      <div
        class="shrink-0 w-8 h-8 rounded-lg bg-primary-500/10 dark:bg-primary-500/15 flex items-center justify-center mt-0.5"
      >
        <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-primary-500" />
      </div>
      <div>
        <p class="text-sm font-medium text-neutral-900 dark:text-white mb-0.5">
          Reflections make your taste profile richer
        </p>
        <p
          class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed"
        >
          A quick note on what you thought of a finished item helps Meloria
          understand your taste more deeply — so recommendations, suggestions,
          and your AI taste profile actually reflect <em>you</em>.
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-32 gap-4"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-neutral-400 animate-spin"
      />
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Loading your finished items…
      </p>
    </div>

    <!-- All done -->
    <div
      v-else-if="!loading && queue.length === 0"
      class="flex flex-col items-center justify-center py-24 gap-5 text-center"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 flex items-center justify-center"
      >
        <UIcon name="i-lucide-check-check" class="w-8 h-8 text-primary-500" />
      </div>
      <div>
        <p
          class="text-base font-semibold text-neutral-900 dark:text-white mb-1"
        >
          {{ allDoneTitle }}
        </p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
          {{ allDoneSubtitle }}
        </p>
      </div>
      <UButton
        v-if="skipped.length > 0"
        variant="outline"
        color="neutral"
        size="sm"
        icon="i-lucide-rotate-ccw"
        @click="restoreSkipped"
      >
        Review skipped ({{ skipped.length }})
      </UButton>
    </div>

    <!-- Card stack -->
    <div v-else>
      <!-- Header -->
      <div class="mb-6 text-center">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          <span class="font-medium text-neutral-900 dark:text-white">{{
            queue.length
          }}</span>
          {{ queue.length === 1 ? "item" : "items" }} waiting for a reflection
        </p>
        <!-- Progress dots -->
        <div class="flex items-center justify-center gap-1.5 mt-3">
          <div
            v-for="(_, i) in allItems"
            :key="i"
            class="rounded-full transition-all duration-300"
            :class="
              i < completedCount
                ? 'w-2 h-2 bg-primary-500'
                : i === completedCount
                  ? 'w-3 h-3 bg-primary-400'
                  : 'w-2 h-2 bg-neutral-200 dark:bg-neutral-800'
            "
          />
        </div>
      </div>

      <!-- Stack -->
      <div class="relative" style="height: 520px">
        <TransitionGroup :css="false" @leave="onCardLeave">
          <div
            v-for="(item, stackIndex) in visibleStack"
            :key="item.id"
            class="absolute inset-0"
            :style="cardStyle(stackIndex)"
          >
            <!-- The card -->
            <div
              class="w-full h-full overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-950 shadow-md flex flex-col select-none"
              :class="stackIndex === 0 ? 'shadow-xl' : ''"
            >
              <!-- Artwork -->
              <div
                class="relative h-64 bg-neutral-100 dark:bg-neutral-900 shrink-0 overflow-hidden"
              >
                <img
                  v-if="item.artwork_url || item.backdrop_url"
                  :src="item.artwork_url || item.backdrop_url || ''"
                  :alt="item.title || ''"
                  class="w-full h-full object-cover"
                  :class="stackIndex === 0 ? '' : 'pointer-events-none'"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    :name="CATEGORY_ICON[item.category] || 'i-lucide-shapes'"
                    class="w-16 h-16 text-neutral-300 dark:text-neutral-700"
                  />
                </div>
                <!-- Gradient overlay -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                />
                <!-- Category badge -->
                <div class="absolute top-3 left-3">
                  <UBadge
                    :label="item.category.toUpperCase()"
                    size="xs"
                    variant="solid"
                    color="primary"
                  />
                </div>
                <!-- Finished date -->
                <div v-if="item.finished_at" class="absolute top-3 right-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-black/50 text-white"
                  >
                    Finished {{ finishedAgo(item.finished_at) }}
                  </span>
                </div>
                <!-- Title on image -->
                <div class="absolute bottom-3 left-4 right-4">
                  <p
                    class="text-white font-semibold text-lg leading-snug line-clamp-2 drop-shadow"
                  >
                    {{
                      item.title || item.raw_input?.slice(0, 60) || "Untitled"
                    }}
                  </p>
                  <p
                    v-if="
                      item.creator ||
                      item.tmdb_director?.name ||
                      item.author_name
                    "
                    class="text-white/70 text-sm mt-0.5 truncate"
                  >
                    {{
                      item.tmdb_director?.name ||
                      item.creator ||
                      item.author_name
                    }}
                  </p>
                </div>
              </div>

              <!-- Body -->
              <div class="flex-1 flex flex-col p-5 min-h-0 overflow-hidden">
                <!-- Tags / metadata -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                  <UBadge
                    v-for="tag in (item.tags || []).slice(0, 4)"
                    :key="tag"
                    :label="tag"
                    size="xs"
                    variant="outline"
                    color="neutral"
                  />
                  <span
                    v-if="item.release_year"
                    class="text-xs text-neutral-400 dark:text-neutral-500 self-center"
                  >
                    {{ item.release_year }}
                  </span>
                </div>

                <!-- Description -->
                <p
                  v-if="item.description"
                  class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 flex-1"
                >
                  {{ item.description }}
                </p>
                <div v-else class="flex-1" />

                <!-- Prompt nudge -->
                <div
                  class="mt-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 px-4 py-3"
                >
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-400 italic"
                  >
                    "{{ reflectionPrompt(item) }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Action buttons -->
      <div class="mt-6 flex items-center justify-center gap-4">
        <!-- Skip -->
        <button
          class="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all shadow-sm active:scale-95"
          :disabled="isAnimating"
          @click="skip"
        >
          <UIcon name="i-lucide-skip-forward" class="w-4 h-4" />
          Skip
        </button>

        <!-- Reflect -->
        <button
          class="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
          :disabled="isAnimating"
          @click="openReflection"
        >
          <UIcon name="i-lucide-pen-line" class="w-4 h-4" />
          Reflect
        </button>
      </div>

      <!-- Keyboard hint -->
      <p
        class="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-4"
      >
        Press
        <kbd
          class="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono"
          >←</kbd
        >
        to skip,
        <kbd
          class="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono"
          >→</kbd
        >
        to reflect
      </p>
    </div>

    <!-- Reflection Modal -->
    <UModal
      v-model:open="reflectionOpen"
      :title="
        reflectionStep === 'answering'
          ? `How was ${currentItem?.title}? ✨`
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
        <!-- Loading skeleton -->
        <div v-if="reflectionStep === 'loading'" class="space-y-5 py-1 sm:py-2">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Preparing questions for
            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
              currentItem?.title
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

        <!-- Answering -->
        <div
          v-else-if="reflectionStep === 'answering'"
          class="space-y-5 py-1 sm:py-2"
        >
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Answer as much or as little as you like — your answers will be
            shaped into a personal note.
          </p>

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

          <!-- Free text -->
          <div
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3 space-y-1.5"
          >
            <label class="text-sm text-neutral-500 dark:text-neutral-400">
              Anything else?
              <span class="text-neutral-300 dark:text-neutral-600"
                >(optional)</span
              >
            </label>
            <UTextarea
              v-model="reflectionFreeText"
              placeholder="Anything the questions didn't capture…"
              :rows="3"
              class="w-full"
            />
          </div>
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
            @click="closeReflection"
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
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";
import { CATEGORY_ICON } from "~/constants/items";

const { hasPending, refresh: refreshReflectPending } = useReflectPending();
const router = useRouter();

const { setPageHeader } = usePageHeader();
useHead({ title: "Reflect" });
setPageHeader("Reflect", "Turn finished items into lasting memories");

const api = useApiService();
const itemsService = createItemsService(api);

// --- Data ---
const allItems = ref<Item[]>([]);
const queue = ref<Item[]>([]);
const skipped = ref<Item[]>([]);
const completedCount = ref(0);
const loading = ref(true);
const isAnimating = ref(false);

// visible backstack (top 3 cards)
const visibleStack = computed(() => queue.value.slice(0, 3).reverse());

const currentItem = computed(() => queue.value[0] ?? null);

const allDoneTitle = computed(() =>
  skipped.value.length > 0
    ? "All caught up for now!"
    : "All reflections complete! 🎉",
);
const allDoneSubtitle = computed(() =>
  skipped.value.length > 0
    ? "You skipped a few — want to go back and reflect on them?"
    : "You've reflected on every finished item. Keep adding things to your library and come back later.",
);

// --- Load ---
onMounted(async () => {
  try {
    const result = await itemsService.search({
      status: "finished",
      limit: 100,
    });
    const needsReflection = result.filter((i) => !i.reflection_note);
    allItems.value = needsReflection;
    queue.value = [...needsReflection];
    hasPending.value = needsReflection.length > 0;
    if (needsReflection.length === 0) {
      router.replace("/dashboard");
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
});

// --- Keyboard shortcuts ---
onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (reflectionOpen.value || queue.value.length === 0 || isAnimating.value)
      return;
    if (e.key === "ArrowLeft") skip();
    if (e.key === "ArrowRight") openReflection();
  };
  window.addEventListener("keydown", onKey);
  onUnmounted(() => window.removeEventListener("keydown", onKey));
});

// --- Card stack styles ---
function cardStyle(stackIndex: number) {
  // stackIndex 0 = backmost, last index = frontmost (top card)
  const total = Math.min(queue.value.length, 3);
  const fromTop = total - 1 - stackIndex; // 0 = front card
  const scale = 1 - fromTop * 0.04;
  const translateY = fromTop * -8;
  const rotate = fromTop === 0 ? 0 : fromTop % 2 === 0 ? -1.5 : 1.5;
  return {
    transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
    zIndex: stackIndex + 1,
    transition: "transform 0.3s ease",
    transformOrigin: "bottom center",
  };
}

// --- Animation ---
function onCardLeave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = "transform 0.35s ease, opacity 0.35s ease";
  htmlEl.style.transform = `translateX(${exitDirection.value === "left" ? "-140%" : "140%"}) rotate(${exitDirection.value === "left" ? -15 : 15}deg)`;
  htmlEl.style.opacity = "0";
  setTimeout(done, 360);
}

const exitDirection = ref<"left" | "right">("left");

async function animateOut(direction: "left" | "right") {
  if (isAnimating.value || queue.value.length === 0) return;
  isAnimating.value = true;
  exitDirection.value = direction;
  // Wait for leave transition (TransitionGroup handles CSS)
  await nextTick();
  queue.value.shift();
  completedCount.value++;
  await nextTick();
  isAnimating.value = false;
}

// --- Skip ---
async function skip() {
  if (!currentItem.value) return;
  skipped.value.push(currentItem.value);
  await animateOut("left");
}

function restoreSkipped() {
  queue.value = [...skipped.value];
  skipped.value = [];
  completedCount.value = allItems.value.length - queue.value.length;
}

// --- Reflection Modal ---
const reflectionOpen = ref(false);
type ReflectionStep = "loading" | "answering" | "synthesizing";
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

async function openReflection() {
  if (!currentItem.value || isAnimating.value) return;

  reflectionStep.value = "loading";
  reflectionQuestions.value = [];
  reflectionAnswers.value = ["", "", ""];
  reflectionRating.value = null;
  reflectionFreeText.value = "";
  reflectionOpen.value = true;

  try {
    const result = await itemsService.getReflectionQuestions(
      currentItem.value.id,
    );
    reflectionQuestions.value = result.questions;
    reflectionStep.value = "answering";
  } catch {
    reflectionOpen.value = false;
  }
}

async function submitReflection() {
  if (!currentItem.value) return;
  reflectionStep.value = "synthesizing";
  try {
    await itemsService.synthesizeReflection(currentItem.value.id, {
      questions: reflectionQuestions.value,
      answers: reflectionAnswers.value,
      user_rate: reflectionRating.value,
      free_text: reflectionFreeText.value,
    });
    reflectionOpen.value = false;
    reflectionStep.value = "loading";
    await animateOut("right");
    // Remove from allItems too so progress is accurate
    allItems.value = allItems.value.filter(
      (i) => i.id !== currentItem.value?.id,
    );
    hasPending.value = allItems.value.length > 0;
  } catch {
    reflectionStep.value = "answering";
  }
}

function closeReflection() {
  reflectionOpen.value = false;
  reflectionStep.value = "loading";
}

// --- Helpers ---
function finishedAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return `${months}mo ago`;
}

const REFLECTION_PROMPTS: Record<string, string[]> = {
  movie: [
    "What scene will you remember years from now?",
    "Did it change how you see something?",
    "Would you watch it again?",
  ],
  show: [
    "Which character stuck with you?",
    "Was the ending satisfying?",
    "Would you recommend it?",
  ],
  book: [
    "What idea from this book are you still thinking about?",
    "Who would you gift this to?",
    "Did it change how you see the world?",
  ],
  music: [
    "What mood does this take you to?",
    "Which track is an instant repeat?",
    "Where were you when you first heard it?",
  ],
  podcast: [
    "What's one thing you learned?",
    "Will you listen to more from this creator?",
  ],
  game: [
    "What moment surprised you most?",
    "Did the story land?",
    "Would you replay it?",
  ],
  anime: [
    "Which arc was your favourite?",
    "How does it compare to others in the genre?",
  ],
};

function reflectionPrompt(item: Item): string {
  const prompts = REFLECTION_PROMPTS[item.category] || [
    "What did you think of it?",
  ];
  // pick deterministically based on id
  const idx = item.id.charCodeAt(0) % prompts.length;
  return prompts[idx];
}
</script>
