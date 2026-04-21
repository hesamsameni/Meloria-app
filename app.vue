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
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: "Share your music journey with friends" },
  ],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500&display=swap",
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
  font-family: "Raleway", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}
</style>
