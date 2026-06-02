<template>
  <div class="legal-page">
    <LandingNav />
    <main class="legal-content">
      <div class="legal-container">
        <h1>Privacy Policy</h1>
        <p class="legal-updated">Last updated: June 2, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Meloria ("we", "us", or "our") is committed to protecting your
            personal information. This Privacy Policy explains what data we
            collect, how we use it, and your rights regarding it.
          </p>
        </section>

        <section>
          <h2>2. Data We Collect</h2>
          <p>We collect the following categories of data:</p>
          <ul>
            <li>
              <strong>Account data:</strong> email address, display name, and
              avatar when you sign up.
            </li>
            <li>
              <strong>Library data:</strong> items you capture (movies, shows,
              books, music) and associated metadata.
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, features used, and
              interactions within the app (via PostHog analytics).
            </li>
            <li>
              <strong>Payment data:</strong> billing information processed
              securely by Stripe. We never store card details on our servers.
            </li>
            <li>
              <strong>Integration data:</strong> tokens for optional third-party
              integrations (Spotify, etc.) that you explicitly connect.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To provide, operate, and improve the Service</li>
            <li>To personalise recommendations based on your taste</li>
            <li>To process subscription payments</li>
            <li>
              To send product updates and transactional emails (you can opt out)
            </li>
            <li>To detect and prevent abuse or security incidents</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with trusted
            service providers who process it on our behalf:
          </p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>PostHog</strong> — product analytics</li>
            <li>
              <strong>OpenRouter / AI providers</strong> — AI feature processing
            </li>
            <li>
              <strong>TMDB, Spotify, Google Books</strong> — metadata enrichment
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. When you
            delete your account, your personal data is removed within 30 days,
            except where retention is required by law.
          </p>
        </section>

        <section>
          <h2>6. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies for authentication and
            analytics. You can control cookie behaviour in your browser
            settings.
          </p>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise these rights, contact us at
            <a href="mailto:hello@meloria.app">hello@meloria.app</a>.
          </p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>
            We implement industry-standard security measures including
            encryption in transit (TLS) and at rest. However, no system is
            completely secure and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not
            knowingly collect personal data from children under 13.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you
            of material changes by posting a notice in the app or via email.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            Questions about this Privacy Policy? Reach us at
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
  title: "Privacy Policy — Meloria",
  meta: [{ name: "description", content: "Meloria Privacy Policy." }],
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
