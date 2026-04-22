<template>
  <div class="landing">
    <LandingNav />
    <LandingHero />
    <LandingIntegrations />
    <LandingHow />
    <LandingFeatures />
    <LandingCapture />
    <LandingRoadmap />
    <LandingPricing />

    <!-- final cta -->
    <section class="cta-section">
      <div class="cta-bg"><div class="cta-orb"></div></div>
      <div class="cta-content">
        <h2>Your cultural life<br />deserves a brain</h2>
        <p>
          Stop losing recommendations to forgotten notes. Start building a
          library that knows you.
        </p>
        <a href="/dashboard" class="btn-primary btn-large">
          Open Meloria free
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
useHead({
  title: "Meloria — Your personal second brain for movies, books & music",
  meta: [
    {
      name: "description",
      content:
        "Capture movies, shows, books, and music from Telegram, Apple Shortcuts, or the web. Meloria enriches everything automatically and learns your taste to tell you what to watch tonight.",
    },
    { property: "og:title", content: "Meloria — Your personal second brain" },
    {
      property: "og:description",
      content: "Capture, enrich, and discover. Your cultural life, organised.",
    },
  ],
});
</script>

<style>
@import "~/assets/css/landing.css";
</style>
