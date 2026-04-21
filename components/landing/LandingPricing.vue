<template>
  <section class="pricing" id="pricing">
    <div class="section-header">
      <div class="section-tag">Pricing</div>
      <h2>Start free.<br />Grow with your library.</h2>
      <p>Simple monthly plans. Cancel anytime.</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-tier">Free</div>
        <div class="pricing-price">
          <span class="price-amount">€0</span>
          <span class="price-period">/ month</span>
        </div>
        <div class="pricing-limit">30 captures per month</div>
        <ul class="pricing-features">
          <li>✓ All capture methods (web, Telegram, Shortcut)</li>
          <li>✓ Full enrichment (TMDB, Spotify, Open Library)</li>
          <li>✓ Library & item detail pages</li>
          <li>✓ Smart suggestions feed</li>
          <li>✓ "What tonight?" recommendations</li>
          <li>✓ Bulk import</li>
          <li>✓ Basic taste profile</li>
        </ul>
        <a href="/dashboard" class="pricing-btn pricing-btn-ghost"
          >Get started free</a
        >
      </div>

      <div class="pricing-card pricing-featured">
        <div class="pricing-popular">Most popular</div>
        <div class="pricing-tier">Pro</div>
        <div class="pricing-price">
          <span class="price-amount">€4.99</span>
          <span class="price-period">/ month</span>
        </div>
        <div class="pricing-limit">120 captures per month</div>
        <ul class="pricing-features">
          <li>✓ Everything in Free</li>
          <li>✓ Full taste profile with cross-category insights</li>
          <li>✓ Reflection notes & post-finish discussion</li>
          <li>✓ Priority enrichment</li>
        </ul>
        <a href="/dashboard" class="pricing-btn pricing-btn-primary"
          >Start Pro</a
        >
      </div>

      <div class="pricing-card">
        <div class="pricing-tier">Ultimate</div>
        <div class="pricing-price">
          <span class="price-amount">€9.99</span>
          <span class="price-period">/ month</span>
        </div>
        <div class="pricing-limit">Unlimited captures</div>
        <ul class="pricing-features">
          <li>✓ Everything in Pro</li>
          <li>✓ Unlimited captures</li>
          <li>✓ AI model selection</li>
          <li>✓ Early access to all new features</li>
          <li>✓ Priority support</li>
        </ul>
        <a href="/dashboard" class="pricing-btn pricing-btn-ghost"
          >Go Ultimate</a
        >
      </div>
    </div>
  </section>
</template>
