<template>
  <div class="max-w-2xl mx-auto px-6 py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        Settings
      </h1>
      <p class="text-sm text-neutral-400 mt-0.5">
        Manage your account and API access
      </p>
    </div>

    <!-- account -->
    <section class="mb-8">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Account
      </p>
      <UCard>
        <div class="flex items-center gap-3">
          <UAvatar :alt="user?.email" size="md" />
          <div>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">
              {{ user?.email }}
            </p>
            <p class="text-xs text-neutral-400">Free plan</p>
          </div>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            class="ml-auto"
            @click="signOut"
          >
            Sign out
          </UButton>
        </div>
      </UCard>
    </section>

    <!-- api tokens -->
    <section>
      <div class="flex items-center justify-between mb-3">
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
        <UButton size="sm" @click="showCreate = true">New token</UButton>
      </div>

      <!-- create form -->
      <Transition name="fade">
        <UCard v-if="showCreate" class="mb-3 ring-1 ring-primary-500">
          <div class="flex gap-2">
            <UInput
              v-model="newTokenName"
              placeholder="e.g. My iPhone"
              class="flex-1"
              @keyup.enter="createToken"
            />
            <UButton :loading="creating" @click="createToken">Create</UButton>
            <UButton variant="ghost" color="neutral" @click="showCreate = false"
              >Cancel</UButton
            >
          </div>
        </UCard>
      </Transition>

      <!-- newly created token -->
      <Transition name="fade">
        <UCard v-if="newToken" class="mb-3 ring-1 ring-green-500">
          <p
            class="text-xs text-green-600 dark:text-green-400 font-medium mb-2"
          >
            ✓ Copy this token now — it won't be shown again
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
              {{ copied ? "✓ Copied" : "Copy" }}
            </UButton>
          </div>
        </UCard>
      </Transition>

      <!-- token list -->
      <div v-if="loadingTokens" class="flex flex-col gap-2">
        <USkeleton v-for="i in 2" :key="i" class="h-14 w-full rounded-xl" />
      </div>

      <UCard v-else-if="tokens.length === 0" class="text-center py-8">
        <p class="text-sm text-neutral-400">No tokens yet</p>
      </UCard>

      <div v-else class="flex flex-col gap-2">
        <UCard
          v-for="token in tokens"
          :key="token.id"
          class="flex items-center gap-3"
        >
          <UIcon
            name="i-lucide-key"
            class="w-4 h-4 text-neutral-400 shrink-0"
          />
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
            @click="revokeToken(token.id)"
          >
            Revoke
          </UButton>
        </UCard>
      </div>

      <!-- shortcut hint -->
      <UCard class="mt-6 bg-neutral-100 dark:bg-neutral-900 border-0">
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
            <code class="bg-white dark:bg-neutral-800 px-1 rounded"
              >content</code
            >,
            <code class="bg-white dark:bg-neutral-800 px-1 rounded"
              >source</code
            >
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
  </div>
</template>

<script setup lang="ts">
const { user, signOut, getToken } = useAuth();
const config = useRuntimeConfig();

const tokens = ref<any[]>([]);
const loadingTokens = ref(true);
const showCreate = ref(false);
const newTokenName = ref("");
const creating = ref(false);
const newToken = ref("");
const copied = ref(false);

const apiUrl = config.public.apiUrl;

const call = async (path: string, options: any = {}) => {
  const token = await getToken();
  return $fetch(`${config.public.apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

const loadTokens = async () => {
  try {
    tokens.value = (await call("/tokens")) as any[];
  } finally {
    loadingTokens.value = false;
  }
};

const createToken = async () => {
  creating.value = true;
  try {
    const data = (await call("/tokens", {
      method: "POST",
      body: { name: newTokenName.value },
    })) as any;
    newToken.value = data.token;
    showCreate.value = false;
    newTokenName.value = "";
    await loadTokens();
  } finally {
    creating.value = false;
  }
};

const revokeToken = async (id: string) => {
  await call(`/tokens/${id}`, { method: "DELETE" });
  tokens.value = tokens.value.filter((t: any) => t.id !== id);
};

const copyToken = async () => {
  await navigator.clipboard.writeText(newToken.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
