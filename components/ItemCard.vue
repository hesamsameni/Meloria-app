<template>
  <div
    class="group flex flex-col h-full overflow-hidden rounded-xl border bg-card/80 dark:bg-card-dark/80 border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <NuxtLink :to="`/items/${item.id}`" class="block">
      <div class="relative h-48 bg-neutral-100 dark:bg-neutral-900">
        <img
          v-if="item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon
            :name="categoryIcon"
            class="w-12 h-12 text-neutral-400 dark:text-neutral-500"
          />
        </div>

        <div class="absolute left-3 top-3">
          <UBadge
            :label="item.category.toUpperCase()"
            size="xs"
            variant="solid"
            color="primary"
          />
        </div>

        <div class="absolute right-3 top-3">
          <span
            class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-black/50 text-white"
            >{{ timeAgo }}</span
          >
        </div>
      </div>
    </NuxtLink>

    <div class="p-4 flex flex-col flex-1">
      <div class="min-h-[48px]">
        <p
          class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate"
        >
          {{ item.title || item.raw_input?.slice(0, 60) || "Untitled" }}
        </p>
        <p
          v-if="item.tmdb_director?.name || item.creator"
          class="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate"
        >
          {{ item.tmdb_director?.name || item.creator }}
        </p>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <div
          class="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto whitespace-nowrap"
        >
          <UBadge
            v-if="item.source"
            class="inline-flex shrink-0"
            :label="item.source"
            size="xs"
            variant="outline"
            color="neutral"
          />
          <UBadge
            v-for="tag in (item.tags || []).slice(0, 2)"
            :key="tag"
            class="inline-flex shrink-0"
            :label="tag"
            size="xs"
            variant="outline"
            color="neutral"
          />
        </div>
        <div
          v-if="item.external_rating"
          class="ml-2 flex-shrink-0 inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-300"
        >
          <UIcon name="i-lucide-star" class="w-3.5 h-3.5 text-yellow-400" />
          <span class="text-xs">{{ item.external_rating }}</span>
        </div>
      </div>

      <div class="mt-3">
        <div
          class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"
        >
          <span v-if="item.release_year">{{ item.release_year }}</span>
          <span v-if="item.runtime">• {{ formatRuntime(item.runtime) }}</span>
          <span v-if="item.album_name">• {{ item.album_name }}</span>
        </div>
      </div>

      <div
        v-if="showStatus"
        class="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800/60"
      >
        <USelect
          :model-value="item.status as any"
          :items="statusOptions"
          size="sm"
          class="w-full"
          @update:model-value="onSelectChange($event as string)"
        />
      </div>
    </div>

    <UModal v-model:open="reflectionOpen" title="How was it? ✨">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            You finished
            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
              item.title
            }}</span
            >.
          </p>
          <UFormField label="Your reflection">
            <UTextarea
              v-model="reflectionNote"
              placeholder="What did you think? Would you recommend it?"
              :rows="4"
              class="w-full"
              autofocus
            />
          </UFormField>
          <button
            class="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors"
            @click="goToDiscussion"
          >
            <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
            Discuss with AI
          </button>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            label="Skip"
            @click="saveReflection(false)"
          />
          <UButton
            label="Save reflection"
            :loading="reflectionLoading"
            @click="saveReflection(true)"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";
import { CATEGORY_ICON, STATUS_OPTIONS } from "~/constants/items";
import { createItemsService } from "~/services/items.service";

const props = defineProps<{
  item: Item;
  showStatus?: boolean;
}>();

const emit = defineEmits<{
  "status-change": [id: string, status: string];
}>();

const api = useApiService();
const itemsService = createItemsService(api);
const router = useRouter();

const reflectionOpen = ref(false);
const reflectionNote = ref("");
const reflectionLoading = ref(false);

const onSelectChange = async (status: string) => {
  if (status === "finished") {
    await itemsService.updateItem(props.item.id, {
      status,
      finished_at: new Date().toISOString(),
    });
    emit("status-change", props.item.id, status);
    reflectionNote.value = "";
    reflectionOpen.value = true;
  } else {
    if (
      props.item.status === "finished" &&
      status === "want_to" &&
      props.item.reflection_note
    ) {
      await itemsService.updateItem(props.item.id, { reflection_note: null });
    }
    await itemsService.updateItem(props.item.id, { status });
    emit("status-change", props.item.id, status);
  }
};

const saveReflection = async (withNote: boolean) => {
  reflectionLoading.value = true;
  try {
    if (withNote && reflectionNote.value.trim()) {
      await itemsService.updateItem(props.item.id, {
        reflection_note: reflectionNote.value.trim(),
      });
    }
  } finally {
    reflectionLoading.value = false;
    reflectionOpen.value = false;
    reflectionNote.value = "";
  }
};

const goToDiscussion = async () => {
  await saveReflection(false);
  router.push(`/items/${props.item.id}/discussion`);
};

const statusOptions = [...STATUS_OPTIONS];

const categoryIcon = computed(
  () => CATEGORY_ICON[props.item.category] || "i-lucide-shapes",
);

const isNote = computed(() =>
  ["note", "idea", "thought"].includes(props.item.category),
);

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

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
