<template>
  <section class="mb-8">
    <p
      v-if="showTitle"
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Telegram
    </p>

    <!-- Already linked -->
    <UCard v-if="telegramStatus?.linked">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg"
        >
          ✈️
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            Telegram connected
          </p>
          <p class="text-xs text-neutral-400">
            @{{ telegramStatus.telegram_username || "unknown" }} • linked
            {{ formatDate(telegramStatus.linked_at) }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Not linked -->
    <UCard v-else>
      <p class="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
        Connect Telegram to capture anything directly from your phone — voice
        notes, links, forwarded posts.
      </p>

      <div v-if="!linkCode">
        <UButton :loading="generatingCode" @click="generateCode"
          >Generate link code</UButton
        >
      </div>

      <div v-else class="flex flex-col gap-3">
        <p class="text-xs text-neutral-500">
          Open <strong>@MeloriaBot</strong> on Telegram and send:
        </p>
        <div class="flex items-center gap-2">
          <code
            class="flex-1 text-lg font-mono font-bold text-center py-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 tracking-widest"
          >
            /link {{ linkCode.code }}
          </code>
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            @click="copyLinkCode"
          >
            {{ codeCopied ? "✓" : "Copy" }}
          </UButton>
        </div>
        <p class="text-xs text-neutral-400">Expires in 15 minutes</p>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    showTitle?: boolean;
  }>(),
  {
    showTitle: true,
  },
);

const api = useApiService();

const telegramStatus = ref<any>(null);
const linkCode = ref<any>(null);
const generatingCode = ref(false);
const codeCopied = ref(false);

const loadStatus = async () => {
  try {
    telegramStatus.value = await api.call("/telegram/status");
  } catch {}
};

const generateCode = async () => {
  generatingCode.value = true;
  try {
    linkCode.value = await api.call("/telegram/generate-code", {
      method: "POST",
    });
  } finally {
    generatingCode.value = false;
  }
};

const copyLinkCode = async () => {
  await navigator.clipboard.writeText(`/link ${linkCode.value.code}`);
  codeCopied.value = true;
  setTimeout(() => {
    codeCopied.value = false;
  }, 2000);
};

onMounted(loadStatus);
</script>
