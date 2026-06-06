<template>
  <SuggestionsContent />
</template>

<script setup lang="ts">
useHead({ title: "Suggestions — Profile" });
const { setPageHeader } = usePageHeader();
setPageHeader("Suggestions", "Based on your taste profile");
</script>
