<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Settings hero (desktop — mobile shows the title in the top bar) -->
    <div class="hidden md:block mb-6">
      <div
        class="relative overflow-hidden rounded-3xl border border-neutral-200/70 dark:border-neutral-800/70 bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-transparent dark:from-primary-500/15 dark:via-primary-500/5 px-7 py-6"
      >
        <div class="relative z-10 flex items-center gap-3.5">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500"
          >
            <UIcon name="i-lucide-settings" class="w-6 h-6" />
          </div>
          <div class="min-w-0">
            <h1
              class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
            >
              Settings
            </h1>
            <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              Manage your account, integrations, and API access
            </p>
          </div>
        </div>
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-primary-400/10 blur-2xl"
        />
      </div>
    </div>

    <SettingsAccountSection />
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
