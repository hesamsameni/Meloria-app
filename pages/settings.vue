<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <SettingsAccountSection />
    <SettingsPlanSection />
    <SettingsAiModelSection />
    <SettingsIntegrationsSection />
    <SettingsApiTokensSection />
  </div>
</template>

<script setup lang="ts">
const { setPageHeader } = usePageHeader();
useHead({ title: "Settings" });
setPageHeader("Settings", "Manage your account information and API access");
</script>
