<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <SettingsAccountSection />
    <SettingsIntegrationsSection />
    <SettingsNotificationsSection />
    <div v-if="useHasPaidPlan().value">
      <SettingsAiModelSection />
    </div>
    <SettingsSuggestionsSection />

    <SettingsApiTokensSection />
  </div>
</template>

<script setup lang="ts">
import { useHasPaidPlan } from "~/composables/useHasPaidPlan";

const { setPageHeader } = usePageHeader();
useHead({ title: "Settings" });
setPageHeader("Settings", "Manage your account information and API access");
</script>
