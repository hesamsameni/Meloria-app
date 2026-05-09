<template>
  <div
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <!-- Artwork -->
    <div
      class="relative h-44 bg-neutral-100 dark:bg-neutral-900 shrink-0 overflow-hidden"
    >
      <img
        v-if="suggestion.backdrop_url || suggestion.artwork_url"
        :src="(suggestion.backdrop_url || suggestion.artwork_url)!"
        :alt="suggestion.title"
        class="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon
          name="i-lucide-sparkles"
          class="w-12 h-12 text-neutral-300 dark:text-neutral-700"
        />
      </div>

      <!-- Gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent"
      />
    </div>

    <!-- Body -->
    <div class="p-4 flex flex-col flex-1">
      <!-- Category + mood badges -->
      <div class="flex items-center gap-1.5 mb-2">
        <UBadge
          :label="suggestion.category.toUpperCase()"
          size="xs"
          variant="solid"
          color="primary"
        />
        <UBadge
          v-if="suggestion.mood_match"
          :label="suggestion.mood_match"
          size="xs"
          variant="subtle"
          color="neutral"
        />
      </div>

      <!-- Title + meta -->
      <div>
        <p
          class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1"
        >
          {{ suggestion.title }}
        </p>
        <p
          v-if="suggestion.release_year || suggestion.external_rating"
          class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5"
        >
          <span v-if="suggestion.release_year">{{
            suggestion.release_year
          }}</span>
          <span v-if="suggestion.release_year && suggestion.external_rating"
            >·</span
          >
          <span
            v-if="suggestion.external_rating"
            class="inline-flex items-center gap-0.5"
          >
            <UIcon name="i-lucide-star" class="w-3 h-3 text-yellow-400" />
            {{ suggestion.external_rating }}
          </span>
        </p>
      </div>

      <!-- AI reason -->
      <div class="mt-2.5 flex items-start gap-1.5">
        <UIcon
          name="i-lucide-sparkles"
          class="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5"
        />
        <p
          class="text-xs text-neutral-500 dark:text-neutral-400 italic line-clamp-3 leading-relaxed"
        >
          {{ suggestion.reason }}
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-3">
        <!-- Saved state -->
        <div v-if="saved" class="flex items-center gap-1.5">
          <UIcon
            name="i-lucide-check-circle"
            class="w-4 h-4 text-primary-500 shrink-0"
          />
          <span
            class="text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >Saved to library</span
          >
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            class="ml-auto"
            @click="emit('view', suggestion)"
          >
            View
          </UButton>
        </div>

        <!-- Save + Dismiss buttons -->
        <div v-else class="flex flex-col sm:flex-row gap-2">
          <!-- Already in want-to list -->
          <template v-if="suggestion.library_item_id">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              class="flex-1"
              @click="emit('view', suggestion)"
            >
              <UIcon name="i-lucide-bookmark-check" class="w-3.5 h-3.5 mr-1" />
              In your list
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :loading="dismissing"
              class="flex-1"
              @click="emit('dismiss', suggestion)"
            >
              Dismiss
            </UButton>
          </template>
          <!-- Normal save flow -->
          <template v-else>
            <UButton
              size="sm"
              color="primary"
              variant="soft"
              :loading="saving"
              class="flex-1"
              @click="emit('save', suggestion)"
            >
              Save to Library
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :loading="dismissing"
              class="flex-1"
              @click="emit('dismiss', suggestion)"
            >
              Dismiss
            </UButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Suggestion } from "~/services/items.service";

defineProps<{
  suggestion: Suggestion;
  saving?: boolean;
  dismissing?: boolean;
  saved?: boolean;
}>();

const emit = defineEmits<{
  save: [suggestion: Suggestion];
  dismiss: [suggestion: Suggestion];
  view: [suggestion: Suggestion];
}>();
</script>
