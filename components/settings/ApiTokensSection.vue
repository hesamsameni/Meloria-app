<template>
  <section class="mb-10">
    <div class="flex items-center justify-between mb-3.5">
      <div>
        <p
          class="text-xs font-medium uppercase tracking-widest text-neutral-400"
        >
          API Tokens
        </p>
        <p class="text-xs text-neutral-400 mt-0.5">
          Use these with your Apple Shortcut
        </p>
      </div>
      <UButton size="sm" class="rounded-lg" @click="showCreate = true">
        New token
      </UButton>
    </div>

    <!-- Create form -->
    <Transition name="fade">
      <UCard
        v-if="showCreate"
        class="mb-3 border border-primary-300/70 dark:border-primary-700/60 bg-primary-50/40 dark:bg-primary-900/10 rounded-2xl"
      >
        <div class="flex gap-2">
          <UInput
            v-model="newTokenName"
            placeholder="e.g. My iPhone"
            class="flex-1"
            @keyup.enter="createToken"
          />
          <UButton class="rounded-lg" :loading="creating" @click="createToken">
            Create
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            class="rounded-lg"
            @click="showCreate = false"
          >
            Cancel
          </UButton>
        </div>
      </UCard>
    </Transition>

    <!-- Newly created token (show once) -->
    <Transition name="fade">
      <UCard
        v-if="newToken"
        class="mb-3 border border-green-400/70 dark:border-green-700/70 bg-green-50/50 dark:bg-green-900/10 rounded-2xl"
      >
        <p
          class="text-xs text-green-600 dark:text-green-400 font-medium mb-2 inline-flex items-center gap-1.5"
        >
          <UIcon name="i-lucide-badge-check" class="w-3.5 h-3.5" />
          Copy this token now - it won't be shown again
        </p>
        <div class="flex gap-2">
          <UInput
            :model-value="newToken"
            readonly
            class="flex-1 font-mono text-xs"
          />
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            @click="copyToken"
          >
            <span class="inline-flex items-center gap-1.5">
              <UIcon v-if="copied" name="i-lucide-check" class="w-3.5 h-3.5" />
              {{ copied ? "Copied" : "Copy" }}
            </span>
          </UButton>
        </div>
      </UCard>
    </Transition>

    <!-- Token list -->
    <div v-if="loadingTokens" class="flex flex-col gap-2">
      <USkeleton v-for="i in 2" :key="i" class="h-14 w-full rounded-xl" />
    </div>

    <UCard
      v-else-if="tokens.length === 0"
      class="text-center py-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl"
    >
      <p class="text-sm text-neutral-400">No tokens yet</p>
    </UCard>

    <div v-else class="flex flex-col gap-2">
      <UCard
        v-for="token in tokens"
        :key="token.id"
        class="flex items-center gap-3 border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl"
      >
        <UIcon name="i-lucide-key" class="w-4 h-4 text-neutral-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            {{ token.name || "Unnamed" }}
          </p>
          <p class="text-xs text-neutral-400">
            {{
              token.last_used_at
                ? `Last used ${formatDate(token.last_used_at)}`
                : `Created ${formatDate(token.created_at)}`
            }}
          </p>
        </div>
        <UButton
          variant="ghost"
          color="error"
          size="xs"
          class="rounded-lg"
          @click="revokeToken(token.id)"
        >
          Revoke
        </UButton>
      </UCard>
    </div>

    <!-- Apple Shortcut setup hint -->
    <UCard
      class="mt-6 border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/40 rounded-2xl"
    >
      <p class="text-xs font-medium text-neutral-900 dark:text-white mb-2">
        Apple Shortcut setup
      </p>
      <ol class="text-xs text-neutral-500 space-y-1 list-decimal list-inside">
        <li>Create a shortcut with Share Sheet trigger</li>
        <li>Add "Get Contents of URL" action</li>
        <li>
          URL:
          <code class="bg-white dark:bg-neutral-800 px-1 rounded"
            >{{ apiUrl }}/ingest</code
          >
        </li>
        <li>
          Method: POST, body: JSON with
          <code class="bg-white dark:bg-neutral-800 px-1 rounded">content</code
          >,
          <code class="bg-white dark:bg-neutral-800 px-1 rounded">source</code>
        </li>
        <li>
          Header:
          <code class="bg-white dark:bg-neutral-800 px-1 rounded"
            >Authorization: Bearer YOUR_TOKEN</code
          >
        </li>
      </ol>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { createTokensService, type ApiToken } from "~/services/tokens.service";

const api = useApiService();
const tokensService = createTokensService(api);
const config = useRuntimeConfig();

const tokens = ref<ApiToken[]>([]);
const loadingTokens = ref(true);
const showCreate = ref(false);
const newTokenName = ref("");
const creating = ref(false);
const newToken = ref("");
const copied = ref(false);

const apiUrl = config.public.apiUrl;

const loadTokens = async () => {
  try {
    tokens.value = await tokensService.list();
  } finally {
    loadingTokens.value = false;
  }
};

const createToken = async () => {
  creating.value = true;
  try {
    const data = await tokensService.create({ name: newTokenName.value });
    newToken.value = data.token ?? "";
    showCreate.value = false;
    newTokenName.value = "";
    await loadTokens();
  } finally {
    creating.value = false;
  }
};

const revokeToken = async (id: string) => {
  await tokensService.revoke(id);
  tokens.value = tokens.value.filter((t) => t.id !== id);
};

const copyToken = async () => {
  await navigator.clipboard.writeText(newToken.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

onMounted(loadTokens);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
