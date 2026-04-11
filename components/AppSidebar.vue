<template>
  <aside
    class="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-6"
  >
    <!-- logo -->
    <div class="px-3 mb-8">
      <span
        class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white"
      >
        Meloria
      </span>
    </div>

    <!-- nav -->
    <nav class="flex flex-col gap-0.5 flex-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        activeClass="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium"
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
      </div>
      <UButton
        variant="ghost"
        size="xs"
        color="neutral"
        class="w-full justify-start text-neutral-400"
        @click="signOut"
      >
        Sign out
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { NAV_ITEMS } from "~/constants/navigation";

const { user, signOut } = useAuth();
const { profile, displayLabel } = useProfile();

const navItems = NAV_ITEMS;
</script>
