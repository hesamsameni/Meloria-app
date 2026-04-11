<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">Settings</h1>
      <p class="text-sm text-neutral-400 mt-0.5">
        Manage your account information and API access
      </p>
    </div>

    <SettingsAccountSection />
    <SettingsPlanSection />
    <SettingsAiModelSection />
    <SettingsTelegramSection />
    <SettingsApiTokensSection />
  </div>
</template>

<script setup lang="ts">
</script>
