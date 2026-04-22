<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <SettingsAccountSection />
    <div v-if="useHasPaidPlan().value">
      <SettingsAiModelSection />
    </div>
    <SettingsIntegrationsSection />
    <SettingsApiTokensSection />
  </div>
</template>

<script setup lang="ts">
import { useHasPaidPlan } from "~/composables/useHasPaidPlan";

const { setPageHeader } = usePageHeader();
useHead({ title: "Settings" });
setPageHeader("Settings", "Manage your account information and API access");
</script>
