<template>
  <section class="mb-8">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Plan
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <UCard v-for="plan in SUBSCRIPTION_PLANS" :key="plan.tier">
        <p class="text-sm font-medium text-neutral-900 dark:text-white">
          {{ plan.name }}
        </p>
        <p class="text-xs text-neutral-400 mt-0.5">{{ plan.description }}</p>
        <UButton
          class="w-full mt-3"
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
