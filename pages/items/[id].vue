<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10" v-if="item">
    <!-- back -->
    <NuxtLink
      to="/library"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to library
    </NuxtLink>

    <!-- hero -->
    <div class="flex gap-5 mb-8">
      <!-- artwork -->
      <div class="shrink-0">
        <img
          v-if="item.artwork_url"
          :src="item.artwork_url"
          :alt="item.title || ''"
          class="rounded-xl object-cover shadow-lg"
          :class="item.category === 'music' ? 'w-36 h-36' : 'w-28 h-40'"
        />
        <div
          v-else
          class="w-28 h-40 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-4xl"
        >
          {{ categoryEmoji }}
        </div>
      </div>

      <!-- main info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start gap-2 mb-1">
          <UBadge
            :label="item.category"
            size="xs"
            variant="soft"
            color="primary"
          />
          <UBadge
            v-if="item.input_type === 'voice_transcript'"
            label="🎙 voice"
            size="xs"
            variant="soft"
            color="primary"
          />
        </div>

        <h1
          class="text-2xl font-semibold text-neutral-900 dark:text-white mt-2 mb-0.5"
        >
          {{ item.title || "Untitled" }}
        </h1>

        <p
          v-if="item.creator"
          class="text-neutral-500 dark:text-neutral-400 mb-3"
        >
          {{ item.creator }}
        </p>

        <!-- meta pills -->
        <div
          class="flex items-center gap-3 text-sm text-neutral-400 flex-wrap mb-4"
        >
          <span v-if="item.release_year">{{ item.release_year }}</span>
          <span v-if="item.external_rating" class="flex items-center gap-1">
            ⭐ {{ item.external_rating }}
          </span>
          <span v-if="item.runtime">{{ formatRuntime(item.runtime) }}</span>
          <span v-if="item.album_name" class="italic">{{
            item.album_name
          }}</span>
        </div>

        <!-- genres -->
        <div v-if="item.genres?.length" class="flex gap-1.5 flex-wrap mb-4">
          <UBadge
            v-for="g in item.genres"
            :key="g"
            :label="g"
            size="xs"
            variant="outline"
            color="neutral"
          />
        </div>

        <!-- status -->
        <USelect
          :model-value="item.status"
          :items="statusOptions"
          size="sm"
          class="w-36"
          @update:model-value="updateStatus"
        />
      </div>
    </div>

    <!-- spotify embed -->
    <div v-if="item.category === 'music' && item.spotify_id" class="mb-6">
      <iframe
        :src="`https://open.spotify.com/embed/track/${item.spotify_id}?utm_source=generator&theme=0`"
        width="100%"
        height="152"
        frameborder="0"
        allow="
          autoplay;
          clipboard-write;
          encrypted-media;
          fullscreen;
          picture-in-picture;
        "
        loading="lazy"
        class="rounded-xl"
      />
    </div>

    <!-- map embed -->
    <div v-if="item.category === 'place' && mapQuery" class="mb-6">
      <iframe
        :src="`https://www.google.com/maps?q=${encodeURIComponent(item.raw_input)}&output=embed`"
        width="100%"
        height="260"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        class="rounded-xl border border-neutral-100 dark:border-neutral-800"
      />
    </div>

    <!-- description -->
    <UCard v-if="item.description" class="mb-6">
      <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {{ item.description }}
      </p>
    </UCard>

    <!-- platform links -->
    <div class="mb-6">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        {{ linksLabel }}
      </p>

      <div class="flex flex-wrap gap-2">
        <!-- music links -->
        <template v-if="item.category === 'music'">
          <UButton
            v-if="item.spotify_url"
            :to="item.spotify_url"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-spotify"
            label="Play on Spotify"
          />
          <UButton
            v-if="item.apple_music_url"
            :to="item.apple_music_url"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-applemusic"
            label="Apple Music"
          />
          <UButton
            v-if="item.youtube_url"
            :to="item.youtube_url"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-youtube"
            label="YouTube"
          />
          <UButton
            v-if="item.deezer_url"
            :to="item.deezer_url"
            target="_blank"
            color="neutral"
            variant="outline"
            label="Deezer"
          />
        </template>

        <!-- movie / show links -->
        <template v-if="item.category === 'movie' || item.category === 'show'">
          <UButton
            v-if="item.tmdb_id"
            :to="`https://www.themoviedb.org/${item.category === 'show' ? 'tv' : 'movie'}/${item.tmdb_id}`"
            target="_blank"
            color="neutral"
            variant="outline"
            label="TMDB"
          />
          <UButton
            :to="`https://www.google.com/search?q=${encodeURIComponent((item.title || '') + ' where to watch')}`"
            target="_blank"
            color="neutral"
            variant="outline"
            label="Where to watch"
          />
          <UButton
            :to="`https://www.imdb.com/find?q=${encodeURIComponent(item.title || '')}`"
            target="_blank"
            color="neutral"
            variant="outline"
            label="IMDB"
          />
        </template>

        <!-- book links -->
        <template v-if="item.category === 'book'">
          <UButton
            v-if="item.goodreads_url"
            :to="item.goodreads_url"
            target="_blank"
            color="neutral"
            variant="outline"
            label="Goodreads"
          />
          <UButton
            v-if="item.amazon_url"
            :to="item.amazon_url"
            target="_blank"
            color="neutral"
            variant="outline"
            label="Buy on Amazon"
          />
          <UButton
            v-if="item.audible_url"
            :to="item.audible_url"
            target="_blank"
            color="neutral"
            variant="outline"
            label="Audible"
          />
        </template>
      </div>
    </div>

    <!-- ai notes -->
    <UCard v-if="item.ai_notes" class="mb-6">
      <div class="flex items-start gap-2">
        <UIcon
          name="i-lucide-sparkles"
          class="w-4 h-4 text-primary-500 shrink-0 mt-0.5"
        />
        <p class="text-sm text-neutral-500 dark:text-neutral-400 italic">
          {{ item.ai_notes }}
        </p>
      </div>
    </UCard>

    <!-- your notes -->
    <div class="mb-6">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Your notes
      </p>
      <UTextarea
        v-model="userNotes"
        placeholder="Add your thoughts..."
        :rows="3"
        @blur="saveNotes"
      />
    </div>

    <!-- tags -->
    <div v-if="item.tags?.length" class="mb-6">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Tags
      </p>
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
    </div>

    <!-- meta footer -->
    <div
      class="text-xs text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between"
    >
      <span>Saved {{ fullDate }} via {{ item.source }}</span>
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        label="Delete"
        @click="deleteItem"
      />
    </div>
  </div>

  <!-- loading -->
  <div v-else-if="loading" class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="flex gap-5 mb-8">
      <USkeleton class="w-28 h-40 rounded-xl shrink-0" />
      <div class="flex-1 flex flex-col gap-3">
        <USkeleton class="h-6 w-3/4" />
        <USkeleton class="h-4 w-1/2" />
        <USkeleton class="h-4 w-1/3" />
      </div>
    </div>
    <USkeleton class="h-32 w-full rounded-xl mb-4" />
    <USkeleton class="h-20 w-full rounded-xl" />
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const route = useRoute();
const router = useRouter();
const { getToken } = useAuth();
const config = useRuntimeConfig();

const item = ref<Item | null>(null);
const loading = ref(true);
const userNotes = ref("");

const statusOptions = [
  { label: "Saved", value: "saved" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Skipped", value: "skipped" },
];

const call = async (path: string, options: any = {}) => {
  const token = await getToken();
  return $fetch(`${config.public.apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

const categoryEmoji = computed(() => {
  const map: Record<string, string> = {
    movie: "🎬",
    music: "🎵",
    book: "📚",
    show: "📺",
    article: "📰",
    place: "📍",
    person: "👤",
    idea: "💡",
    note: "📝",
    product: "🛍️",
  };
  return map[item.value?.category || ""] || "✦";
});

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

const mapQuery = computed(() => {
  if (item.value?.category !== "place") return "";
  return item.value?.title || item.value?.raw_input || "";
});

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fullDate = computed(() =>
  item.value
    ? new Date(item.value.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "",
);

const updateStatus = async (status: string) => {
  if (!item.value) return;
  await call(`/items/${item.value.id}`, { method: "PATCH", body: { status } });
  item.value.status = status;
};

const saveNotes = async () => {
  if (!item.value) return;
  await call(`/items/${item.value.id}`, {
    method: "PATCH",
    body: { your_notes: userNotes.value },
  });
};

const deleteItem = async () => {
  if (!item.value) return;
  await call(`/items/${item.value.id}`, { method: "DELETE" });
  router.push("/library");
};

onMounted(async () => {
  try {
    const data = (await call(`/items/${route.params.id}`)) as Item;
    item.value = data;
    userNotes.value = data.your_notes || "";
  } finally {
    loading.value = false;
  }
});
</script>
