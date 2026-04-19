<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-5">
      <USkeleton class="h-28 w-full rounded-2xl" />
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <USkeleton class="h-36 w-full rounded-2xl" />
        <USkeleton class="h-36 w-full rounded-2xl" />
        <USkeleton class="h-36 w-full rounded-2xl" />
      </div>
      <USkeleton class="h-32 w-full rounded-2xl" />
      <USkeleton class="h-24 w-full rounded-2xl" />
    </div>

    <!-- Empty state: no profile yet -->
    <UCard
      v-else-if="notFound"
      class="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/70 shadow-sm text-center"
    >
      <div class="py-6 flex flex-col items-center gap-4">
        <div
          class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center"
        >
          <UIcon name="i-lucide-fingerprint" class="w-5 h-5 text-primary-500" />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            No taste profile yet
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Runs automatically every week at 2 AM on Fridays, or you can
            generate it now.
          </p>
        </div>
        <UButton
          size="sm"
          color="primary"
          :loading="generating"
          @click="$emit('generate')"
        >
          Generate now
        </UButton>
      </div>
    </UCard>

    <!-- Profile -->
    <div v-else-if="profile" class="space-y-4 sm:space-y-5">
      <!-- Summary -->
      <UCard
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Summary
          </p>
        </template>
        <div class="flex items-start gap-2.5">
          <UIcon
            name="i-lucide-sparkles"
            class="w-4 h-4 text-primary-500 shrink-0 mt-0.5"
          />
          <p
            class="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed"
          >
            {{ profile.profile?.summary }}
          </p>
        </div>
      </UCard>

      <!-- Category sections -->
      <div
        v-if="filledCategorySections.length"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <UCard
          v-for="section in filledCategorySections"
          :key="section.key"
          class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                :name="section.icon"
                class="w-3.5 h-3.5 text-neutral-400"
              />
              <p
                class="text-xs font-medium uppercase tracking-widest text-neutral-400"
              >
                {{ section.label }}
              </p>
            </div>
          </template>
          <div class="space-y-3">
            <p
              class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed"
            >
              {{ section.data.patterns }}
            </p>
            <p
              v-if="section.data.reflection_themes"
              class="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-2.5 mt-0.5"
            >
              <UIcon
                name="i-lucide-quote"
                class="w-3 h-3 inline mr-1 opacity-60"
              />
              {{ section.data.reflection_themes }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Personality traits -->
      <UCard
        v-if="profile.profile?.personality_traits?.length"
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Personality
          </p>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(trait, i) in profile.profile.personality_traits"
            :key="i"
            class="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300"
          >
            <UIcon
              name="i-lucide-user-round"
              class="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5"
            />
            <span>{{ trait }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Aspiration vs reality -->
      <UCard
        v-if="profile.profile?.aspiration_vs_reality"
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Aspiration vs reality
          </p>
        </template>
        <div class="flex items-start gap-2.5">
          <UIcon
            name="i-lucide-trending-up"
            class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
          />
          <p
            class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
          >
            {{ profile.profile.aspiration_vs_reality }}
          </p>
        </div>
      </UCard>

      <!-- Cross-category insights -->
      <UCard
        v-if="profile.profile?.cross_category_insights?.length"
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Connections
          </p>
        </template>
        <ul class="space-y-2.5">
          <li
            v-for="(insight, i) in profile.profile.cross_category_insights"
            :key="i"
            class="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300"
          >
            <UIcon
              name="i-lucide-link-2"
              class="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5"
            />
            <span>{{ insight }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Capture behaviour -->
      <UCard
        v-if="behaviour"
        class="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/70 shadow-sm"
      >
        <template #header>
          <p
            class="text-xs font-medium uppercase tracking-widest text-neutral-400"
          >
            Capture habits
          </p>
        </template>
        <div class="grid grid-cols-2 gap-3">
          <div
            class="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3"
          >
            <UIcon
              name="i-lucide-layers"
              class="w-4 h-4 text-neutral-400 shrink-0"
            />
            <div class="min-w-0">
              <p class="text-xs text-neutral-400">Items saved</p>
              <p
                class="text-sm font-semibold text-neutral-900 dark:text-white truncate"
              >
                {{ behaviour.total_items }}
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="w-4 h-4 text-neutral-400 shrink-0"
            />
            <div class="min-w-0">
              <p class="text-xs text-neutral-400">Completed</p>
              <p
                class="text-sm font-semibold text-neutral-900 dark:text-white truncate"
              >
                {{ completionPercent }}%
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3"
          >
            <UIcon
              name="i-lucide-clock"
              class="w-4 h-4 text-neutral-400 shrink-0"
            />
            <div class="min-w-0">
              <p class="text-xs text-neutral-400">Peak time</p>
              <p
                class="text-sm font-semibold text-neutral-900 dark:text-white capitalize truncate"
              >
                {{ behaviour.peak_capture_time }}
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3"
          >
            <UIcon
              name="i-lucide-zap"
              class="w-4 h-4 text-neutral-400 shrink-0"
            />
            <div class="min-w-0">
              <p class="text-xs text-neutral-400">Top source</p>
              <p
                class="text-sm font-semibold text-neutral-900 dark:text-white capitalize truncate"
              >
                {{ behaviour.most_active_source }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Footer -->
      <div class="flex items-center justify-between px-1">
        <p class="text-xs text-neutral-400">Generated {{ generatedAgo }}</p>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="generating"
          @click="$emit('generate')"
        >
          Refresh
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TasteProfile } from "~/services/tasteProfile.service";

const props = defineProps<{
  profile: TasteProfile | null;
  loading: boolean;
  generating: boolean;
  notFound: boolean;
}>();

defineEmits<{ generate: [] }>();

const categorySections = computed(() => [
  {
    key: "movies",
    label: "Cinema",
    icon: "i-lucide-clapperboard",
    data: props.profile?.profile?.categories?.movies,
    creators: undefined,
    eras: undefined,
  },
  {
    key: "music",
    label: "Music",
    icon: "i-lucide-music",
    data: props.profile?.profile?.categories?.music,
    creators: undefined,
    eras: undefined,
  },
  {
    key: "books",
    label: "Books",
    icon: "i-lucide-book-open",
    data: props.profile?.profile?.categories?.books,
    creators: undefined,
    eras: undefined,
  },
  {
    key: "shows",
    label: "Shows",
    icon: "i-lucide-tv-2",
    data: props.profile?.profile?.categories?.shows,
    creators: undefined,
    eras: undefined,
  },
]);

const filledCategorySections = computed(
  () =>
    categorySections.value.filter((s) => s.data != null) as Array<{
      key: string;
      label: string;
      icon: string;
      data: NonNullable<(typeof categorySections.value)[number]["data"]>;
    }>,
);

const behaviour = computed(() => props.profile?.profile?.capture_behaviour);

const completionPercent = computed(() =>
  behaviour.value
    ? Math.round((behaviour.value.completion_rate ?? 0) * 100)
    : 0,
);

const generatedAgo = computed(() => {
  if (!props.profile?.generated_at) return "";
  const diff = Date.now() - new Date(props.profile.generated_at).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
});
</script>
