<template>
  <nav class="nav">
    <div class="nav-inner">
      <NuxtLink to="/welcome" class="nav-logo">
        <img src="/logo.svg" alt="Meloria logo" class="logo-mark" />
        <span class="logo-text">Meloria</span>
      </NuxtLink>
      <div class="nav-links">
        <a :href="sectionHref('features')">Features</a>
        <a :href="sectionHref('how')">How it works</a>
        <a :href="sectionHref('pricing')">Pricing</a>
      </div>
      <a href="/login" class="nav-cta">Open app →</a>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();

function sectionHref(id: string) {
  return route.path === "/welcome" ? `#${id}` : `/welcome#${id}`;
}
</script>
