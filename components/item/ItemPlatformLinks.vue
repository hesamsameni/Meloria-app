<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <template v-if="item.category === 'music'">
        <UButton
          v-if="item.spotify_url"
          :to="item.spotify_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          icon="i-simple-icons-spotify"
          label="Play on Spotify"
        />
        <UButton
          v-if="item.apple_music_url"
          :to="item.apple_music_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          icon="i-simple-icons-applemusic"
          label="Apple Music"
        />
        <UButton
          v-if="item.youtube_url"
          :to="item.youtube_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          icon="i-simple-icons-youtube"
          label="YouTube"
        />
        <UButton
          v-if="item.deezer_url"
          :to="item.deezer_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="Deezer"
        />
      </template>

      <template v-if="item.category === 'movie' || item.category === 'show'">
        <UButton
          v-if="item.tmdb_id"
          :to="`https://www.themoviedb.org/${item.category === 'show' ? 'tv' : 'movie'}/${item.tmdb_id}`"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="TMDB"
        />
        <UButton
          :to="`https://www.google.com/search?q=${encodeURIComponent((item.title || '') + ' where to watch')}`"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="Where to watch"
        />
        <UButton
          :to="`https://www.imdb.com/find?q=${encodeURIComponent(item.title || '')}`"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="IMDB"
        />
      </template>

      <template v-if="item.category === 'book'">
        <UButton
          v-if="item.goodreads_url"
          :to="item.goodreads_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="Goodreads"
        />
        <UButton
          v-if="item.amazon_url"
          :to="item.amazon_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="Buy on Amazon"
        />
        <UButton
          v-if="item.audible_url"
          :to="item.audible_url"
          target="_blank"
          size="sm"
          color="neutral"
          variant="soft"
          label="Audible"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const props = defineProps<{ item: Item }>();
</script>
