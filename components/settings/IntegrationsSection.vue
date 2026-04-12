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
        description="Connect Telegram to capture anything directly from your phone — voice notes, links, forwarded posts."
      />

      <SettingsIntegrationProviderCard
        icon="i-simple-icons-spotify"
        title="Spotify"
        provider="spotify"
        description="Connect Spotify to add tracks to your playlists directly from Meloria, and create a smart playlist based on your listening habits."
      />

      <SettingsIntegrationProviderCard
        icon="i-simple-icons-soundcloud"
        title="SoundCloud"
        provider="soundcloud"
        description="Connect SoundCloud to add tracks to your playlists directly from Meloria, and create a smart playlist based on your listening habits."
      />
    </div>
  </section>
</template>
