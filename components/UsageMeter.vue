<template>
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <span
        class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300"
      >
        <UIcon v-if="icon" :name="icon" class="w-3.5 h-3.5 shrink-0" />
        {{ label }}
      </span>
      <span class="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
        <template v-if="metric.unlimited">
          {{ metric.used }} used ·
          <span class="text-primary-600 dark:text-primary-400 font-medium"
            >Unlimited</span
          >
        </template>
        <template v-else>
          <span
            :class="
              isExhausted
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'font-medium text-neutral-700 dark:text-neutral-200'
            "
            >{{ metric.remaining }}</span
          >
          left of {{ metric.limit }}
        </template>
      </span>
    </div>

    <!-- Bar (only meaningful when there's a finite limit) -->
    <div
      v-if="!metric.unlimited"
      class="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden"
    >
      <div
        class="h-full rounded-full transition-[width] duration-500 ease-out"
        :class="barColor"
        :style="{ width: `${percentUsed}%` }"
      />
    </div>

    <p
      v-if="resetLabel"
      class="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500"
    >
      {{ resetLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { UsageMetric } from "~/services/usage.service";

const props = defineProps<{
  label: string;
  metric: UsageMetric;
  icon?: string;
  /** "monthly" formats the reset as a date, "daily" as a time. */
  resetCadence?: "monthly" | "daily";
}>();

const percentUsed = computed(() => {
  if (props.metric.unlimited || !props.metric.limit) return 0;
  return Math.min(100, Math.round((props.metric.used / props.metric.limit) * 100));
});

const isExhausted = computed(
  () => !props.metric.unlimited && (props.metric.remaining ?? 0) <= 0,
);

const barColor = computed(() => {
  if (percentUsed.value >= 100) return "bg-red-500";
  if (percentUsed.value >= 80) return "bg-amber-500";
  return "bg-primary-500";
});

const resetLabel = computed(() => {
  if (props.metric.unlimited) return null;
  const d = new Date(props.metric.resets_at);
  if (Number.isNaN(d.getTime())) return null;

  if (props.resetCadence === "daily") {
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Resets at ${time}`;
  }

  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Resets ${date}`;
});
</script>
