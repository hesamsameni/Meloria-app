<template>
  <div>
    <div
      v-if="item.category === 'music' && item.spotify_id"
      class="mb-5 sm:mb-6"
    >
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Preview
      </p>
      <iframe
        :src="`https://open.spotify.com/embed/track/${item.spotify_id}?utm_source=generator&theme=0`"
        width="100%"
        height="80"
        frameborder="0"
        allow="
          autoplay;
          clipboard-write;
          encrypted-media;
          fullscreen;
          picture-in-picture;
        "
        loading="lazy"
        class="block rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70"
      />
    </div>

    <div v-if="item.category === 'place' && mapQuery" class="mb-5 sm:mb-6">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Location
      </p>
      <iframe
        :src="`https://www.google.com/maps?q=${encodeURIComponent(item.raw_input)}&output=embed`"
        width="100%"
        height="260"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        class="block rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const props = defineProps<{ item: Item }>();

const mapQuery = computed(
  () =>
    props.item.category === "place" &&
    (props.item.title || props.item.raw_input),
);
</script>
