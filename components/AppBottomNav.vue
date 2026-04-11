<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur md:hidden"
    aria-label="Bottom navigation"
  >
    <div class="mx-auto max-w-2xl px-4">
      <div
        class="flex items-stretch justify-between py-2"
        :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors"
          :class="
            isActive(item.to)
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          "
        >
          <UIcon :name="item.icon" class="h-5 w-5" />
          <span class="leading-none">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { NAV_ITEMS } from "~/constants/navigation";

const route = useRoute();
const navItems = NAV_ITEMS;

const isActive = (to: string) => {
  if (to === "/dashboard") return route.path === "/dashboard";
  return route.path === to || route.path.startsWith(`${to}/`);
};
</script>
