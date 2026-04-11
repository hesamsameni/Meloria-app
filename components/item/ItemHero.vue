<template>
  <div class="flex gap-5 mb-8">
    <!-- Artwork -->
    <div class="shrink-0">
      <img
        v-if="item.artwork_url"
        :src="item.artwork_url"
        :alt="item.title || ''"
        class="rounded-xl object-cover shadow-lg"
        :class="item.category === 'music' ? 'w-36 h-36' : 'w-28 h-40'"
      />
      <div
        v-else
        class="w-28 h-40 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-4xl"
      >
        {{ categoryEmoji }}
      </div>
    </div>

    <!-- Main info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start gap-2 mb-1">
        <UBadge
          :label="item.category"
          size="xs"
          variant="soft"
          color="primary"
        />
        <UBadge
          v-if="item.input_type === 'voice_transcript'"
          label="🎙 voice"
          size="xs"
          variant="soft"
          color="primary"
        />
      </div>

      <h1
        class="text-2xl font-semibold text-neutral-900 dark:text-white mt-2 mb-0.5"
      >
        {{ item.title || "Untitled" }}
      </h1>

      <p
        v-if="item.creator"
        class="text-neutral-500 dark:text-neutral-400 mb-3"
      >
        {{ item.creator }}
      </p>

      <!-- Meta pills -->
      <div
        class="flex items-center gap-3 text-sm text-neutral-400 flex-wrap mb-4"
      >
        <span v-if="item.release_year">{{ item.release_year }}</span>
        <span v-if="item.external_rating" class="flex items-center gap-1">
          ⭐ {{ item.external_rating }}
        </span>
        <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
        <span v-if="item.album_name" class="italic">{{ item.album_name }}</span>
      </div>

      <!-- Genres -->
      <div v-if="item.genres?.length" class="flex gap-1.5 flex-wrap mb-4">
        <UBadge
          v-for="g in item.genres"
          :key="g"
          :label="g"
          size="xs"
          variant="outline"
          color="neutral"
        />
      </div>

      <!-- Status selector -->
      <USelect
        :model-value="item.status as any"
        :items="[...STATUS_OPTIONS]"
        size="sm"
        class="w-36"
        @update:model-value="(v) => v && $emit('status-change', String(v))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_EMOJI, STATUS_OPTIONS } from "~/constants/items";

const props = defineProps<{ item: Item }>();
defineEmits<{ "status-change": [status: string] }>();

const categoryEmoji = computed(
  () => CATEGORY_EMOJI[props.item.category] || "✦",
);

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
