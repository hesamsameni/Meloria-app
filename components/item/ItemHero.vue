<template>
  <section
    class="mb-6 sm:mb-8 rounded-3xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm"
  >
    <div
      class="relative"
      :class="
        item.backdrop_url ? 'h-[380px] sm:h-[500px]' : 'h-[320px] sm:h-[420px]'
      "
    >
      <!-- Background: backdrop, artwork, or icon fallback -->
      <img
        v-if="item.backdrop_url"
        :src="item.backdrop_url"
        :alt="item.title || ''"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <img
        v-else-if="item.artwork_url"
        :src="item.artwork_url"
        :alt="item.title || ''"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800"
      >
        <UIcon
          :name="categoryIcon"
          class="w-24 h-24 text-neutral-300 dark:text-neutral-600"
        />
      </div>

      <!-- Gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
      />

      <!-- Top badges -->
      <div class="absolute top-4 left-4 flex items-center gap-2">
        <UBadge
          :label="item.category"
          size="xs"
          variant="solid"
          :icon="categoryIcon"
          color="primary"
        />
        <UBadge
          v-if="item.input_type === 'voice_transcript'"
          label="Voice"
          size="xs"
          variant="solid"
          color="neutral"
        />
      </div>

      <!-- Bottom content -->
      <div
        class="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex items-end gap-4 sm:gap-5"
      >
        <!-- Poster: movie/show poster when backdrop exists, or artist photo for music -->
        <img
          v-if="item.backdrop_url && item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="w-[68px] sm:w-28 shrink-0 aspect-[2/3] rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
        />
        <img
          v-else-if="item.category === 'music' && item.artist_image_url"
          :src="item.artist_image_url"
          :alt="item.tmdb_director?.name || item.creator || ''"
          class="w-[68px] sm:w-28 shrink-0 aspect-square rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
        />

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <h1
            class="text-xl sm:text-3xl font-bold tracking-tight text-white leading-snug"
          >
            {{ item.title || "Untitled" }}
          </h1>
          <p
            v-if="item.creator || item.tmdb_director?.name"
            class="text-sm text-white/65 mt-1 truncate"
          >
            {{ item.tmdb_director?.name || item.creator }}
          </p>

          <!-- Meta -->
          <div
            class="mt-2 flex items-center gap-1.5 text-xs text-white/55 flex-wrap"
          >
            <span v-if="item.release_year">{{ item.release_year }}</span>
            <span
              v-if="item.release_year && item.external_rating"
              class="opacity-40"
              >·</span
            >
            <span
              v-if="item.external_rating"
              class="flex items-center gap-1 text-white/70"
            >
              <UIcon
                name="i-lucide-star"
                class="w-3 h-3 fill-amber-400 text-amber-400"
              />
              {{ item.external_rating }}
            </span>
            <span
              v-if="item.runtime && (item.release_year || item.external_rating)"
              class="opacity-40"
              >·</span
            >
            <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
            <span v-if="item.album_name" class="opacity-40">·</span>
            <span v-if="item.album_name">{{ item.album_name }}</span>
          </div>

          <!-- Status -->
          <div class="mt-3 flex items-center gap-2.5">
            <span
              class="text-[10px] uppercase tracking-widest text-white/35 font-semibold shrink-0"
            >
              Status
            </span>
            <USelect
              :model-value="item.status as any"
              :items="[...STATUS_OPTIONS]"
              size="xs"
              class="w-36"
              @update:model-value="
                (v) => v && $emit('status-change', String(v))
              "
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Genres -->
    <div
      v-if="item.genres?.length"
      class="px-5 sm:px-7 py-3.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 flex-wrap bg-white/90 dark:bg-neutral-950/70"
    >
      <UBadge
        v-for="g in item.genres"
        :key="g"
        :label="g"
        size="xs"
        variant="soft"
        color="neutral"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_ICON, STATUS_OPTIONS } from "~/constants/items";

const props = defineProps<{ item: Item }>();
defineEmits<{ "status-change": [status: string] }>();

const categoryIcon = computed(
  () => CATEGORY_ICON[props.item.category] || "i-lucide-shapes",
);

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
