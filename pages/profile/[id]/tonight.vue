<template>
  <TonightContent />
</template>

<script setup lang="ts">
useHead({ title: "What Tonight? — Profile" });
const { setPageHeader } = usePageHeader();
setPageHeader("What tonight?", "One pick from your library, with a reason");
</script>
