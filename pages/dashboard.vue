<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- onboarding -->
    <OnboardingModal v-if="user?.id" :user-id="user.id" />
    <!-- capture -->
    <div class="mb-8">
      <CaptureBar @captured="handleCaptured" />
    </div>

    <!-- quick links grid -->
    <div class="mb-8 grid grid-cols-2 gap-3">
      <NuxtLink
        :to="user?.id ? `/profile/${user.id}/tonight` : '/dashboard'"
        class="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-150 group text-neutral-500 dark:text-neutral-400"
      >
        <UIcon name="i-lucide-moon" class="w-5 h-5" />
        <span
          class="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors"
          >What tonight?</span
        >
        <span class="text-xs text-center hidden sm:block"
          >Get a personal pick from your library</span
        >
      </NuxtLink>

      <NuxtLink
        :to="user?.id ? `/profile/${user.id}/suggestions` : '/dashboard'"
        class="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-150 group text-neutral-500 dark:text-neutral-400"
      >
        <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
        <span
          class="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors"
          >Suggestions</span
        >
        <span class="text-xs text-center hidden sm:block"
          >Personalised picks based on your taste</span
        >
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
