<template>
  <div>
    <iframe
      v-if="spotifySrc"
      :src="spotifySrc"
      width="100%"
      height="80"
      frameborder="0"
      :allow="mediaAllow"
      loading="lazy"
      class="block rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70"
    />

    <iframe
      v-else-if="mapSrc"
      :src="mapSrc"
      width="100%"
      height="260"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      class="block rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70"
    />

    <iframe
      v-else-if="trailerSrc"
      :src="trailerSrc"
      width="100%"
      height="315"
      frameborder="0"
      :allow="mediaAllow"
      loading="lazy"
      class="block rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70"
    />
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const props = defineProps<{ item: Item }>();

const mediaAllow =
  "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

const spotifySrc = computed(() =>
  props.item.category === "music" && props.item.spotify_id
    ? `https://open.spotify.com/embed/track/${props.item.spotify_id}?utm_source=generator&theme=0`
    : null,
);

const mapSrc = computed(() => {
  const { category, title, raw_input } = props.item;
  return category === "place" && (title || raw_input)
    ? `https://www.google.com/maps?q=${encodeURIComponent(raw_input)}&output=embed`
    : null;
});

const trailerSrc = computed(() => {
  const { category, trailer_url } = props.item;
  return (category === "movie" || category === "show") && trailer_url
    ? trailer_url.replace("watch?v=", "embed/")
    : null;
});
</script>
