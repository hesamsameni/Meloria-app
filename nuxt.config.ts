export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@pinia/nuxt", "@posthog/nuxt"],

  css: ["~/assets/css/main.css"], // add this line

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
        host: process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
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
          content:
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
        },
        { name: "theme-color", content: "#e8673a" },
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
