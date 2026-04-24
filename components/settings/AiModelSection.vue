<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-4"
    >
      AI Model
    </p>

    <!-- Loading skeletons -->
    <div v-if="loadingModels" class="flex flex-col gap-5">
      <div v-for="i in 2" :key="i" class="space-y-2">
        <div
          class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse"
        />
        <div
          v-for="j in 2"
          :key="j"
          class="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
        />
      </div>
    </div>

    <!-- Error -->
    <p v-else-if="modelsError" class="text-xs text-red-500">
      {{ modelsError }}
    </p>

    <!-- Grouped model list -->
    <div v-else class="flex flex-col gap-6">
      <div v-for="group in groupedModels" :key="group.key">
        <!-- Group header -->
        <div class="flex items-center gap-2.5 mb-2.5">
          <img
            :src="`/ai-logos/${group.key}.svg`"
            :alt="group.label"
            class="w-4 h-4 dark:invert opacity-60"
          />
          <span
            class="text-xs font-medium text-neutral-400 uppercase tracking-widest"
          >
            {{ group.label }}
          </span>
        </div>

        <!-- Models in group -->
        <div class="flex flex-col gap-2">
          <button
            v-for="model in group.models"
            :key="model.model"
            type="button"
            class="w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center justify-between gap-4"
            :class="[
              preferredModel === model.model
                ? 'border-primary-400/60 dark:border-primary-600/60 bg-primary-50/60 dark:bg-primary-950/30 ring-1 ring-primary-400/40 dark:ring-primary-600/30'
                : isModelEnabled(model)
                  ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                  : 'border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/30 opacity-50 cursor-not-allowed',
            ]"
            :disabled="!isModelEnabled(model)"
            @click="selectModel(model)"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="text-sm font-medium"
                  :class="
                    preferredModel === model.model
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-neutral-900 dark:text-white'
                  "
                >
                  {{ model.label || model.model }}
                </span>
                <UBadge
                  v-if="isPlanRestricted(model)"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  class="uppercase tracking-wide"
                >
                  {{ planBadgeLabel(model) }}
                </UBadge>
              </div>
              <p class="text-[11px] text-neutral-400 mt-0.5 font-mono truncate">
                <template v-if="!isModelEnabled(model)">
                  {{ planBadgeLabel(model) }} plan only
                </template>
                <template v-else>
                  {{ model.model }}
                </template>
              </p>
            </div>

            <div class="shrink-0 flex items-center">
              <span
                v-if="saving && pendingModel === model.model"
                class="inline-block w-4 h-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin"
              />
              <UIcon
                v-else-if="preferredModel === model.model"
                name="i-lucide-check-circle-2"
                class="w-5 h-5 text-primary-500"
              />
              <UIcon
                v-else-if="!isModelEnabled(model)"
                name="i-lucide-lock"
                class="w-4 h-4 text-neutral-300 dark:text-neutral-600"
              />
              <UIcon
                v-else
                name="i-lucide-circle"
                class="w-4 h-4 text-neutral-200 dark:text-neutral-700"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Ungrouped fallback -->
      <div v-if="ungroupedModels.length" class="flex flex-col gap-2">
        <div class="flex items-center gap-2.5 mb-2.5">
          <UIcon name="i-lucide-cpu" class="w-4 h-4 text-neutral-400" />
          <span
            class="text-xs font-medium text-neutral-400 uppercase tracking-widest"
            >Other</span
          >
        </div>
        <button
          v-for="model in ungroupedModels"
          :key="model.model"
          type="button"
          class="w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center justify-between gap-4"
          :class="[
            preferredModel === model.model
              ? 'border-primary-400/60 dark:border-primary-600/60 bg-primary-50/60 dark:bg-primary-950/30 ring-1 ring-primary-400/40'
              : isModelEnabled(model)
                ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                : 'border-neutral-100 dark:border-neutral-900 opacity-50 cursor-not-allowed',
          ]"
          :disabled="!isModelEnabled(model)"
          @click="selectModel(model)"
        >
          <div class="min-w-0">
            <span class="text-sm font-medium text-neutral-900 dark:text-white">
              {{ model.label || model.model }}
            </span>
            <p class="text-[11px] text-neutral-400 mt-0.5 font-mono truncate">
              {{ model.model }}
            </p>
          </div>
          <UIcon
            v-if="preferredModel === model.model"
            name="i-lucide-check-circle-2"
            class="w-5 h-5 text-primary-500 shrink-0"
          />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  createModelsService,
  type AvailableModel,
} from "~/services/models.service";
import { useGlobalToast } from "~/composables/useGlobalToast";

const { profile, updateProfile } = useProfile();
const api = useApiService();
const modelsService = createModelsService(api);
const toast = useGlobalToast();

const preferredModel = ref("");
const availableModels = useState<AvailableModel[]>("availableModels", () => []);
const loadingModels = ref(false);
const modelsError = ref<string | null>(null);
const saving = ref(false);
const pendingModel = ref<string | null>(null);

const PROVIDER_GROUPS: { key: string; label: string; prefix: string[] }[] = [
  { key: "openai", label: "OpenAI", prefix: ["openai/"] },
  { key: "anthropic", label: "Anthropic", prefix: ["anthropic/"] },
  { key: "google", label: "Google", prefix: ["google/"] },
  { key: "deepseek", label: "DeepSeek", prefix: ["deepseek/"] },
];

function modelProvider(model: AvailableModel): string | null {
  for (const group of PROVIDER_GROUPS) {
    if (group.prefix.some((p) => model.model.startsWith(p))) return group.key;
  }
  return null;
}

const groupedModels = computed(() =>
  PROVIDER_GROUPS.map((g) => {
    const models = availableModels.value.filter((m) =>
      g.prefix.some((p) => m.model.startsWith(p)),
    );
    return {
      ...g,
      models: [...models].sort((a, b) =>
        a.model === preferredModel.value
          ? -1
          : b.model === preferredModel.value
            ? 1
            : 0,
      ),
    };
  })
    .filter((g) => g.models.length > 0)
    .sort((a, b) => {
      const aHasSelected = a.models.some(
        (m) => m.model === preferredModel.value,
      );
      const bHasSelected = b.models.some(
        (m) => m.model === preferredModel.value,
      );
      return aHasSelected ? -1 : bHasSelected ? 1 : 0;
    }),
);

const ungroupedModels = computed(() =>
  availableModels.value.filter((m) => modelProvider(m) === null),
);

const userPlan = computed(() => profile.value?.subscription || "free");

function isPlanRestricted(model: AvailableModel): boolean {
  return (
    !!model.plans && model.plans.length > 0 && !model.plans.includes("free")
  );
}

function isModelEnabled(model: AvailableModel): boolean {
  if (!model.plans || model.plans.length === 0) return true;
  return model.plans.includes(userPlan.value);
}

function planBadgeLabel(model: AvailableModel): string {
  return (model.plans ?? [])
    .filter((p) => p !== "test")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" & ");
}

const loadModels = async () => {
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

const selectModel = async (model: AvailableModel) => {
  if (!isModelEnabled(model) || preferredModel.value === model.model) return;
  saving.value = true;
  pendingModel.value = model.model;
  try {
    await updateProfile({ preferred_model: model.model });
    preferredModel.value = model.model;
    toast.success("Preferred model updated");
  } catch (e: any) {
    toast.error(
      e?.data?.error || e?.message || "Failed to update preferred model",
    );
  } finally {
    saving.value = false;
    pendingModel.value = null;
  }
};

watch(
  () => profile.value?.preferred_model,
  (v) => {
    preferredModel.value = v || "";
  },
  { immediate: true },
);

onMounted(async () => {
  if (availableModels.value.length === 0) {
    await loadModels();
  }
});
</script>
