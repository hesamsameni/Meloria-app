<template>
  <div
    class="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/85 shadow-sm hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden"
  >
    <NuxtLink :to="`/items/${item.id}`" class="block relative">
      <div class="relative h-56 sm:h-64 bg-neutral-100 dark:bg-neutral-900">
        <img
          v-if="item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800"
        >
          <UIcon
            :name="categoryIcon"
            class="w-14 h-14 text-neutral-500 dark:text-neutral-400"
          />
        </div>

        <div
          class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
        />

        <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p
                class="text-base sm:text-lg font-semibold leading-tight truncate"
              >
                {{ item.title || item.raw_input?.slice(0, 60) || "Untitled" }}
              </p>
              <p
                v-if="item.tmdb_director?.name || item.creator"
                class="text-xs sm:text-sm text-white/80 mt-1 truncate"
              >
                {{ item.tmdb_director?.name || item.creator }}
              </p>
            </div>
            <span class="text-xs text-white/80 shrink-0 mt-0.5">{{
              timeAgo
            }}</span>
          </div>

          <div
            v-if="
              item.release_year ||
              item.external_rating ||
              item.runtime ||
              item.album_name
            "
            class="mt-2.5 flex items-center gap-2 text-xs text-white/80 flex-wrap"
          >
            <span v-if="item.release_year">{{ item.release_year }}</span>
            <span v-if="item.release_year && item.external_rating">•</span>
            <span
              v-if="item.external_rating"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-star" class="w-3 h-3" />
              {{ item.external_rating }}
            </span>
            <span
              v-if="item.runtime && (item.release_year || item.external_rating)"
              >•</span
            >
            <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
            <span v-if="item.album_name">• {{ item.album_name }}</span>
          </div>
        </div>
      </div>
    </NuxtLink>

    <div class="p-4 sm:p-5 flex flex-col gap-3.5">
      <p
        v-if="item.description && isNote"
        class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2"
      >
        {{ item.description }}
      </p>

      <div class="flex items-center gap-2 flex-wrap">
        <UBadge
          :label="item.category"
          size="xs"
          variant="soft"
          color="primary"
        />
        <UBadge
          v-if="
            item.input_type === 'voice_transcript' ||
            item.input_type === 'voice'
          "
          size="xs"
          variant="soft"
          color="primary"
        >
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-mic" class="w-3 h-3" />
            Voice
          </span>
        </UBadge>
        <UBadge
          :label="item.source"
          size="xs"
          variant="outline"
          color="neutral"
        />
        <UBadge
          v-for="tag in (item.tags || []).slice(0, 2)"
          :key="tag"
          :label="tag"
          size="xs"
          variant="outline"
          color="neutral"
        />
      </div>

      <div class="flex items-center gap-2 flex-wrap pt-1">
        <template v-if="item.category === 'music'">
          <UButton
            v-if="item.spotify_url"
            :to="item.spotify_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Spotify"
          />
          <UButton
            v-if="item.apple_music_url"
            :to="item.apple_music_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Apple Music"
          />
          <UButton
            v-if="item.youtube_url"
            :to="item.youtube_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="YouTube"
          />
        </template>

        <template v-if="item.category === 'movie' || item.category === 'show'">
          <UButton
            v-if="item.tmdb_id"
            :to="`https://www.themoviedb.org/${item.category === 'show' ? 'tv' : 'movie'}/${item.tmdb_id}`"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="TMDB"
          />
          <UButton
            :to="`https://www.google.com/search?q=${encodeURIComponent((item.title || '') + ' watch online')}`"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Where to watch"
          />
        </template>

        <template v-if="item.category === 'book'">
          <UButton
            v-if="item.goodreads_url"
            :to="item.goodreads_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Goodreads"
          />
          <UButton
            v-if="item.amazon_url"
            :to="item.amazon_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Amazon"
          />
          <UButton
            v-if="item.audible_url"
            :to="item.audible_url"
            target="_blank"
            size="sm"
            color="neutral"
            variant="soft"
            label="Audible"
          />
        </template>

        <USelect
          v-if="showStatus"
          :model-value="
            item.status as
              | 'saved'
              | 'in_progress'
              | 'done'
              | 'skipped'
              | undefined
          "
          :items="statusOptions"
          size="sm"
          class="w-32 ml-auto"
          @update:model-value="$emit('status-change', item.id, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_ICON, STATUS_OPTIONS } from "~/constants/items";

const props = defineProps<{
  item: Item;
  showStatus?: boolean;
}>();

defineEmits<{
  "status-change": [id: string, status: string];
}>();

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
