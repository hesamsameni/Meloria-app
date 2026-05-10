<template>
  <!-- ── ROW variant (suggestions page — full-width horizontal) ── -->
  <div
    v-if="variant === 'row'"
    class="group flex overflow-hidden rounded-xl border bg-card/80 dark:bg-card-dark/80 border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <!-- Thumbnail -->
    <div
      class="relative w-28 sm:w-36 shrink-0 self-stretch bg-neutral-100 dark:bg-neutral-900"
    >
      <img
        v-if="suggestion.artwork_url || suggestion.backdrop_url"
        :src="(suggestion.artwork_url || suggestion.backdrop_url)!"
        :alt="suggestion.title"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <UIcon
          :name="categoryIcon"
          class="w-9 h-9 text-neutral-400 dark:text-neutral-500"
        />
      </div>
      <div class="absolute bottom-2 left-2">
        <UBadge
          :label="suggestion.category.toUpperCase()"
          size="xs"
          variant="solid"
          color="primary"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 p-4 flex flex-col">
      <div class="flex items-start gap-2">
        <p
          class="flex-1 min-w-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug"
        >
          {{ suggestion.title }}
        </p>
        <span
          v-if="suggestion.mood_match"
          class="shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 capitalize"
          >{{ suggestion.mood_match }}</span
        >
      </div>

      <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500 truncate">
        <span v-if="suggestion.creator">{{ suggestion.creator }}</span>
        <span
          v-if="
            suggestion.creator &&
            (suggestion.release_year || suggestion.external_rating)
          "
        >
          ·
        </span>
        <span v-if="suggestion.release_year">{{
          suggestion.release_year
        }}</span>
        <span v-if="suggestion.release_year && suggestion.external_rating">
          ·
        </span>
        <span
          v-if="suggestion.external_rating"
          class="inline-flex items-center gap-0.5"
        >
          <UIcon name="i-lucide-star" class="w-2.5 h-2.5 text-yellow-400" />{{
            suggestion.external_rating
          }}
        </span>
      </p>

      <div class="mt-2.5 flex items-start gap-1.5">
        <UIcon
          name="i-lucide-sparkles"
          class="w-3 h-3 text-primary-500 shrink-0 mt-0.5"
        />
        <div class="min-w-0">
          <p
            class="text-xs text-neutral-500 dark:text-neutral-400 italic leading-relaxed"
            :class="reasonExpanded ? '' : 'line-clamp-2'"
          >
            {{ suggestion.reason }}
          </p>
          <button
            class="mt-0.5 text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            @click.stop="reasonExpanded = !reasonExpanded"
          >
            {{ reasonExpanded ? "Show less" : "Read more" }}
          </button>
        </div>
      </div>

      <div
        v-if="suggestion.cross_category_connection"
        class="mt-1.5 mb-3 flex items-start gap-1.5"
      >
        <UIcon
          name="i-lucide-link-2"
          class="w-3 h-3 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5"
        />
        <p
          class="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed"
        >
          {{ suggestion.cross_category_connection }}
        </p>
      </div>

      <div
        class="mt-auto pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2"
      >
        <template v-if="saved">
          <UIcon
            name="i-lucide-check-circle"
            class="w-3.5 h-3.5 text-primary-500 shrink-0"
          />
          <span
            class="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex-1"
            >Saved to library</span
          >
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            @click="emit('view', suggestion)"
            >View</UButton
          >
        </template>
        <template v-else-if="suggestion.library_item_id">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            class="flex-1"
            @click="emit('view', suggestion)"
          >
            <UIcon name="i-lucide-bookmark-check" class="w-3.5 h-3.5 mr-1" />In
            your list
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            :loading="dismissing"
            @click="emit('dismiss', suggestion)"
            >Dismiss</UButton
          >
        </template>
        <template v-else>
          <UButton
            size="sm"
            color="primary"
            variant="soft"
            :loading="saving"
            class="flex-1"
            @click="emit('save', suggestion)"
            >Save to library</UButton
          >
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            :loading="dismissing"
            @click="emit('dismiss', suggestion)"
            >Dismiss</UButton
          >
        </template>
      </div>
    </div>
  </div>

  <!-- ── CARD variant (dashboard — vertical, grid-friendly) ── -->
  <div
    v-else
    class="group flex flex-col overflow-hidden rounded-xl border bg-card/80 dark:bg-card-dark/80 border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <!-- Artwork -->
    <div class="relative h-36 bg-neutral-100 dark:bg-neutral-900 shrink-0">
      <img
        v-if="suggestion.backdrop_url || suggestion.artwork_url"
        :src="(suggestion.backdrop_url || suggestion.artwork_url)!"
        :alt="suggestion.title"
        class="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon
          :name="categoryIcon"
          class="w-10 h-10 text-neutral-400 dark:text-neutral-500"
        />
      </div>
      <div class="absolute left-2 top-2">
        <UBadge
          :label="suggestion.category.toUpperCase()"
          size="xs"
          variant="solid"
          color="primary"
        />
      </div>
      <div v-if="suggestion.mood_match" class="absolute right-2 top-2">
        <span
          class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-black/50 text-white capitalize"
        >
          {{ suggestion.mood_match }}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col flex-1">
      <p
        class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate"
      >
        {{ suggestion.title }}
      </p>
      <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 truncate">
        <span v-if="suggestion.creator">{{ suggestion.creator }}</span>
        <span v-if="suggestion.creator && suggestion.release_year"> · </span>
        <span v-if="suggestion.release_year">{{
          suggestion.release_year
        }}</span>
      </p>

      <div class="mt-2 flex items-start gap-1">
        <UIcon
          name="i-lucide-sparkles"
          class="w-3 h-3 text-primary-500 shrink-0 mt-0.5"
        />
        <p
          class="text-xs text-neutral-500 dark:text-neutral-400 italic line-clamp-2 leading-relaxed"
        >
          {{ suggestion.reason }}
        </p>
      </div>

      <div
        class="mt-auto pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-1.5"
      >
        <template v-if="saved">
          <UIcon
            name="i-lucide-check-circle"
            class="w-3.5 h-3.5 text-primary-500 shrink-0"
          />
          <span
            class="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex-1"
            >Saved</span
          >
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            @click="emit('view', suggestion)"
            >View</UButton
          >
        </template>
        <template v-else-if="suggestion.library_item_id">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            class="flex-1"
            @click="emit('view', suggestion)"
          >
            <UIcon name="i-lucide-bookmark-check" class="w-3 h-3 mr-1" />In your
            list
          </UButton>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            :loading="dismissing"
            @click="emit('dismiss', suggestion)"
            >✕</UButton
          >
        </template>
        <template v-else>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            :loading="saving"
            class="flex-1"
            @click="emit('save', suggestion)"
            >Save</UButton
          >
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            :loading="dismissing"
            @click="emit('dismiss', suggestion)"
            >Dismiss</UButton
          >
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Suggestion } from "~/services/items.service";
import { CATEGORY_ICON } from "~/constants/items";

const props = defineProps<{
  suggestion: Suggestion;
  variant?: "card" | "row";
  saving?: boolean;
  dismissing?: boolean;
  saved?: boolean;
}>();

const emit = defineEmits<{
  save: [suggestion: Suggestion];
  dismiss: [suggestion: Suggestion];
  view: [suggestion: Suggestion];
}>();

const reasonExpanded = ref(false);

const categoryIcon = computed(
  () => CATEGORY_ICON[props.suggestion.category] || "i-lucide-sparkles",
);
</script>
