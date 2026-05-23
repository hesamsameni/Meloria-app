<template>
  <div
    class="group flex flex-col overflow-hidden rounded-xl border bg-card/80 dark:bg-card-dark/80 border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <!-- Artwork -->
    <div class="relative h-36 bg-neutral-100 dark:bg-neutral-900 shrink-0">
      <img
        v-if="item.backdrop_url || item.artwork_url"
        :src="(item.backdrop_url || item.artwork_url)!"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon
          :name="categoryIcon"
          class="w-10 h-10 text-neutral-400 dark:text-neutral-500"
        />
      </div>

      <!-- Category badge -->
      <div class="absolute left-2 top-2">
        <UBadge
          :label="item.category.toUpperCase()"
          size="xs"
          variant="solid"
          color="primary"
        />
      </div>

      <!-- Popularity -->
      <div v-if="item.popularity > 1" class="absolute right-2 top-2">
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-black/50 text-white"
        >
          <UIcon name="i-lucide-users" class="w-3 h-3" />
          {{ item.popularity }}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col flex-1">
      <p
        class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate"
      >
        {{ item.title }}
      </p>
      <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 truncate">
        <span v-if="item.creator">{{ item.creator }}</span>
        <span v-if="item.creator && item.release_year"> · </span>
        <span v-if="item.release_year">{{ item.release_year }}</span>
        <span
          v-if="(item.creator || item.release_year) && item.external_rating"
        >
          ·
        </span>
        <span
          v-if="item.external_rating"
          class="inline-flex items-center gap-0.5"
        >
          <UIcon name="i-lucide-star" class="w-2.5 h-2.5 text-yellow-400" />
          {{ item.external_rating }}
        </span>
      </p>

      <!-- Actions -->
      <div
        class="mt-auto pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-1.5"
      >
        <!-- Added state -->
        <template v-if="addedStatus">
          <UIcon
            name="i-lucide-check-circle"
            class="w-3.5 h-3.5 text-green-500 shrink-0"
          />
          <span
            class="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex-1"
          >
            {{
              addedStatus === "want_to" ? "Added to list" : "Added as finished"
            }}
          </span>
          <NuxtLink
            v-if="addedItemId"
            :to="`/items/${addedItemId}`"
            class="text-xs text-primary-500 hover:text-primary-600 transition-colors"
          >
            View →
          </NuxtLink>
        </template>

        <template v-else>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            :loading="loading === 'want_to'"
            :disabled="!!loading"
            class="flex-1"
            @click="add('want_to')"
          >
            Want to
          </UButton>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            :loading="loading === 'finished'"
            :disabled="!!loading"
            @click="add('finished')"
          >
            {{ finishedLabel }}
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoverItem, Item } from "~/services/items.service";
import { createItemsService } from "~/services/items.service";
import { CATEGORY_ICON } from "~/constants/items";

const props = defineProps<{
  item: DiscoverItem;
}>();

const emit = defineEmits<{
  added: [item: Item];
}>();

const api = useApiService();
const itemsService = createItemsService(api);
const toast = useGlobalToast();

const loading = ref<"want_to" | "finished" | null>(null);
const addedStatus = ref<"want_to" | "finished" | null>(null);
const addedItemId = ref<string | null>(null);

const categoryIcon = computed(
  () => CATEGORY_ICON[props.item.category] ?? "i-lucide-compass",
);

const FINISHED_LABEL: Record<string, string> = {
  book: "Read it",
  music: "Listened",
  podcast: "Listened",
  game: "Played it",
};

const finishedLabel = computed(
  () => FINISHED_LABEL[props.item.category] ?? "Seen it",
);

const add = async (status: "want_to" | "finished") => {
  loading.value = status;
  try {
    const { item } = await itemsService.addDiscoverItem(props.item.id, status);
    addedStatus.value = status;
    addedItemId.value = item.id;
    emit("added", item);
  } catch (e: any) {
    if (e?.data?.error === "Already in your library") {
      toast.info(
        "Already in your library",
        `${props.item.title} is already saved`,
      );
      addedStatus.value = status;
    } else {
      toast.error(
        "Failed to add",
        e?.data?.error || e?.message || "Something went wrong",
      );
    }
  } finally {
    loading.value = null;
  }
};
</script>
