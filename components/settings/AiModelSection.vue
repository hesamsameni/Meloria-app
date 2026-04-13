<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      AI Model
    </p>

    <!-- Loading skeletons -->
    <div v-if="loadingModels" class="flex flex-col gap-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-[5rem] rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
      />
    </div>

    <!-- Error -->
    <p v-else-if="modelsError" class="text-xs text-red-500">
      {{ modelsError }}
    </p>

    <!-- Model list -->
    <div v-else class="flex flex-col gap-3.5">
      <UCard
        v-for="model in orderedModels"
        :key="model.model"
        class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl transition-all duration-200"
        :class="{
          'opacity-55': !isModelEnabled(model),
          'ring-1 ring-primary-500/50 border-primary-300/60 dark:border-primary-700/60':
            preferredModel === model.model,
          'hover:shadow-md hover:-translate-y-0.5':
            isModelEnabled(model) && preferredModel !== model.model,
        }"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center shrink-0"
            >
              <UIcon
                :name="
                  isModelEnabled(model)
                    ? 'i-heroicons-cpu-chip'
                    : 'i-heroicons-lock-closed'
                "
                class="w-5 h-5"
                :class="
                  isModelEnabled(model)
                    ? 'text-neutral-700 dark:text-neutral-300'
                    : 'text-neutral-400 dark:text-neutral-600'
                "
              />
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p
                  class="text-sm font-semibold text-neutral-900 dark:text-white"
                >
                  {{ model.label || model.model }}
                </p>
                <UBadge
                  v-if="isPlanRestricted(model)"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  class="uppercase tracking-wide"
                >
                  {{ planBadgeLabel(model) }}
                </UBadge>
                <UBadge
                  v-if="preferredModel === model.model"
                  color="success"
                  variant="soft"
                  size="xs"
                >
                  Active
                </UBadge>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <template v-if="!isModelEnabled(model)">
                  Only available on the {{ planBadgeLabel(model) }}
                  {{ (model.plans?.length ?? 0) > 1 ? "plans" : "plan" }}
                </template>
                <template v-else>
                  {{ model.model }}
                </template>
              </p>
            </div>
          </div>

          <UButton
            size="sm"
            :variant="preferredModel === model.model ? 'soft' : 'outline'"
            :color="preferredModel === model.model ? 'primary' : 'neutral'"
            :disabled="!isModelEnabled(model) || preferredModel === model.model"
            :loading="saving && pendingModel === model.model"
            class="shrink-0 min-w-[92px] align-center"
            @click="selectModel(model)"
          >
            {{ preferredModel === model.model ? "Selected" : "Select" }}
          </UButton>
        </div>
      </UCard>
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
const availableModels = ref<AvailableModel[]>([]);
const loadingModels = ref(false);
const modelsError = ref<string | null>(null);
const saving = ref(false);
const pendingModel = ref<string | null>(null);

const orderedModels = computed(() => {
  const selected = preferredModel.value;
  if (!selected) return availableModels.value;

  return [...availableModels.value].sort(
    (a, b) => Number(b.model === selected) - Number(a.model === selected),
  );
});

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

onMounted(() => {
  loadModels();
});
</script>
