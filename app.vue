<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const { init } = useAuth();
useHead({
  title: "Meloria",
  meta: [
    { charset: "utf-8" },
    { name: "description", content: "Share your music journey with friends" },
  ],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap",
      crossorigin: "",
    },
  ],
});
// use onMounted instead of top-level await
// plugins are guaranteed to be ready by then
onMounted(() => init());
</script>

<style>
body {
  font-family: "Google Sans", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}
</style>
