<template>
  <aside
    class="flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-6"
    :class="
      mobile ? 'w-52 h-full shadow-xl' : 'w-56 shrink-0 h-screen sticky top-0'
    "
  >
    <!-- logo -->
    <div class="px-3 mb-8 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <img src="/logo.svg" alt="Meloria logo" class="w-6 h-6 shrink-0" />
        <span
          class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white truncate"
        >
          Meloria
        </span>
      </div>
      <UButton
        v-if="mobile"
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Close navigation menu"
        @click="emit('close')"
      />
    </div>

    <!-- nav -->
    <nav class="flex flex-col gap-0.5 flex-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to === '/profile' ? profileTo : item.to"
        @click="emit('navigate')"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="
          isActive(item.to)
            ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
        "
      >
        <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- user -->
    <div class="border-t border-neutral-200 dark:border-neutral-800 pt-4 px-1">
      <div class="flex items-center gap-2.5 mb-2">
        <UAvatar
          :alt="user?.email"
          :src="profile?.avatar_url || undefined"
          size="xs"
          :style="`background: var(--ui-color-primary-500)`"
        />
        <div class="min-w-0 flex-1">
          <span
            class="text-xs text-neutral-500 dark:text-neutral-400 truncate block"
          >
            {{ displayLabel || user?.email }}
          </span>
          <span class="text-[11px] text-neutral-400 truncate block">
            {{
              (profile?.subscription || "free").charAt(0).toUpperCase() +
              (profile?.subscription || "free").slice(1) +
              " plan"
            }}
          </span>
        </div>

        <!-- Bell icon -->
        <UPopover
          v-model:open="notifPanelOpen"
          :popper="{ placement: 'top-end' }"
        >
          <UButton
            variant="ghost"
            size="xs"
            color="neutral"
            class="relative shrink-0 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Notifications"
          >
            <UIcon name="i-lucide-bell" class="w-4 h-4" />
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none"
            >
              {{ unreadCount > 9 ? "9+" : unreadCount }}
            </span>
          </UButton>

          <template #content>
            <NotificationsPanel />
          </template>
        </UPopover>
      </div>

      <UButton
        variant="ghost"
        size="xs"
        color="neutral"
        class="w-full justify-start text-neutral-400"
        @click="handleSignOut"
      >
        Sign out
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { NAV_ITEMS } from "~/constants/navigation";

withDefaults(
  defineProps<{
    mobile?: boolean;
  }>(),
  {
    mobile: false,
  },
);

const emit = defineEmits<{
  (e: "navigate"): void;
  (e: "close"): void;
}>();

const { user, signOut } = useAuth();
const { profile, displayLabel } = useProfile();
const posthog = usePostHog();
const route = useRoute();

const { hasPending, refresh: refreshReflect } = useReflectPending();
const {
  unreadCount,
  fetch: fetchNotifications,
  startPolling,
  stopPolling,
} = useNotifications();

const notifPanelOpen = ref(false);

watch(notifPanelOpen, (open) => {
  if (open) fetchNotifications();
});

onMounted(() => {
  refreshReflect();
  fetchNotifications();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

const { isAdmin } = useProfile();

const navItems = computed(() =>
  NAV_ITEMS.filter(
    (item) =>
      (item.to !== "/reflect" || hasPending.value !== false) &&
      (item.adminOnly !== true || isAdmin.value),
  ),
);
const profileTo = computed(() =>
  user.value?.id ? `/profile/${user.value.id}` : "/profile",
);

const isActive = (to: string) => {
  if (to === "/dashboard") return route.path === "/dashboard";
  if (to === "/profile")
    return (
      route.path.startsWith("/profile/") && !route.path.startsWith("/library/")
    );
  return route.path === to || route.path.startsWith(`${to}/`);
};

const handleSignOut = async () => {
  localStorage.removeItem("meloria:reflect-pending");
  posthog?.capture("user_signed_out");
  posthog?.reset();
  await signOut();
  emit("navigate");
};
</script>
