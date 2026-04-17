<template>
  <div class="space-y-6">
    <!-- Author (books) -->
    <div
      v-if="item.category === 'book' && item.author_name"
      class="flex items-center gap-4"
    >
      <div class="relative shrink-0">
        <img
          v-if="item.author_photo_url"
          :src="item.author_photo_url"
          :alt="item.author_name"
          class="w-14 h-14 rounded-2xl object-cover"
          @error="
            ($event.target as HTMLImageElement).style.display = 'none';
            (
              $event.target as HTMLImageElement
            ).nextElementSibling!.removeAttribute('style');
          "
        />
        <div
          :style="item.author_photo_url ? 'display:none' : ''"
          class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          <UIcon name="i-lucide-user" class="w-6 h-6 text-neutral-400" />
        </div>
        <span
          class="absolute -bottom-1.5 -right-1.5 bg-primary-500 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white leading-none"
        >
          Auth
        </span>
      </div>
      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {{ item.author_name }}
        </p>
        <p class="text-xs text-neutral-400 mt-0.5">Author</p>
      </div>
    </div>

    <!-- Director -->
    <div
      v-if="item.tmdb_director && Object.keys(item.tmdb_director).length > 0"
      class="flex items-center gap-4"
    >
      <div class="relative shrink-0">
        <img
          v-if="item.tmdb_director.profile_url"
          :src="item.tmdb_director.profile_url"
          :alt="item.tmdb_director.name"
          class="w-14 h-14 rounded-2xl object-cover"
        />
        <div
          v-else
          class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          <UIcon name="i-lucide-user" class="w-6 h-6 text-neutral-400" />
        </div>
        <span
          class="absolute -bottom-1.5 -right-1.5 bg-primary-500 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white leading-none"
        >
          Dir
        </span>
      </div>
      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {{ item.tmdb_director.name }}
        </p>
        <p class="text-xs text-neutral-400 mt-0.5">Director</p>
      </div>
    </div>

    <!-- Divider -->
    <div
      v-if="item.tmdb_director && item.tmdb_cast?.length"
      class="border-t border-neutral-100 dark:border-neutral-800"
    />

    <!-- Cast carousel -->
    <div
      v-if="item.tmdb_cast?.length"
      class="overflow-x-auto scrollbar-hide -mx-4 px-4"
    >
      <div class="flex gap-3 w-max">
        <div
          v-for="member in item.tmdb_cast"
          :key="member.id"
          class="w-[120px] shrink-0 group"
        >
          <div class="relative mb-2">
            <img
              v-if="member.profile_url"
              :src="member.profile_url"
              :alt="member.name"
              class="w-full aspect-[3/4] rounded-xl object-cover bg-neutral-100 dark:bg-neutral-800"
            />
            <div
              v-else
              class="w-full aspect-[3/4] rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-user"
                class="w-7 h-7 text-neutral-300 dark:text-neutral-600"
              />
            </div>
          </div>
          <p
            class="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2"
          >
            {{ member.name }}
          </p>
          <p
            v-if="member.character"
            class="text-[10px] text-neutral-400 leading-snug line-clamp-2 mt-0.5"
          >
            {{ member.character }}
          </p>
        </div>
      </div>
    </div>

    <p
      v-if="!item.author_name && !item.tmdb_director && !item.tmdb_cast?.length"
      class="text-sm text-neutral-400 italic"
    >
      No cast information available.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const props = defineProps<{ item: Item }>();
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
