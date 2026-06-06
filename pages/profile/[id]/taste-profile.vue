<template>
  <div class="relative">
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
useHead({ title: "Taste Profile — Profile" });
const { setPageHeader } = usePageHeader();
setPageHeader("Taste Profile", "AI-generated insights into your taste");
const { tasteProfile, loading, generating, notFound, fetch, generate } =
  useTasteProfile();

onMounted(fetch);
</script>
