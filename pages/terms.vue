<template>
  <div class="legal-page">
    <LandingNav />
    <main class="legal-content">
      <div class="legal-container">
        <h1>Terms of Service</h1>
        <p class="legal-updated">Last updated: June 2, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Meloria ("the Service"), you agree to be bound
            by these Terms of Service. If you do not agree to these terms,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Meloria is a personal library and recommendation platform for
            movies, TV shows, books, and music. The Service allows you to
            capture, organise, and discover cultural content based on your
            taste.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You must notify us immediately of any unauthorised use of
            your account.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>
              Attempt to gain unauthorised access to any part of the Service
            </li>
            <li>Transmit any harmful, offensive, or disruptive content</li>
            <li>
              Scrape, crawl, or otherwise extract data from the Service in bulk
            </li>
            <li>Interfere with the proper functioning of the Service</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality
            are owned by Meloria and are protected by applicable intellectual
            property laws. Content metadata is sourced from third-party
            providers (TMDB, Spotify, Google Books) under their respective
            licences.
          </p>
        </section>

        <section>
          <h2>6. Subscriptions and Billing</h2>
          <p>
            Certain features of the Service require a paid subscription.
            Subscriptions are billed in advance on a monthly or annual basis.
            You may cancel at any time; cancellation takes effect at the end of
            the current billing period.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at our
            discretion if you violate these Terms. You may also delete your
            account at any time from the Settings page.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind,
            either express or implied. We do not guarantee that the Service will
            be uninterrupted, error-free, or completely secure.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Meloria shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of
            significant changes by posting a notice in the app or sending an
            email. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at
            <a href="mailto:hello@meloria.app">hello@meloria.app</a>.
          </p>
        </section>
      </div>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
useHead({
  title: "Terms of Service — Meloria",
  meta: [{ name: "description", content: "Meloria Terms of Service." }],
});
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #0e0c0a;
  color: #f3f0ea;
  font-family: "Raleway", sans-serif;
}

.legal-content {
  padding: 80px 24px 120px;
}

.legal-container {
  max-width: 720px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.legal-updated {
  color: var(--text-muted, #8888a0);
  font-size: 0.9rem;
  margin-bottom: 48px;
}

section {
  margin-bottom: 40px;
}

h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text, #e8e8f0);
}

p,
li {
  font-size: 0.975rem;
  line-height: 1.75;
  color: var(--text-secondary, #b0b0c8);
}

ul {
  padding-left: 20px;
  margin-top: 8px;
}

li {
  margin-bottom: 6px;
}

a {
  color: var(--accent, #a78bfa);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
