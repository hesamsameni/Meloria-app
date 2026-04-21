<template>
  <section class="hero">
    <div class="hero-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-lines"></div>
    </div>

    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Your personal second brain
      </div>

      <h1 class="hero-title">
        Everything you want<br />
        to <em>watch, read, hear</em><br />
        — finally organised
      </h1>

      <p class="hero-sub">
        Meloria captures movies, shows, books, and music from anywhere —
        Telegram, Apple Shortcuts, or the web. It enriches, learns your taste,
        and tells you what to watch tonight.
      </p>

      <div class="hero-actions">
        <a href="/dashboard" class="btn-primary">
          Start for free
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
        <a href="#how" class="btn-ghost">See how it works</a>
      </div>

      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">6</span>
          <span class="stat-label">content types</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">4</span>
          <span class="stat-label">capture sources</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">∞</span>
          <span class="stat-label">cross-category insights</span>
        </div>
      </div>
    </div>

    <div class="hero-visual">
      <div class="screen-frame">
        <div class="screen-bar"><span></span><span></span><span></span></div>
        <img
          src="/landing/item-scshot.png"
          alt="Meloria dashboard"
          class="screen-img"
        />
      </div>

      <div class="float-card float-1">
        <div class="fc-icon">
          <UIcon name="i-lucide-clapperboard" class="w-7 h-7" />
        </div>
        <div class="fc-text">
          <div class="fc-title">Interstellar</div>
          <div class="fc-sub">Enriched from TMDB</div>
        </div>
        <div class="fc-badge">✓</div>
      </div>
      <div class="float-card float-2">
        <div class="fc-icon">
          <UIcon name="i-lucide-brain" class="w-7 h-7" />
        </div>
        <div class="fc-text">
          <div class="fc-title">Taste profile updated</div>
          <div class="fc-sub">You love slow, cerebral cinema</div>
        </div>
      </div>
      <div class="float-card float-3">
        <div class="fc-icon">
          <UIcon name="i-lucide-music" class="w-7 h-7" />
        </div>
        <div class="fc-text">
          <div class="fc-title">Saved via Telegram</div>
          <div class="fc-sub">Cornfield Chase · Hans Zimmer</div>
        </div>
      </div>
    </div>
  </section>
</template>
