<template>
  <div
    class="flex items-stretch gap-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors overflow-hidden"
  >
    <!-- artwork -->
    <NuxtLink :to="`/items/${item.id}`" class="shrink-0 block">
      <div
        class="w-20 h-full min-h-[88px] bg-neutral-100 dark:bg-neutral-900 relative"
      >
        <img
          v-if="item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-2xl"
        >
          {{ categoryEmoji }}
        </div>
      </div>
    </NuxtLink>

    <!-- content -->
    <div class="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
      <!-- top row -->
      <div class="flex items-start justify-between gap-2">
        <NuxtLink :to="`/items/${item.id}`" class="min-w-0 flex-1">
          <p
            class="text-sm font-medium text-neutral-900 dark:text-white truncate hover:text-primary-500 transition-colors"
          >
            {{ item.title || item.raw_input?.slice(0, 60) || "Untitled" }}
          </p>
          <p
            v-if="item.creator"
            class="text-xs text-neutral-400 mt-0.5 truncate"
          >
            {{ item.creator }}
          </p>
        </NuxtLink>
        <span class="text-xs text-neutral-400 shrink-0">{{ timeAgo }}</span>
      </div>

      <!-- meta row -->
      <div
        v-if="
          item.release_year ||
          item.external_rating ||
          item.runtime ||
          item.album_name
        "
        class="flex items-center gap-2 text-xs text-neutral-400 flex-wrap"
      >
        <span v-if="item.release_year">{{ item.release_year }}</span>
        <span v-if="item.release_year && item.external_rating">·</span>
        <span v-if="item.external_rating">⭐ {{ item.external_rating }}</span>
        <span v-if="item.runtime && (item.release_year || item.external_rating)"
          >·</span
        >
        <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
        <span v-if="item.album_name">{{ item.album_name }}</span>
      </div>

      <!-- description for notes only -->
      <p
        v-if="item.description && isNote"
        class="text-xs text-neutral-500 dark:text-neutral-400"
      >
        {{ item.description }}
      </p>

      <!-- badges -->
      <div class="flex items-center gap-1.5 flex-wrap">
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
          label="🎙 voice"
          size="xs"
          variant="soft"
          color="primary"
        />
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

      <!-- CTAs -->
      <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
        <!-- music -->
        <template v-if="item.category === 'music'">
          <UButton
            v-if="item.spotify_url"
            :to="item.spotify_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Spotify"
          />
          <UButton
            v-if="item.apple_music_url"
            :to="item.apple_music_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Apple Music"
          />
          <UButton
            v-if="item.youtube_url"
            :to="item.youtube_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="YouTube"
          />
        </template>

        <!-- movie / show -->
        <template v-if="item.category === 'movie' || item.category === 'show'">
          <UButton
            v-if="item.tmdb_id"
            :to="`https://www.themoviedb.org/${item.category === 'show' ? 'tv' : 'movie'}/${item.tmdb_id}`"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="TMDB"
          />
          <UButton
            :to="`https://www.google.com/search?q=${encodeURIComponent((item.title || '') + ' watch online')}`"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Where to watch"
          />
        </template>

        <!-- book -->
        <template v-if="item.category === 'book'">
          <UButton
            v-if="item.goodreads_url"
            :to="item.goodreads_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Goodreads"
          />
          <UButton
            v-if="item.amazon_url"
            :to="item.amazon_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Amazon"
          />
          <UButton
            v-if="item.audible_url"
            :to="item.audible_url"
            target="_blank"
            size="xs"
            color="neutral"
            variant="outline"
            label="Audible"
          />
        </template>

        <!-- status right aligned -->
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
          size="xs"
          class="w-28 ml-auto"
          @update:model-value="$emit('status-change', item.id, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_EMOJI, STATUS_OPTIONS } from "~/constants/items";

const props = defineProps<{
  item: Item;
  showStatus?: boolean;
}>();

defineEmits<{
  "status-change": [id: string, status: string];
}>();

const statusOptions = [...STATUS_OPTIONS];

const categoryEmoji = computed(
  () => CATEGORY_EMOJI[props.item.category] || "✦",
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
