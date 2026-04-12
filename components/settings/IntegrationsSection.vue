<template>
  <section class="mb-8">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Integrations
    </p>

    <div class="space-y-3">
      <SettingsTelegramSection :show-title="false" />

      <SettingsIntegrationProviderCard
        icon="🎵"
        title="Spotify"
        description="Connect Spotify to import tracks and playlists directly into your library."
      />

      <SettingsIntegrationProviderCard
        icon="☁️"
        title="SoundCloud"
        description="Connect SoundCloud to capture tracks, likes, and reposts into Meloria."
      />
    </div>
  </section>
</template>
