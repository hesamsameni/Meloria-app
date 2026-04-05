<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const { init } = useAuth();

// use onMounted instead of top-level await
// plugins are guaranteed to be ready by then
onMounted(() => init());
</script>
