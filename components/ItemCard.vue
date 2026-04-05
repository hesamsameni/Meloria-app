<template>
  <div
    class="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
  >
    <!-- icon -->
    <div
      class="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 text-lg"
    >
      {{ categoryEmoji }}
    </div>

    <!-- content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p
            class="text-sm font-medium text-neutral-900 dark:text-white truncate"
          >
            {{ item.title || item.raw_input?.slice(0, 60) || "Untitled" }}
          </p>
          <p v-if="item.creator" class="text-xs text-neutral-400 mt-0.5">
            {{ item.creator }}
          </p>
        </div>
        <span class="text-xs text-neutral-400 shrink-0">{{ timeAgo }}</span>
      </div>

      <p
        v-if="item.description"
        class="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2"
      >
        {{ item.description }}
      </p>

      <div class="flex items-center gap-1.5 mt-2 flex-wrap">
        <UBadge
          :label="item.category"
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
    </div>

    <!-- status -->
    <USelect
      v-if="showStatus"
      :model-value="item.status"
      :items="statusOptions"
      size="xs"
      class="w-28 shrink-0"
      @update:model-value="$emit('status-change', item.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const props = defineProps<{
  item: Item;
  showStatus?: boolean;
}>();

defineEmits<{
  "status-change": [id: string, status: string];
}>();

const statusOptions = [
  { label: "Saved", value: "saved" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Skipped", value: "skipped" },
];

const categoryEmoji = computed(() => {
  const map: Record<string, string> = {
    movie: "🎬",
    music: "🎵",
    book: "📚",
    show: "📺",
    article: "📰",
    place: "📍",
    person: "👤",
    idea: "💡",
    note: "📝",
    product: "🛍️",
  };
  return map[props.item.category] || "✦";
});

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
</script>
