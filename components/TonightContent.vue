<template>
  <div class="mx-auto max-w-lg">
    <!-- Input state -->
    <div v-if="!recommendation">
      <div
        class="relative overflow-hidden rounded-3xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <!-- Soft header glow -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-primary-500/15 blur-3xl"
        />

        <div class="relative p-6 sm:p-7">
          <!-- Icon + heading -->
          <div class="flex flex-col items-center text-center gap-3">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-moon-star"
                class="w-6 h-6 text-primary-500"
              />
            </div>
            <div>
              <h2
                class="text-lg font-semibold text-neutral-900 dark:text-white"
              >
                What should I enjoy tonight?
              </h2>
              <p
                class="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto"
              >
                One thoughtful pick from your library — with a reason it fits
                right now.
              </p>
            </div>
          </div>

          <!-- Mood input -->
          <div class="mt-6 space-y-3">
            <UTextarea
              v-model="mood"
              :rows="1"
              autoresize
              placeholder="Set the mood… (optional)"
              class="w-full"
              @keyup.enter.prevent="getRecommendation"
            />

            <!-- Quick mood chips -->
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in moodSuggestions"
                :key="m"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
                :class="
                  mood === m
                    ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-neutral-800 dark:hover:text-neutral-200'
                "
                @click="mood = mood === m ? '' : m"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <UButton
            color="primary"
            size="lg"
            :loading="loading"
            block
            class="mt-6 rounded-xl"
            icon="i-lucide-sparkles"
            @click="getRecommendation"
          >
            Get my pick
          </UButton>
        </div>
      </div>
    </div>

    <!-- Result state -->
    <div v-else>
      <div
        class="rounded-3xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm overflow-hidden"
      >
        <!-- Artwork -->
        <div
          v-if="
            recommendation.item?.backdrop_url ||
            recommendation.item?.artwork_url
          "
          class="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-900"
        >
          <img
            :src="
              recommendation.item.backdrop_url ||
              recommendation.item.artwork_url ||
              ''
            "
            :alt="recommendation.title"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-neutral-950/80 to-transparent"
          />
          <div class="absolute bottom-3 left-4 flex items-center gap-2">
            <UBadge
              :label="recommendation.category.toUpperCase()"
              size="xs"
              variant="solid"
              color="primary"
            />
            <UBadge
              v-if="recommendation.mood_match"
              :label="recommendation.mood_match"
              size="xs"
              variant="outline"
              color="neutral"
              class="bg-white/80 dark:bg-neutral-900/80"
            />
          </div>
        </div>

        <div class="p-5 space-y-4">
          <!-- Badges (when no image) -->
          <div
            v-if="
              !recommendation.item?.backdrop_url &&
              !recommendation.item?.artwork_url
            "
            class="flex items-center gap-2"
          >
            <UBadge
              :label="recommendation.category.toUpperCase()"
              size="xs"
              variant="solid"
              color="primary"
            />
            <UBadge
              v-if="recommendation.mood_match"
              :label="recommendation.mood_match"
              size="xs"
              variant="outline"
              color="neutral"
            />
          </div>

          <!-- Title + creator -->
          <div>
            <h2
              class="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {{ recommendation.title }}
            </h2>
            <p
              v-if="recommendation.item?.creator"
              class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
            >
              {{ recommendation.item.creator }}
            </p>
          </div>

          <!-- Reason -->
          <div class="flex items-start gap-2.5">
            <UIcon
              name="i-lucide-sparkles"
              class="w-4 h-4 text-primary-500 shrink-0 mt-0.5"
            />
            <p
              class="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed"
            >
              {{ recommendation.reason }}
            </p>
          </div>

          <!-- Not in library banner -->
          <div
            v-if="!recommendation.is_from_library"
            class="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-3 space-y-3"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-library"
                class="w-3.5 h-3.5 text-neutral-400 shrink-0"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Not in your library yet — suggested based on your taste profile
              </p>
            </div>

            <UButton
              v-if="!savedItem"
              size="sm"
              color="primary"
              variant="soft"
              :loading="saving"
              @click="saveToLibrary"
            >
              Save to Library
            </UButton>

            <div v-else class="space-y-2">
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-check-circle"
                  class="w-3.5 h-3.5 text-primary-500"
                />
                <span
                  class="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                  >Saved to your library</span
                >
              </div>
              <div
                v-if="savedItem.artwork_url"
                class="flex items-center gap-3 rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 p-2.5"
              >
                <img
                  :src="savedItem.artwork_url"
                  :alt="savedItem.title || ''"
                  class="w-10 h-10 object-cover rounded"
                />
                <div class="flex-1 min-w-0">
                  <p
                    class="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate"
                  >
                    {{ savedItem.title }}
                  </p>
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
                  >
                    {{ savedItem.creator || savedItem.category }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex gap-2 pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800/60"
          >
            <UButton
              v-if="recommendation.is_from_library && recommendation.item"
              color="primary"
              size="sm"
              @click="viewInLibrary"
            >
              View in Library
            </UButton>
            <UButton
              v-else-if="savedItem"
              color="primary"
              size="sm"
              @click="viewSavedItem"
            >
              View in Library
            </UButton>

            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :loading="loading"
              @click="getAnother"
            >
              Get another
            </UButton>

            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              class="ml-auto"
              @click="reset"
            >
              Start over
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TonightRecommendation, Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";

const api = useApiService();
const itemsService = createItemsService(api);
const router = useRouter();
const toast = useGlobalToast();
const { capture } = useCapture();
const posthog = usePostHog();

const mood = ref("");
const loading = ref(false);

// Quick-pick moods so the empty state feels intentional (not a big blank box).
const moodSuggestions = [
  "Cozy night in",
  "Something light",
  "Thought-provoking",
  "Short & sweet",
  "A classic",
];
const saving = ref(false);
const recommendation = ref<TonightRecommendation | null>(null);
const savedItem = ref<Item | null>(null);

const getRecommendation = async () => {
  loading.value = true;
  posthog?.capture("tonight_recommendation_requested", {
    has_mood: !!mood.value,
  });
  try {
    const result = await itemsService.getWhatTonight({
      mood: mood.value || undefined,
    });
    recommendation.value = result;
  } catch (error: any) {
    const message =
      error?.data?.error || error?.message || "Failed to get recommendation";
    toast.error("Failed to get recommendation", message);
  } finally {
    loading.value = false;
  }
};

const getAnother = async () => {
  loading.value = true;
  try {
    const result = await itemsService.getWhatTonight({
      mood: mood.value || undefined,
      excludeTitle: recommendation.value?.title,
    });
    recommendation.value = result;
    savedItem.value = null;
  } catch (error: any) {
    const message =
      error?.data?.error || error?.message || "Failed to get recommendation";
    toast.error("Failed to get recommendation", message);
  } finally {
    loading.value = false;
  }
};

const saveToLibrary = async () => {
  if (!recommendation.value) return;

  saving.value = true;
  try {
    const item = await capture(recommendation.value.title, "tonight");
    if (item) {
      savedItem.value = item;
      posthog?.capture("tonight_item_saved_to_library", {
        category: item.category,
        title: item.title,
      });
      toast.success(
        "Saved to library",
        `${item.title} has been added to your library`,
      );
    }
  } catch (error: any) {
    const message = error?.data?.error || error?.message || "Failed to save";
    toast.error("Failed to save", message);
  } finally {
    saving.value = false;
  }
};

const viewInLibrary = () => {
  if (recommendation.value?.item) {
    router.push(`/items/${recommendation.value.item.id}`);
  }
};

const viewSavedItem = () => {
  if (savedItem.value) {
    router.push(`/items/${savedItem.value.id}`);
  }
};

const reset = () => {
  recommendation.value = null;
  savedItem.value = null;
  mood.value = "";
};
</script>
