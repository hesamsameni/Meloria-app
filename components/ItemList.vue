<template>
  <div>
    <!-- Loading skeletons -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/50"
      >
        <USkeleton class="h-40 w-full rounded-none" />
        <div class="p-4 space-y-2.5">
          <USkeleton class="h-4 w-3/4 rounded-md" />
          <USkeleton class="h-3 w-1/2 rounded-md" />
          <USkeleton class="h-8 w-full rounded-lg mt-2" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState v-else-if="items.length === 0" :description="emptyMessage" />

    <!-- Item list -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <ItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :show-status="showStatus"
        class="h-full"
        @status-change="(id, status) => $emit('status-change', id, status)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

withDefaults(
  defineProps<{
    items: Item[];
    loading?: boolean;
    showStatus?: boolean;
    emptyMessage?: string;
    skeletonCount?: number;
  }>(),
  {
    emptyMessage: "Nothing here yet",
    skeletonCount: 3,
    showStatus: false,
  },
);

defineEmits<{
  "status-change": [id: string, status: string];
}>();
</script>
