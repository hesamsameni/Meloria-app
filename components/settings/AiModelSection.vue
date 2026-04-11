<template>
  <section v-if="isPaidPlan" class="mb-8">
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
</template>

<script setup lang="ts">
import {
  createModelsService,
  type AvailableModel,
} from "~/services/models.service";

const { profile, loading: profileLoading, updateProfile } = useProfile();
const api = useApiService();
const modelsService = createModelsService(api);

const preferredModel = ref("");
const availableModels = ref<AvailableModel[]>([]);
const loadingModels = ref(false);
const modelsError = ref<string | null>(null);

const isPaidPlan = computed(
  () => (profile.value?.subscription || "free") !== "free",
);

const modelOptions = computed(() =>
  availableModels.value.map((m) => ({
    label: m.label || m.model,
    value: m.model,
  })),
);

const loadModels = async () => {
  if (!isPaidPlan.value) return;
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

watch(
  () => profile.value?.preferred_model,
  (v) => {
    preferredModel.value = v || "";
  },
  { immediate: true },
);
watch(
  isPaidPlan,
  (show) => {
    if (show) loadModels();
  },
  { immediate: true },
);
</script>
