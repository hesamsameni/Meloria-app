<template>
  <div class="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Decorative blobs -->
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

    <TasteProfileCard
      :profile="tasteProfile"
      :loading="loading"
      :generating="generating"
      :not-found="notFound"
      @generate="generate()"
    />
  </div>
</template>

<script setup lang="ts">
const { setPageHeader } = usePageHeader();
useHead({ title: "Taste Profile" });
const { tasteProfile, loading, generating, notFound, fetch, generate } =
  useTasteProfile();

setPageHeader("Taste Profile", "AI-generated insights into your taste");

onMounted(fetch);
</script>
