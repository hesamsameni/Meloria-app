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
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "http://localhost:3000",
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
