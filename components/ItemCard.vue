<template>
  <div
    class="group flex flex-col h-full overflow-hidden rounded-xl border bg-card/80 dark:bg-card-dark/80 border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <NuxtLink :to="`/items/${item.id}`" class="block">
      <div class="relative h-48 bg-neutral-100 dark:bg-neutral-900">
        <img
          v-if="item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon
            :name="categoryIcon"
            class="w-12 h-12 text-neutral-400 dark:text-neutral-500"
          />
        </div>

        <div class="absolute left-3 top-3">
          <UBadge
            :label="item.category.toUpperCase()"
            size="xs"
            variant="solid"
            color="primary"
          />
        </div>

        <div class="absolute right-3 top-3">
          <span
            class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-black/50 text-white"
            >{{ timeAgo }}</span
          >
        </div>
      </div>
    </NuxtLink>

    <div class="p-4 flex flex-col flex-1">
      <div class="min-h-[48px]">
        <p
          class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate"
        >
          {{ item.title || item.raw_input?.slice(0, 60) || "Untitled" }}
        </p>
        <p
          v-if="item.tmdb_director?.name || item.creator"
          class="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate"
        >
          {{ item.tmdb_director?.name || item.creator }}
        </p>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <div
          class="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto whitespace-nowrap"
        >
          <UBadge
            v-if="item.source"
            class="inline-flex shrink-0"
            :label="item.source"
            size="xs"
            variant="outline"
            color="neutral"
          />
          <UBadge
            v-for="tag in (item.tags || []).slice(0, 2)"
            :key="tag"
            class="inline-flex shrink-0"
            :label="tag"
            size="xs"
            variant="outline"
            color="neutral"
          />
        </div>
        <div
          v-if="item.external_rating"
          class="ml-2 flex-shrink-0 inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-300"
        >
          <UIcon name="i-lucide-star" class="w-3.5 h-3.5 text-yellow-400" />
          <span class="text-xs">{{ item.external_rating }}</span>
        </div>
      </div>

      <div class="mt-3">
        <div
          class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"
        >
          <span v-if="item.release_year">{{ item.release_year }}</span>
          <span v-if="item.runtime">• {{ formatRuntime(item.runtime) }}</span>
          <span v-if="item.album_name">• {{ item.album_name }}</span>
        </div>
      </div>

      <div
        v-if="showStatus"
        class="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800/60"
      >
        <USelect
          :model-value="item.status as any"
          :items="statusOptions"
          size="sm"
          class="w-full"
          @update:model-value="onSelectChange($event as string)"
        />
      </div>
    </div>

    <UModal
      v-model:open="reflectionOpen"
      :title="
        reflectionStep === 'answering'
          ? `How was ${item.title}? ✨`
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
              item.title
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
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_ICON, STATUS_OPTIONS } from "~/constants/items";
import { createItemsService } from "~/services/items.service";

const props = defineProps<{
  item: Item;
  showStatus?: boolean;
}>();

const emit = defineEmits<{
  "status-change": [id: string, status: string];
}>();

const api = useApiService();
const itemsService = createItemsService(api);
const router = useRouter();

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

const onSelectChange = async (status: string) => {
  if (status === "finished") {
    const now = new Date().toISOString();
    await itemsService.updateItem(props.item.id, {
      status,
      finished_at: now,
    });
    // Update local item
    props.item.status = status;
    props.item.finished_at = now;
    emit("status-change", props.item.id, status);

    reflectionStep.value = "loading";
    reflectionQuestions.value = [];
    reflectionAnswers.value = ["", "", ""];
    reflectionRating.value = null;
    reflectionFreeText.value = "";
    reflectionOpen.value = true;

    try {
      const result = await itemsService.getReflectionQuestions(props.item.id);
      reflectionQuestions.value = result.questions;
      reflectionStep.value = "answering";
    } catch {
      reflectionOpen.value = false;
    }
  } else {
    if (
      props.item.status === "finished" &&
      status === "want_to" &&
      props.item.reflection_note
    ) {
      await itemsService.updateItem(props.item.id, { reflection_note: null });
    }
    await itemsService.updateItem(props.item.id, { status });
    // Update local item
    props.item.status = status;
    emit("status-change", props.item.id, status);
  }
};

const submitReflection = async () => {
  reflectionStep.value = "synthesizing";
  try {
    await itemsService.synthesizeReflection(props.item.id, {
      questions: reflectionQuestions.value,
      answers: reflectionAnswers.value,
      user_rate: reflectionRating.value,
      free_text: reflectionFreeText.value,
    });
  } finally {
    reflectionOpen.value = false;
    reflectionStep.value = "loading";
  }
};

const skipReflection = () => {
  reflectionOpen.value = false;
  reflectionStep.value = "loading";
};

const goToDiscussion = async () => {
  reflectionOpen.value = false;
  router.push(`/items/${props.item.id}/discussion`);
};

const statusOptions = [...STATUS_OPTIONS];

const categoryIcon = computed(
  () => CATEGORY_ICON[props.item.category] || "i-lucide-shapes",
);

const isNote = computed(() =>
  ["note", "idea", "thought"].includes(props.item.category),
);

const timeAgo = computed(() => {
  const diff = Date.now() - new Date(props.item.created_at).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
