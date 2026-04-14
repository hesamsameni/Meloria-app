<template>
  <div>
    <!-- Loading skeletons -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <USkeleton
        v-for="i in skeletonCount"
        :key="i"
        class="h-20 w-full rounded-xl"
      />
    </div>

    <!-- Empty state -->
    <EmptyState v-else-if="items.length === 0" :description="emptyMessage" />

    <!-- Item list -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <ItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :show-status="showStatus"
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
    skeletonCount: 4,
    showStatus: false,
  },
);

defineEmits<{
  "status-change": [id: string, status: string];
}>();
</script>
