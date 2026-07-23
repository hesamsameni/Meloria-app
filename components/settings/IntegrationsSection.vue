<template>
  <section class="mb-8">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Integrations
    </p>

    <div class="space-y-3">
      <SettingsIntegrationProviderCard
        icon="i-simple-icons-telegram"
        title="Telegram"
        provider="telegram"
        description="Connect Telegram to capture anything directly from your phone — text, links, and forwarded posts."
      />

      <SettingsIntegrationProviderCard
        icon="i-simple-icons-spotify"
        title="Spotify"
        provider="spotify"
        description="Connect Spotify to automatically add the music you capture to a dedicated Meloria playlist."
      />

      <SettingsIntegrationProviderCard
        icon="i-simple-icons-soundcloud"
        title="SoundCloud"
        provider="soundcloud"
        description="Connect SoundCloud to automatically add the music you capture to a dedicated Meloria playlist."
      />
    </div>
  </section>
</template>
