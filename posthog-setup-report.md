<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Meloria Nuxt frontend. The project already had `@posthog/nuxt` installed and configured, and many core events were already instrumented. This session filled in the remaining gaps: Google OAuth event tracking, user identification on the dashboard (covering all auth methods including OAuth redirects and magic links), and the `upgrade_completed` conversion event. Environment variable values were also confirmed and written to `.env`.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully created a new account (email, magic_link, or google) | `components/auth/AuthSignUpPanel.vue` |
| `user_signed_in` | User successfully signed in to their account (email, magic_link, or google) | `components/auth/AuthSignInPanel.vue` |
| `user_signed_out` | User signed out of their account | `components/AppSidebar.vue` |
| `item_captured` | User successfully captured an item via the CaptureBar | `components/CaptureBar.vue` |
| `bulk_import_submitted` | User submitted a bulk import of items | `pages/import.vue` |
| `tonight_recommendation_requested` | User requested a "What Tonight?" recommendation | `pages/tonight.vue` |
| `tonight_item_saved_to_library` | User saved a "What Tonight?" recommendation to their library | `pages/tonight.vue` |
| `reflection_submitted` | User submitted a reflection for a finished item | `pages/reflect.vue` |
| `reflection_skipped` | User skipped reflection for an item | `pages/reflect.vue` |
| `upgrade_plan_clicked` | User clicked upgrade or downgrade plan button | `components/settings/PlanSection.vue` |
| `upgrade_completed` | User landed on dashboard after completing an upgrade | `pages/dashboard.vue` |

## Changes made in this session

- **`components/auth/AuthSignInPanel.vue`**: Added `posthog?.capture("user_signed_in", { method: "google" })` in `handleGoogle` before the OAuth redirect.
- **`components/auth/AuthSignUpPanel.vue`**: Added `posthog?.capture("user_signed_up", { method: "google" })` in `handleGoogle` before the OAuth redirect.
- **`pages/dashboard.vue`**: Added `usePostHog()` composable, `posthog?.identify(user.value.email)` on mount (covers all auth methods including Google OAuth redirect and magic link), and `posthog?.capture("upgrade_completed")` when the `?upgraded=true` query param is present.
- **`.env`**: Set correct values for `NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NUXT_PUBLIC_POSTHOG_HOST`.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/164691/dashboard/668577
- **New sign-ups over time** (line chart, broken down by method): https://eu.posthog.com/project/164691/insights/R2l5joYv
- **Sign-up to first capture funnel** (activation metric): https://eu.posthog.com/project/164691/insights/nohuASru
- **Upgrade conversion funnel** (monetization): https://eu.posthog.com/project/164691/insights/uEDSaGFA
- **Feature engagement comparison** (What Tonight, Reflections, Bulk Import): https://eu.posthog.com/project/164691/insights/aC6WnDNs
- **Reflection completion vs skip rate**: https://eu.posthog.com/project/164691/insights/YEzJjkgW

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nuxt-4/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
