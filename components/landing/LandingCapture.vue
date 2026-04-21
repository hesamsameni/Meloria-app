<template>
  <section class="capture-section">
    <div class="capture-grid">
      <div class="capture-block">
        <div class="capture-icon">
          <UIcon name="i-lucide-layers-2" class="w-7 h-7" />
        </div>
        <h3>Apple Shortcut</h3>
        <p>
          Share anything from any iOS app directly to Meloria. Generate a
          personal API token in settings and add it to your Shortcut once, then
          capture is one tap away from anywhere on your phone.
        </p>
        <div class="code-block">
          <span class="code-comment"># Your Shortcut header</span><br />
          Authorization: Bearer <span class="code-token">mk_your_token</span>
        </div>
      </div>

      <div class="capture-divider"></div>

      <div class="capture-block">
        <div class="capture-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"
            />
          </svg>
        </div>
        <h3>Telegram Bot</h3>
        <p>
          Forward any post, send a voice note, drop a link, or just type a title
          — Meloria Bot handles it instantly. Link your account with a one-time
          code from settings and start capturing immediately.
        </p>
        <div class="tg-demo">
          <div class="tg-demo-msg">Blinding Lights The Weeknd</div>
          <div class="tg-demo-reply">
            🎵 Blinding Lights · The Weeknd<br /><small
              >After Hours · Spotify ✓ Apple Music ✓</small
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
