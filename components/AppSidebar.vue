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
      <template v-for="item in navItems" :key="item.to">
        <template v-if="item.to === '/library'">
          <div class="flex items-center gap-1">
            <NuxtLink
              :to="item.to"
              @click="emit('navigate')"
              class="flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="
                isLibraryActive
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              "
            >
              <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
              {{ item.label }}
            </NuxtLink>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              class="shrink-0"
              :icon="
                isLibraryGroupOpen
                  ? 'i-lucide-chevron-down'
                  : 'i-lucide-chevron-right'
              "
              aria-label="Toggle library categories"
              @click="isLibraryGroupOpen = !isLibraryGroupOpen"
            />
          </div>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="isLibraryGroupOpen"
              class="ml-6 mt-1 flex flex-col gap-0.5"
            >
              <template
                v-for="categoryItem in libraryCategoryItems"
                :key="categoryItem.to"
              >
                <span
                  v-if="(categoryItem as any).comingSoon"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-400 dark:text-neutral-600 cursor-not-allowed select-none"
                >
                  <UIcon
                    :name="categoryItem.icon"
                    class="w-3.5 h-3.5 shrink-0"
                  />
                  {{ categoryItem.label }}
                  <span
                    class="ml-auto text-[10px] font-medium text-neutral-400 dark:text-neutral-600"
                    >Soon</span
                  >
                </span>
                <NuxtLink
                  v-else
                  :to="categoryItem.to"
                  @click="emit('navigate')"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  :class="
                    isActive(categoryItem.to)
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  "
                >
                  <UIcon
                    :name="categoryItem.icon"
                    class="w-3.5 h-3.5 shrink-0"
                  />
                  {{ categoryItem.label }}
                </NuxtLink>
              </template>
            </div>
          </Transition>
        </template>

        <NuxtLink
          v-else
          :to="item.to"
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
      </template>
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
import { LIBRARY_CATEGORY_NAV_ITEMS } from "~/constants/items";
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
const route = useRoute();

const { hasPending, refresh: refreshReflect } = useReflectPending();
onMounted(refreshReflect);

const navItems = computed(() =>
  NAV_ITEMS.filter(
    (item) => item.to !== "/reflect" || hasPending.value !== false,
  ),
);
const libraryCategoryItems = LIBRARY_CATEGORY_NAV_ITEMS;

const isLibraryActive = computed(
  () => route.path === "/library" || route.path.startsWith("/library/"),
);

const isLibraryGroupOpen = ref(false);

watchEffect(() => {
  if (isLibraryActive.value) {
    isLibraryGroupOpen.value = true;
  }
});

const isActive = (to: string) => {
  if (to === "/dashboard") return route.path === "/dashboard";
  return route.path === to || route.path.startsWith(`${to}/`);
};

const handleSignOut = async () => {
  localStorage.removeItem("meloria:reflect-pending");
  await signOut();
  emit("navigate");
};
</script>
