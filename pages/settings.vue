<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <SettingsAccountSection />
    <SettingsPasswordSection />
    <SettingsIntegrationsSection />
    <SettingsNotificationsSection />
    <SettingsSuggestionsSection />

    <SettingsApiTokensSection />
  </div>
</template>

<script setup lang="ts">
const { setPageHeader } = usePageHeader();
useHead({ title: "Settings" });
setPageHeader("Settings", "Manage your account information and API access");
</script>
