<template>
  <div
    v-if="item"
    class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div
        class="absolute -left-24 top-8 h-48 w-48 rounded-full bg-primary-400/15 blur-3xl"
      />
      <div
        class="absolute right-0 top-14 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
      />
    </div>

    <NuxtLink
      to="/library"
      class="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-950/70 backdrop-blur px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to library
    </NuxtLink>

    <ItemHero :item="item" @status-change="updateStatus" />

    <div class="grid grid-cols-1 gap-5 sm:gap-6 mb-6">
      <UCard
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        v-if="item.category === 'movie' || item.category === 'show'"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Cast & Crew
          </p>
        </template>
        <ItemCastAndCrew :item="item" />
      </UCard>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5 sm:gap-6"
    >
      <div class="space-y-5 sm:space-y-6">
        <UCard
          v-if="embedLabel"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              {{ embedLabel }}
            </p>
          </template>
          <ItemEmbeds :item="item" />
        </UCard>

        <UCard
          v-if="item.description"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Description
            </p>
          </template>
          <p
            class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
          >
            {{ item.description }}
          </p>
        </UCard>

        <UCard
          v-if="item.ai_notes"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              AI Notes
            </p>
          </template>
          <div class="flex items-start gap-2.5">
            <UIcon
              name="i-lucide-sparkles"
              class="w-4 h-4 text-primary-500 shrink-0 mt-0.5"
            />
            <p
              class="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed"
            >
              {{ item.ai_notes }}
            </p>
          </div>
        </UCard>

        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Your Notes
            </p>
          </template>
          <UTextarea
            v-model="userNotes"
            placeholder="Add your thoughts..."
            :rows="4"
            class="w-full"
            @blur="saveNotes"
          />
        </UCard>
      </div>

      <aside class="space-y-5 sm:space-y-6">
        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
          v-if="item.category != 'place'"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              {{ linksLabel }}
            </p>
          </template>
          <ItemPlatformLinks :item="item" />
        </UCard>

        <UCard
          v-if="item.tags?.length"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <p
              class="text-xs font-medium uppercase tracking-widest text-neutral-400"
            >
              Tags
            </p>
          </template>
          <div class="flex gap-1.5 flex-wrap">
            <UBadge
              v-for="tag in item.tags"
              :key="tag"
              :label="tag"
              size="sm"
              variant="outline"
              color="neutral"
            />
          </div>
        </UCard>

        <UCard
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <p class="text-xs text-neutral-400">
              Saved {{ fullDate }} via {{ item.source }}
            </p>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              label="Delete"
              @click="deleteItem"
            />
          </div>
        </UCard>
      </aside>
    </div>
  </div>

  <div v-else-if="loading" class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <USkeleton class="h-80 sm:h-96 w-full rounded-3xl mb-6" />
    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5 sm:gap-6"
    >
      <div class="space-y-5">
        <USkeleton class="h-44 w-full rounded-2xl" />
        <USkeleton class="h-36 w-full rounded-2xl" />
        <USkeleton class="h-40 w-full rounded-2xl" />
      </div>
      <div class="space-y-5">
        <USkeleton class="h-44 w-full rounded-2xl" />
        <USkeleton class="h-28 w-full rounded-2xl" />
        <USkeleton class="h-20 w-full rounded-2xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createItemsService, type Item } from "~/services/items.service";

const route = useRoute();
const router = useRouter();
const api = useApiService();
const itemsService = createItemsService(api);

const item = ref<Item | null>(null);
const loading = ref(true);
const userNotes = ref("");

const fullDate = computed(() =>
  item.value
    ? new Date(item.value.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "",
);

const linksLabel = computed(() => {
  const map: Record<string, string> = {
    music: "Listen on",
    movie: "Watch on",
    show: "Watch on",
    book: "Read on",
    place: "Find on",
  };
  return map[item.value?.category || ""] || "Links";
});

const updateStatus = async (status: string) => {
  if (!item.value) return;
  await itemsService.updateItem(item.value.id, { status });
  item.value.status = status;
};

const mapQuery = computed(
  () =>
    item.value?.category === "place" &&
    (item.value?.title || item.value?.raw_input),
);

const embedLabel = computed(() => {
  if (!item.value) return null;
  const { category, spotify_id, trailer_url } = item.value;
  if (category === "music" && spotify_id) return "Preview";
  if (category === "place" && mapQuery.value) return "Location";
  if ((category === "movie" || category === "show") && trailer_url)
    return "Trailer";
  return null;
});

const saveNotes = async () => {
  if (!item.value) return;
  await itemsService.updateItem(item.value.id, { your_notes: userNotes.value });
};

const deleteItem = async () => {
  if (!item.value) return;
  await itemsService.remove(item.value.id);
  router.push("/library");
};

onMounted(async () => {
  try {
    const data = await itemsService.getById(route.params.id as string);
    item.value = data;
    userNotes.value = data.your_notes || "";
  } finally {
    loading.value = false;
  }
});
</script>
