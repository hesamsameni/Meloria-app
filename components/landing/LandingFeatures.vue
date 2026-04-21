<template>
  <section class="features" id="features">
    <div class="section-header">
      <div class="section-tag">Features</div>
      <h2>Everything your<br />cultural life deserves</h2>
    </div>

    <div class="features-grid">
      <!-- Capture -->
      <div class="feature-card feature-large">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-hard-drive-download" class="w-7 h-7"
          /></span>
        </div>
        <h3>Capture from anywhere</h3>
        <p>
          Telegram bot, Apple Shortcut share sheet, web dashboard, or bulk
          import. One tap from any app, Meloria handles the rest. Enriches the
          content, classifies it, and adds it to your library.
        </p>
        <div class="feature-visual fv-capture">
          <div class="tg-msg">
            <div class="tg-avatar">
              <UIcon name="i-lucide-bot" class="w-7 h-7" />
            </div>
            <div class="tg-bubble"><p>Interstellar</p></div>
          </div>
          <div class="tg-msg tg-reply">
            <div class="tg-bubble reply">
              🎬 <strong>Interstellar</strong><br />
              <small>Christopher Nolan · 2014 · ⭐ 8.6</small><br />
              <small>✓ Added to your brain</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrichment -->
      <div class="feature-card">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-sparkles" class="w-7 h-7"
          /></span>
        </div>
        <h3>Rich enrichment</h3>
        <p>
          Every item gets artwork, ratings, cast, genres, streaming links
          (Spotify, Apple Music, TMDB, Goodreads, Audible) automatically, from
          the world's best databases.
        </p>
        <div class="feature-tags">
          <span class="ftag">Poster artwork</span>
          <span class="ftag">Streaming links</span>
          <span class="ftag">Cast & crew</span>
          <span class="ftag">Ratings</span>
          <span class="ftag">Genres</span>
        </div>
      </div>

      <!-- Bulk import -->
      <div class="feature-card">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-clipboard" class="w-7 h-7"
          /></span>
        </div>
        <h3>Bulk import</h3>
        <p>
          Got a list of 80 movies stuck in a note? Paste them all at once.
          Meloria processes each one in the background, classified, enriched,
          and ready.
        </p>
        <div class="feature-visual fv-bulk">
          <div class="bulk-lines">
            <div class="bulk-line">
              Dune Part Two <span class="bl-check">✓</span>
            </div>
            <div class="bulk-line">
              Eternal Sunshine <span class="bl-check">✓</span>
            </div>
            <div class="bulk-line">
              The Prestige <span class="bl-spinner">⟳</span>
            </div>
            <div class="bulk-line muted">Past Lives</div>
            <div class="bulk-line muted">Manchester by the Sea</div>
          </div>
        </div>
      </div>

      <!-- Taste profile -->
      <div class="feature-card feature-large feature-dark">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-brain" class="w-7 h-7"
          /></span>
        </div>
        <h3>Taste profile</h3>
        <p>
          Twice a week AI analyses everything you've saved, finished, and
          reflected on. Not "you like thrillers", something like "you
          consistently need emotional resolution and get frustrated by ambiguous
          endings, but keep seeking them out anyway."
        </p>
        <div class="feature-visual fv-profile">
          <div class="profile-summary">
            "You gravitate toward slow, contemplative cinema that asks more than
            it answers — Kiarostami, Kieślowski, Hamaguchi — while your book
            shelf is almost entirely Yalom, tracing a search for meaning that
            runs underneath everything else you save."
          </div>
          <div class="profile-tags">
            <span class="ptag">Existential themes</span>
            <span class="ptag">Psychological depth</span>
            <span class="ptag">World cinema</span>
            <span class="ptag">Philosophy</span>
          </div>
        </div>
      </div>

      <!-- Reflection notes -->
      <div class="feature-card">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-pen" class="w-7 h-7"
          /></span>
        </div>
        <h3>Reflection notes</h3>
        <p>
          When you finish something, Meloria asks 3 AI-generated questions
          specific to that film or book. Your answers become a personal
          reflection, fed back into your taste profile.
        </p>
        <div class="feature-visual fv-reflection">
          <div class="reflection-q">
            Did the ending feel earned or evasive to you?
          </div>
          <div class="reflection-a">
            It earned it. The ambiguity felt intentional, not lazy.
          </div>
        </div>
      </div>

      <!-- What tonight -->
      <div class="feature-card feature-accent">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-moon" class="w-7 h-7"
          /></span>
        </div>
        <h3>What tonight?</h3>
        <p>
          One button. Meloria reads your mood, your "Want to" list, and your
          taste profile, and tells you exactly what to watch or read tonight.
          Not a list. One answer.
        </p>
        <div class="feature-visual fv-tonight">
          <div class="tonight-result">
            <div class="tonight-cover">
              <UIcon name="i-lucide-clapperboard" class="w-7 h-7" />
            </div>
            <div class="tonight-info">
              <div class="tonight-title">Perfect Days</div>
              <div class="tonight-reason">
                You saved it 3 months ago. Tuesday evening, quiet mood — this is
                exactly the right film for tonight.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div class="feature-card">
        <div class="feature-icon-wrap">
          <span class="feature-icon"
            ><UIcon name="i-lucide-star" class="w-7 h-7"
          /></span>
        </div>
        <h3>Smart suggestions</h3>
        <p>
          Cross-category recommendations that only Meloria can make, connecting
          your film taste to books you'd love, or your music to a director you
          haven't discovered yet.
        </p>
        <div class="feature-tags">
          <span class="ftag">Film → book connections</span>
          <span class="ftag">Director deep dives</span>
          <span class="ftag">Weekly refresh</span>
        </div>
      </div>
    </div>
  </section>
</template>
