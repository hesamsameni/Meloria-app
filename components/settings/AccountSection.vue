<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Account
    </p>

    <UCard
      class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl"
    >
      <!-- Profile row -->
      <div class="flex items-center gap-4 mb-6">
        <UAvatar
          :alt="user?.email"
          :src="profile?.avatar_url || undefined"
          size="md"
          class="ring-2 ring-white dark:ring-neutral-900 shadow-sm shrink-0 cursor-pointer"
          @click="avatarInput?.click()"
        />
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onAvatarSelected"
        />

        <div class="min-w-0 flex-1">
          <p
            class="text-sm font-semibold text-neutral-900 dark:text-white truncate"
          >
            {{ displayLabel || user?.email }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {{ user?.email }}
          </p>
        </div>

        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          class="shrink-0"
          @click="signOut"
        >
          Sign out
        </UButton>
      </div>

      <!-- Display name -->
      <div class="mb-6">
        <p
          class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5"
        >
          Display name
        </p>
        <div class="flex gap-2">
          <UInput
            v-model="displayName"
            placeholder="Your name"
            class="flex-1"
            @keyup.enter="saveDisplayName"
          />
          <UButton
            :loading="loading"
            :disabled="displayName === (profile?.display_name || '')"
            @click="saveDisplayName"
          >
            Save
          </UButton>
        </div>
        <p v-if="error" class="text-xs text-red-500 mt-1.5">{{ error }}</p>
      </div>

      <!-- Plan -->
      <div class="border-t border-neutral-200 dark:border-neutral-800 pt-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p
              class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5"
            >
              Current plan
            </p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">
              {{ planLabel }}
              <span
                class="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="planBadgeClass"
              >
                Active
              </span>
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {{ planDescription }}
            </p>
            <p
              v-if="nextBillingDate"
              class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5"
            >
              Renews on {{ nextBillingDate }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <!-- Free → upgrade options -->
          <template v-if="currentPlan === 'free'">
            <UButton
              size="sm"
              color="primary"
              :loading="billingLoading === 'pro'"
              @click="upgradeTo('pro')"
            >
              Upgrade to Pro
            </UButton>
            <UButton
              size="sm"
              color="primary"
              variant="outline"
              :loading="billingLoading === 'ultimate'"
              @click="upgradeTo('ultimate')"
            >
              Upgrade to Ultimate
            </UButton>
            <UButton
              v-if="user?.id === '628f565c-3a64-4959-b3e2-7e71304e162d'"
              size="sm"
              color="primary"
              variant="outline"
              :loading="billingLoading === 'test'"
              @click="upgradeTo('test')"
            >
              Upgrade to Test Plan
            </UButton>
          </template>

          <!-- Pro → upgrade or cancel -->
          <template v-else-if="currentPlan === 'pro'">
            <UButton
              size="sm"
              color="primary"
              :loading="billingLoading === 'ultimate'"
              @click="upgradeTo('ultimate')"
            >
              Upgrade to Ultimate
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="outline"
              :loading="billingLoading === 'cancel'"
              @click="cancelPlan"
            >
              Cancel subscription
            </UButton>
          </template>

          <!-- Ultimate → cancel only -->
          <template v-else-if="currentPlan === 'ultimate'">
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              :loading="billingLoading === 'cancel'"
              @click="cancelPlan"
            >
              Cancel subscription
            </UButton>
          </template>

          <!-- Test → cancel only -->
          <template v-else-if="currentPlan === 'test'">
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              :loading="billingLoading === 'cancel'"
              @click="cancelPlan"
            >
              Cancel subscription
            </UButton>
          </template>
        </div>

        <p v-if="billingError" class="text-xs text-red-500 mt-2">
          {{ billingError }}
        </p>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { createBillingService } from "~/services/billing.service";
import { SUBSCRIPTION_PLANS } from "~/constants/items";

const { user, signOut } = useAuth();
const { profile, loading, error, displayLabel, updateProfile, uploadAvatar } =
  useProfile();
const api = useApiService();
const billingService = createBillingService(api);

const avatarInput = ref<HTMLInputElement | null>(null);
const displayName = ref(profile.value?.display_name || "");
const billingLoading = ref<string | null>(null);
const billingError = ref<string | null>(null);

const currentPlan = computed(() => profile.value?.subscription || "free");

const planLabel = computed(() => {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === currentPlan.value);
  return plan?.name ?? "Free";
});

const planDescription = computed(() => {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === currentPlan.value);
  return plan?.description ?? "";
});

const nextBillingDate = computed(() => {
  if (currentPlan.value === "free") return null;
  const raw = profile.value?.current_period_end;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

const planBadgeClass = computed(() => {
  if (currentPlan.value === "ultimate")
    return "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400";
  if (currentPlan.value === "pro")
    return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400";
  if (currentPlan.value === "test")
    return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
  return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
});

watch(
  () => profile.value?.display_name,
  (v) => {
    displayName.value = v || "";
  },
  { immediate: true },
);

const saveDisplayName = async () => {
  await updateProfile({ display_name: displayName.value || null });
};

const onAvatarSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const processed = await resizeAndCompressAvatar(file);
    await uploadAvatar(processed);
  } finally {
    input.value = "";
  }
};

const upgradeTo = async (tier: string) => {
  billingLoading.value = tier;
  billingError.value = null;
  try {
    const { url } = await billingService.checkout(tier);
    window.location.href = url;
  } catch (e: any) {
    billingError.value =
      e?.data?.error || e?.message || "Something went wrong.";
  } finally {
    billingLoading.value = null;
  }
};

const cancelPlan = async () => {
  billingLoading.value = "cancel";
  billingError.value = null;
  try {
    const { url } = await billingService.portal();
    window.location.href = url;
  } catch (e: any) {
    billingError.value =
      e?.data?.error || e?.message || "Something went wrong.";
  } finally {
    billingLoading.value = null;
  }
};
</script>
