<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieBanner />
  </UApp>
</template>

<script setup lang="ts">
useHead({
  title: "Meloria",
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap",
      crossorigin: "",
    },
  ],
});
</script>

<style>
body {
  font-family: "Google Sans", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}
</style>
