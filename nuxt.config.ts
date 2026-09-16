export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@pinia/nuxt", "@posthog/nuxt"],

  css: ["~/assets/css/main.css"], // add this line

  // @nuxt/icon serves its local icon bundle from `/api/_nuxt_icon` by default,
  // which collides with the `/api/**` backend proxy below (icon requests would
  // be forwarded to Express and 404). Move it out of the `/api` namespace.
  icon: {
    localApiEndpoint: "/_nuxt_icon",
  },

  // Hybrid rendering. Auth is client-only (Supabase client plugin + client-side
  // init), so if the app shell were server-rendered it would emit the
  // logged-out layout and then hydrate into the logged-in layout — a structural
  // hydration mismatch that intermittently blanks the page on refresh/login.
  // App routes are therefore rendered client-side (SPA); only the public
  // marketing/legal pages keep SSR for SEO and social previews.
  routeRules: {
    "/**": { ssr: false },
    "/welcome": { ssr: true },
    "/terms": { ssr: true },
    "/privacy": { ssr: true },
  },

  // Local dev only: the frontend calls a relative `/api` base (see
  // NUXT_PUBLIC_API_URL), which in production is rewritten to the backend by
  // the platform proxy. Locally there is no such proxy, so we forward
  // `/api/**` on the Nuxt dev server to the Express backend, stripping the
  // `/api` prefix (the `**` glob is mapped to the target's `**`).
  $development: {
    routeRules: {
      "/api/**": {
        proxy: `${process.env.NUXT_DEV_BACKEND_ORIGIN || "http://localhost:3000"}/**`,
      },
    },
  },

  runtimeConfig: {
    // Server-only secrets. Values are read from the matching env vars at runtime
    // (Nitro on Vercel exposes them via process.env, which the ported server
    // modules read directly). Declared here so the contract is documented and
    // overridable, and so Nuxt loads them from .env in development.
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    supabaseAvatarsBucket: process.env.SUPABASE_AVATARS_BUCKET,
    frontendUrl: process.env.FRONTEND_URL,
    cronSecret: process.env.CRON_SECRET,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID,
    stripeUltimatePriceId: process.env.STRIPE_ULTIMATE_PRICE_ID,
    stripeTestPriceId: process.env.STRIPE_TEST_PRICE_ID,
    stripePortalConfigId: process.env.STRIPE_PORTAL_CONFIG_ID,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    tmdbApiToken: process.env.TMDB_API_TOKEN,
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      // Same-origin now that the backend lives in this app's Nitro server.
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "/api",
      proPriceLabel: process.env.NUXT_PUBLIC_PRO_PRICE_LABEL || "4.99 Euros",
      ultimatePriceLabel:
        process.env.NUXT_PUBLIC_ULTIMATE_PRICE_LABEL || "9.99 Euros",
      posthog: {
        publicKey: process.env.NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN || "",
        host:
          process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      },
    },
  },

  nitro: {
    // Allow long-running AI operations (suggestions, taste profiles, SSE chat,
    // cron batches) to run beyond the default serverless limit.
    vercel: {
      functions: {
        maxDuration: 300,
      },
    },
  },
  posthogConfig: {
    publicKey: process.env.NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN || "",
    host: process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    clientConfig: {
      capture_exceptions: true,
    },
  },
  app: {
    head: {
      titleTemplate: "%s | Meloria",
      title: "Meloria",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        },
        { name: "theme-color", content: "#e8673a" },

        // Primary description
        {
          name: "description",
          content:
            "Meloria helps you capture, organise, and rediscover the books, films, music, and shows you love — with AI-powered recommendations tailored to your taste.",
        },

        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Meloria" },
        {
          property: "og:title",
          content: "Meloria — Your personal taste library",
        },
        {
          property: "og:description",
          content:
            "Capture books, films, music, and shows. Get AI recommendations tailored to your taste. Build your personal library and discover what to enjoy tonight.",
        },
        { property: "og:image", content: "/og-image.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: "Meloria — Your personal taste library",
        },

        // Twitter / X Card
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Meloria — Your personal taste library",
        },
        {
          name: "twitter:description",
          content:
            "Capture books, films, music, and shows. Get AI recommendations tailored to your taste.",
        },
        { name: "twitter:image", content: "/og-image.png" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/manifest.json" },
      ],
    },
  },
});
