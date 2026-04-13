<template>
  <section
    class="mb-6 sm:mb-8 rounded-3xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
  >
    <div
      class="relative h-[320px] sm:h-[420px] bg-neutral-100 dark:bg-neutral-900"
    >
      <img
        v-if="item.artwork_url"
        :src="item.artwork_url"
        :alt="item.title || ''"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800"
      >
        <UIcon
          :name="categoryIcon"
          class="w-24 h-24 text-neutral-500 dark:text-neutral-400"
        />
      </div>

      <div
        class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
      />

      <div
        class="absolute top-4 left-4 right-4 flex items-start justify-between gap-3"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <UBadge
            :label="item.category"
            size="xs"
            variant="soft"
            color="primary"
          />
          <UBadge
            v-if="item.input_type === 'voice_transcript'"
            label="Voice"
            size="xs"
            variant="soft"
            color="neutral"
          />
        </div>
      </div>

      <div class="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white">
        <h1
          class="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight"
        >
          {{ item.title || "Untitled" }}
        </h1>

        <p
          v-if="item.creator"
          class="text-sm sm:text-base text-white/85 mt-1.5"
        >
          {{ item.creator }}
        </p>

        <div
          class="mt-3 flex items-center gap-2.5 text-xs sm:text-sm text-white/85 flex-wrap"
        >
          <span v-if="item.release_year">{{ item.release_year }}</span>
          <span v-if="item.release_year && item.external_rating">•</span>
          <span v-if="item.external_rating" class="flex items-center gap-1">
            <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
            {{ item.external_rating }}
          </span>
          <span
            v-if="item.runtime && (item.release_year || item.external_rating)"
            >•</span
          >
          <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
          <span v-if="item.album_name">• {{ item.album_name }}</span>
        </div>

        <div class="mt-4 w-full sm:w-60">
          <div
            class="rounded-2xl border border-white/25 bg-black/35 backdrop-blur-md p-2.5"
          >
            <div class="flex items-center justify-between mb-2 px-1">
              <p class="text-[11px] uppercase tracking-widest text-white/65">
                Status
              </p>
              <span
                class="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                :class="activeStatusClass"
              >
                {{ activeStatusLabel }}
              </span>
            </div>
            <USelect
              :model-value="item.status as any"
              :items="[...STATUS_OPTIONS]"
              size="sm"
              class="w-full"
              @update:model-value="
                (v) => v && $emit('status-change', String(v))
              "
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="item.genres?.length"
      class="p-4 sm:p-5 border-t border-neutral-200/70 dark:border-neutral-800/70"
    >
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2.5"
      >
        Genres
      </p>
      <div class="flex gap-1.5 flex-wrap">
        <UBadge
          v-for="g in item.genres"
          :key="g"
          :label="g"
          size="xs"
          variant="outline"
          color="neutral"
        />
      </div>
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

const activeStatusLabel = computed(() => {
  const selected = STATUS_OPTIONS.find(
    (option) => option.value === props.item.status,
  );
  return selected?.label || "Saved";
});

const activeStatusClass = computed(() => {
  const map: Record<string, string> = {
    saved: "border-sky-300/40 bg-sky-500/20 text-sky-100",
    in_progress: "border-amber-300/40 bg-amber-500/20 text-amber-100",
    done: "border-emerald-300/40 bg-emerald-500/20 text-emerald-100",
    skipped: "border-rose-300/40 bg-rose-500/20 text-rose-100",
  };

  return map[props.item.status || "saved"] || map.saved;
});

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
