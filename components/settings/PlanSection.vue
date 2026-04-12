<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Plan
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <UCard
        v-for="plan in SUBSCRIPTION_PLANS"
        :key="plan.tier"
        class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl transition-all duration-200"
        :class="{
          'ring-1 ring-primary-500/50 border-primary-300/60 dark:border-primary-700/60':
            currentPlan === plan.tier,
          'hover:shadow-md hover:-translate-y-0.5': currentPlan !== plan.tier,
        }"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ plan.name }}
          </p>
          <UBadge
            v-if="currentPlan === plan.tier"
            size="xs"
            color="success"
            variant="soft"
          >
            Active
          </UBadge>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {{ plan.description }}
        </p>
        <UButton
          class="w-full mt-4 rounded-lg"
          size="sm"
          :variant="currentPlan === plan.tier ? 'outline' : 'solid'"
          :color="currentPlan === plan.tier ? 'neutral' : 'primary'"
          :disabled="currentPlan === plan.tier"
          :loading="billingLoading === plan.tier"
          @click="selectPlan(plan.tier)"
        >
          {{ planButtonLabel(plan.tier) }}
        </UButton>
      </UCard>
    </div>

    <p v-if="billingError" class="text-xs text-red-500 mt-3">
      {{ billingError }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { createBillingService } from "~/services/billing.service";
import { SUBSCRIPTION_PLANS, TIER_RANK } from "~/constants/items";

const { profile } = useProfile();
const api = useApiService();
const billingService = createBillingService(api);

const billingLoading = ref<string | null>(null);
const billingError = ref<string | null>(null);

const currentPlan = computed(() => profile.value?.subscription || "free");

const planButtonLabel = (tier: string) => {
  if (currentPlan.value === tier) return "Current plan";
  const isDowngrade =
    TIER_RANK[tier] < TIER_RANK[currentPlan.value] || tier === "free";
  return isDowngrade ? "Downgrade" : "Upgrade";
};

const selectPlan = async (tier: string) => {
  if (currentPlan.value === tier) return;
  billingLoading.value = tier;
  billingError.value = null;
  try {
    const isDowngrade =
      TIER_RANK[tier] < TIER_RANK[currentPlan.value] || tier === "free";
    const { url } = isDowngrade
      ? await billingService.portal()
      : await billingService.checkout(tier);
    window.location.href = url;
  } catch (e: any) {
    billingError.value =
      e?.data?.error || e?.message || "Something went wrong.";
  } finally {
    billingLoading.value = null;
  }
};
</script>
