<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        Settings
      </h1>
      <p class="text-sm text-neutral-400 mt-0.5">
        Manage your account information and API access
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
          <div class="relative">
            <UAvatar
              :alt="user?.email"
              :src="profile?.avatar_url || undefined"
              size="md"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarSelected"
            />
          </div>

          <div class="min-w-0">
            <p
              class="text-sm font-medium text-neutral-900 dark:text-white truncate"
            >
              {{ displayLabel || user?.email }}
            </p>
            <p class="text-xs text-neutral-400">
              {{
                (profile?.subscription || "free").charAt(0).toUpperCase() +
                (profile?.subscription || "free").slice(1) +
                " plan"
              }}
            </p>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :loading="profileLoading"
              @click="avatarInput?.click()"
            >
              Change photo
            </UButton>
            <UButton variant="ghost" color="neutral" size="sm" @click="signOut">
              Sign out
            </UButton>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div class="sm:col-span-2">
            <p class="text-xs font-medium text-neutral-500 mb-1">
              Display name
            </p>
            <UInput
              v-model="displayName"
              placeholder="Your name"
              @keyup.enter="saveDisplayName"
            />
          </div>
          <div class="flex items-end">
            <UButton
              class="w-full"
              :loading="profileLoading"
              :disabled="displayName === (profile?.display_name || '')"
              @click="saveDisplayName"
            >
              Save
            </UButton>
          </div>
        </div>

        <p v-if="profileError" class="text-xs text-red-500 mt-2">
          {{ profileError }}
        </p>
      </UCard>
    </section>

    <!-- upgrade plan (static) -->
    <section class="mb-8">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Plan
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UCard v-for="plan in plans" :key="plan.tier">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            {{ plan.name }}
          </p>
          <p class="text-xs text-neutral-400 mt-0.5">{{ plan.description }}</p>
          <UButton
            class="w-full mt-3"
            size="sm"
            :variant="
              (profile?.subscription || 'free') === plan.tier
                ? 'outline'
                : 'solid'
            "
            :color="
              (profile?.subscription || 'free') === plan.tier
                ? 'neutral'
                : 'primary'
            "
            :disabled="(profile?.subscription || 'free') === plan.tier"
            :loading="billingLoading === plan.tier"
            @click="selectPlan(plan.tier)"
          >
            {{
              (profile?.subscription || "free") === plan.tier
                ? "Current plan"
                : TIER_RANK[plan.tier] <
                      TIER_RANK[profile?.subscription || "free"] ||
                    plan.tier === "free"
                  ? "Downgrade"
                  : "Upgrade"
            }}
          </UButton>
        </UCard>
      </div>

      <p v-if="billingError" class="text-xs text-red-500 mt-3">
        {{ billingError }}
      </p>
    </section>

    <!-- preferred model (paid only) -->
    <section v-if="showPreferredModel" class="mb-8">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        AI Model
      </p>

      <UCard>
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-medium text-neutral-900 dark:text-white">
              Preferred model
            </p>
            <p class="text-xs text-neutral-400 mt-0.5">
              Used for extracting details during capture
            </p>
          </div>

          <div class="w-full max-w-xs">
            <USelect
              v-model="preferredModel"
              :items="modelOptions"
              :loading="loadingModels"
              placeholder="Select a model"
            />
          </div>
        </div>

        <div class="mt-3 flex justify-end">
          <UButton
            size="sm"
            :loading="profileLoading"
            :disabled="
              !preferredModel ||
              preferredModel === (profile?.preferred_model || '')
            "
            @click="savePreferredModel"
          >
            Save
          </UButton>
        </div>

        <p v-if="modelsError" class="text-xs text-red-500 mt-2">
          {{ modelsError }}
        </p>
      </UCard>
    </section>

    <!-- telegram section -->
    <section class="mb-8">
      <p
        class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
      >
        Telegram
      </p>

      <!-- already linked -->
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

      <!-- not linked -->
      <UCard v-else>
        <p class="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
          Connect Telegram to capture anything directly from your phone — voice
          notes, links, forwarded posts.
        </p>

        <div v-if="!linkCode">
          <UButton @click="generateCode" :loading="generatingCode">
            Generate link code
          </UButton>
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
import { createApiService } from "~/services/api";
import { createTokensService, type ApiToken } from "~/services/tokens.service";
import {
  createModelsService,
  type AvailableModel,
} from "~/services/models.service";
import { createBillingService } from "~/services/billing.service";

const { user, signOut, getToken } = useAuth();
const {
  profile,
  loading: profileLoading,
  error: profileError,
  displayLabel,
  updateProfile,
  uploadAvatar,
} = useProfile();
const config = useRuntimeConfig();

const api = createApiService(config.public.apiUrl, getToken);
const tokensService = createTokensService(api);
const modelsService = createModelsService(api);
const billingService = createBillingService(api);

const tokens = ref<ApiToken[]>([]);
const loadingTokens = ref(true);
const showCreate = ref(false);
const newTokenName = ref("");
const creating = ref(false);
const newToken = ref("");
const copied = ref(false);

const avatarInput = ref<HTMLInputElement | null>(null);
const displayName = ref("");
const preferredModel = ref("");

const availableModels = ref<AvailableModel[]>([]);
const loadingModels = ref(false);
const modelsError = ref<string | null>(null);

// billing
const billingLoading = ref<string | null>(null);
const billingError = ref<string | null>(null);

const TIER_RANK: Record<string, number> = { free: 0, pro: 1, ultimate: 2 };

const selectPlan = async (tier: string) => {
  const current = profile.value?.subscription || "free";
  if (current === tier) return;

  billingLoading.value = tier;
  billingError.value = null;

  try {
    const currentRank = TIER_RANK[current] ?? 0;
    const targetRank = TIER_RANK[tier] ?? 0;
    const isDowngrade = targetRank < currentRank;

    if (isDowngrade || tier === "free") {
      const { url } = await billingService.portal();
      window.location.href = url;
    } else {
      const { url } = await billingService.checkout(tier);
      window.location.href = url;
    }
  } catch (e: any) {
    billingError.value =
      e?.data?.error || e?.message || "Something went wrong. Please try again.";
  } finally {
    billingLoading.value = null;
  }
};

// telegram
const telegramStatus = ref<any>(null);
const linkCode = ref<any>(null);
const generatingCode = ref(false);
const codeCopied = ref(false);

const plans = [
  { tier: "free", name: "Free", description: "30 per month" },
  { tier: "pro", name: "Pro", description: "120 per month" },
  {
    tier: "ultimate",
    name: "Ultimate",
    description: "Unlimited usage",
  },
];

const apiUrl = config.public.apiUrl;

const showPreferredModel = computed(() => {
  return (profile.value?.subscription || "free") !== "free";
});

const modelOptions = computed(() => {
  return availableModels.value.map((m) => ({
    label: m.label || m.model,
    value: m.model,
  }));
});

const loadModels = async () => {
  if (!showPreferredModel.value) return;
  loadingModels.value = true;
  modelsError.value = null;
  try {
    availableModels.value = await modelsService.listAvailableModels();
  } catch (e: any) {
    modelsError.value = e?.data?.error || e?.message || "Failed to load models";
  } finally {
    loadingModels.value = false;
  }
};

const savePreferredModel = async () => {
  if (!preferredModel.value) return;
  await updateProfile({ preferred_model: preferredModel.value });
};

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
  tokens.value = tokens.value.filter((t: any) => t.id !== id);
};

const saveDisplayName = async () => {
  await updateProfile({ display_name: displayName.value || null });
};

const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_AVATAR_DIM = 512;

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to encode image"));
        resolve(blob);
      },
      type,
      quality,
    );
  });
};

const loadImageBitmap = async (file: File): Promise<ImageBitmap> => {
  if (typeof createImageBitmap !== "undefined") {
    return await createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });
    return await createImageBitmap(img as any);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const resizeAndCompressAvatar = async (file: File): Promise<File> => {
  // If it's already comfortably small, just upload it.
  if (file.size <= MAX_AVATAR_BYTES * 0.9) return file;

  const bitmap = await loadImageBitmap(file);

  const scale = Math.min(
    1,
    MAX_AVATAR_DIM / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // Prefer WebP when available.
  const preferredType = "image/webp";
  const fallbackType = "image/jpeg";

  const tryEncode = async (type: string, quality: number) => {
    const blob = await canvasToBlob(canvas, type, quality);
    return new File(
      [blob],
      "avatar" + (type === preferredType ? ".webp" : ".jpg"),
      {
        type,
        lastModified: Date.now(),
      },
    );
  };

  // Quality ladder to hit <= 1MB.
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];

  for (const q of qualities) {
    const out = await tryEncode(preferredType, q);
    if (out.size <= MAX_AVATAR_BYTES) return out;
  }

  for (const q of qualities) {
    const out = await tryEncode(fallbackType, q);
    if (out.size <= MAX_AVATAR_BYTES) return out;
  }

  // As a last resort, return the smallest attempt.
  const last = await tryEncode(fallbackType, qualities[qualities.length - 1]);
  return last;
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

const loadTelegramStatus = async () => {
  try {
    telegramStatus.value = await call("/telegram/status");
  } catch {}
};

const generateCode = async () => {
  generatingCode.value = true;
  try {
    linkCode.value = await call("/telegram/generate-code", { method: "POST" });
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

watch(
  () => profile.value?.display_name,
  (v) => {
    displayName.value = v || "";
  },
  { immediate: true },
);

watch(
  () => profile.value?.preferred_model,
  (v) => {
    preferredModel.value = v || "";
  },
  { immediate: true },
);

watch(
  () => showPreferredModel.value,
  (show) => {
    if (show) loadModels();
  },
  { immediate: true },
);

onMounted(() => {
  loadTokens();
  loadTelegramStatus();
});
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
