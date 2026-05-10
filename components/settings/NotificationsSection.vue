<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Notifications
    </p>

    <UCard
      class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl"
    >
      <div class="divide-y divide-neutral-100 dark:divide-neutral-800/60">
        <!-- Telegram -->
        <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
          <div class="min-w-0 flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 mt-0.5"
            >
              <UIcon
                name="i-simple-icons-telegram"
                class="w-4 h-4 text-neutral-600 dark:text-neutral-300"
              />
            </div>
            <div class="min-w-0">
              <p
                class="text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Telegram
              </p>
              <p
                v-if="!telegramLinked && !statusLoading"
                class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5"
              >
                Connect Telegram in Integrations to enable
              </p>
              <p
                v-else
                class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5"
              >
                Receive updates via your connected Telegram bot
              </p>
            </div>
          </div>

          <USwitch
            :model-value="profile?.notify_telegram ?? true"
            :disabled="!telegramLinked || saving"
            size="sm"
            @update:model-value="(val: boolean) => save('notify_telegram', val)"
          />
        </div>

        <!-- Email -->
        <div class="flex items-center justify-between gap-4 py-3">
          <div class="min-w-0 flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 mt-0.5"
            >
              <UIcon
                name="i-lucide-mail"
                class="w-4 h-4 text-neutral-600 dark:text-neutral-300"
              />
            </div>
            <div class="min-w-0">
              <p
                class="text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Email
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Receive updates to your account email
              </p>
            </div>
          </div>

          <USwitch
            :model-value="profile?.notify_email ?? true"
            :disabled="saving"
            size="sm"
            @update:model-value="(val: boolean) => save('notify_email', val)"
          />
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { createIntegrationsService } from "~/services/integrations.service";

const api = useApiService();
const integrationsService = createIntegrationsService(api);
const toast = useGlobalToast();
const { profile, updateProfile } = useProfile();

const telegramLinked = ref(false);
const statusLoading = ref(true);
const saving = ref(false);

onMounted(async () => {
  try {
    const status = await integrationsService.getTelegramStatus();
    telegramLinked.value = !!status?.linked;
  } catch {
    telegramLinked.value = false;
  } finally {
    statusLoading.value = false;
  }
});

async function save(field: "notify_telegram" | "notify_email", value: boolean) {
  saving.value = true;
  try {
    await updateProfile({ [field]: value });
  } catch (e: any) {
    toast.error(
      "Failed to save",
      e?.data?.error || e?.message || "Please try again.",
    );
  } finally {
    saving.value = false;
  }
}
</script>
