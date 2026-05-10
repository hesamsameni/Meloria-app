<template>
  <div
    class="w-80 flex flex-col bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/60"
    >
      <p class="text-sm font-semibold text-neutral-900 dark:text-white">
        Notifications
      </p>
      <UButton
        v-if="unreadCount > 0"
        variant="ghost"
        color="neutral"
        size="xs"
        :loading="markingAll"
        @click="handleMarkAllRead"
      >
        Mark all read
      </UButton>
    </div>

    <!-- List -->
    <div class="overflow-y-auto max-h-[420px]">
      <div
        v-if="loading && !notifications.length"
        class="px-4 py-8 text-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-5 h-5 animate-spin text-neutral-400 mx-auto"
        />
      </div>

      <div v-else-if="!notifications.length" class="px-4 py-10 text-center">
        <UIcon
          name="i-lucide-bell-off"
          class="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2"
        />
        <p class="text-sm text-neutral-400 dark:text-neutral-500">
          No notifications yet
        </p>
      </div>

      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-start gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 transition-colors cursor-default"
        :class="
          notification.read
            ? 'bg-transparent'
            : 'bg-neutral-50/80 dark:bg-neutral-900/40'
        "
        @click="handleMarkRead(notification.id)"
      >
        <div
          class="w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors"
          :class="notification.read ? 'bg-transparent' : 'bg-primary-500'"
        />
        <div class="min-w-0 flex-1">
          <p
            class="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug"
            :class="notification.read ? 'font-normal' : ''"
          >
            {{ notification.title }}
          </p>
          <p
            class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed"
          >
            {{ notification.body }}
          </p>
          <p class="text-[11px] text-neutral-400 dark:text-neutral-600 mt-1">
            {{ formatRelativeTime(notification.created_at) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from "~/services/notifications.service";

const { notifications, loading, unreadCount, markAllRead, markRead } =
  useNotifications();

const markingAll = ref(false);

const handleMarkAllRead = async () => {
  markingAll.value = true;
  await markAllRead();
  markingAll.value = false;
};

const handleMarkRead = async (id: string) => {
  const item = notifications.value.find((n: AppNotification) => n.id === id);
  if (!item || item.read) return;
  await markRead(id);
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
</script>
