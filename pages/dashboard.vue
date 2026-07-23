<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- onboarding -->
    <OnboardingModal v-if="user?.id" :user-id="user.id" />

    <!-- greeting hero (desktop — mobile shows it in the top bar) -->
    <div class="hidden md:block mb-6">
      <div
        class="relative overflow-hidden rounded-3xl border border-neutral-200/70 dark:border-neutral-800/70 bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-transparent dark:from-primary-500/15 dark:via-primary-500/5 px-7 py-6"
      >
        <div class="relative z-10 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <h1
              class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate"
            >
              {{ greeting }}
            </h1>
            <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {{ today }}
            </p>
          </div>
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500"
          >
            <UIcon name="i-lucide-sparkles" class="w-6 h-6" />
          </div>
        </div>
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-primary-400/10 blur-2xl"
        />
      </div>
    </div>

    <!-- capture -->
    <div class="mb-8">
      <CaptureBar @captured="handleCaptured" />
    </div>

    <!-- quick links grid -->
    <div class="mb-8 grid grid-cols-2 gap-3">
      <NuxtLink
        :to="user?.id ? `/profile/${user.id}/tonight` : '/dashboard'"
        class="group relative flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 overflow-hidden"
      >
        <span
          class="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-200"
        >
          <UIcon name="i-lucide-moon" class="w-5 h-5" />
        </span>
        <span class="min-w-0">
          <span
            class="block text-sm font-semibold text-neutral-900 dark:text-white"
            >What tonight?</span
          >
          <span
            class="block text-xs text-neutral-500 dark:text-neutral-400 truncate"
            >A personal pick from your library</span
          >
        </span>
      </NuxtLink>

      <NuxtLink
        :to="user?.id ? `/profile/${user.id}/suggestions` : '/dashboard'"
        class="group relative flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 overflow-hidden"
      >
        <span
          class="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-200"
        >
          <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
        </span>
        <span class="min-w-0">
          <span
            class="block text-sm font-semibold text-neutral-900 dark:text-white"
            >Suggestions</span
          >
          <span
            class="block text-xs text-neutral-500 dark:text-neutral-400 truncate"
            >Personalised picks for your taste</span
          >
        </span>
      </NuxtLink>
    </div>

    <!-- starter picks for new joiners -->
    <StarterPicks
      v-if="!items.loading.value && recentItems.length < 3"
      @added="handleStarterAdded"
    />

    <!-- recent -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          Recently captured
        </h2>
        <NuxtLink
          :to="user?.id ? `/profile/${user.id}` : '/dashboard'"
          class="text-xs text-neutral-400 hover:text-primary-500 transition-colors"
        >
          View all →
        </NuxtLink>
      </div>

      <ItemList
        :items="recentItems"
        :loading="items.loading.value"
        :show-status="true"
        empty-message="Nothing captured yet — use the bar above to add your first item"
      />
    </div>

    <div
      v-if="items.hasMore.value && !items.loading.value"
      class="mt-4 text-center"
    >
      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="items.loadingMore.value"
        @click="items.loadMore()"
      >
        Load more
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from "~/services/items.service";

const { user } = useAuth();
const { displayLabel } = useProfile();
const items = useItems();
const route = useRoute();
const router = useRouter();
const toast = useGlobalToast();
const posthog = usePostHog();
const { setPageHeader } = usePageHeader();
useHead({ title: "Dashboard" });

const recentItems = computed(() => items.items.value);

const handleCaptured = (newItem: Item) => {
  items.items.value.unshift(newItem);
};

const handleStarterAdded = (newItem: Item) => {
  items.items.value.unshift(newItem);
};

const greeting = computed(() => {
  const h = new Date().getHours();
  const rawName = (displayLabel.value || user.value?.email || "").trim();
  const firstName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
  const name = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : "";

  if (h < 12) return name ? `Good morning, ${name}` : "Good morning";
  if (h < 18) return name ? `Good afternoon, ${name}` : "Good afternoon";
  return name ? `Good evening, ${name}` : "Good evening";
});

const today = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

watchEffect(() => {
  setPageHeader(greeting.value, today.value);
});

onMounted(() => {
  items.fetch();
  items.fetchTotals();

  if (user.value?.email) {
    posthog?.identify(user.value.email);
  }

  if (route.query.upgraded === "true") {
    posthog?.capture("upgrade_completed");
    toast.success(
      "You're all upgraded!",
      "Your subscription is now active. Enjoy the new features.",
    );
    router.replace({ query: {} });
  }
});
</script>
