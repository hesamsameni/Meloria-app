<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
    <!-- Stats cards -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5"
      >
        <span class="text-xs text-neutral-400">{{ card.label }}</span>
        <p class="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
          {{ card.value }}
        </p>
      </div>
    </div>

    <!-- Users section -->
    <div
      class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
    >
      <!-- Header + search -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-200 dark:border-neutral-800"
      >
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          Users
          <span class="text-neutral-400 font-normal">({{ admin.total }})</span>
        </h2>
        <UInput
          v-model="searchInput"
          placeholder="Search by name…"
          icon="i-lucide-search"
          size="sm"
          class="w-full sm:w-64"
          @keydown.enter="handleSearch"
        />
      </div>

      <!-- Loading -->
      <div v-if="admin.loading" class="p-8 text-center">
        <USkeleton class="h-8 w-full mb-3" v-for="i in 5" :key="i" />
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr
              class="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 uppercase tracking-wider"
            >
              <th class="px-5 py-3 font-medium">User</th>
              <th class="px-5 py-3 font-medium">Email</th>
              <th class="px-5 py-3 font-medium">Role</th>
              <th class="px-5 py-3 font-medium">Plan</th>
              <th class="px-5 py-3 font-medium">Model</th>
              <th class="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in admin.users"
              :key="user.id"
              class="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
            >
              <!-- User -->
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <UAvatar
                    :alt="user.display_name || user.username || '?'"
                    :src="user.avatar_url || undefined"
                    size="2xs"
                    :style="`background: var(--ui-color-primary-500)`"
                  />
                  <div class="min-w-0">
                    <p
                      class="text-neutral-900 dark:text-white truncate text-sm"
                    >
                      {{ user.display_name || user.username || "—" }}
                    </p>
                    <p class="text-[11px] text-neutral-400 truncate font-mono">
                      {{ user.id.slice(0, 8) }}…
                    </p>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td
                class="px-5 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]"
              >
                {{ user.email || "—" }}
              </td>

              <!-- Role -->
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="roleBadgeClass(user.role)"
                >
                  {{ user.role }}
                </span>
              </td>

              <!-- Plan -->
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="planBadgeClass(user.subscription)"
                >
                  {{ user.subscription || "free" }}
                </span>
              </td>

              <!-- Model -->
              <td
                class="px-5 py-3 text-neutral-500 dark:text-neutral-400 text-xs truncate max-w-[160px]"
              >
                {{ user.preferred_model || "default" }}
              </td>

              <!-- Joined -->
              <td
                class="px-5 py-3 text-neutral-500 dark:text-neutral-400 text-xs whitespace-nowrap"
              >
                {{ formatDate(user.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty -->
        <div
          v-if="admin.users.length === 0"
          class="p-8 text-center text-sm text-neutral-400"
        >
          No users found
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="admin.totalPages > 1"
        class="flex items-center justify-between px-5 py-3 border-t border-neutral-200 dark:border-neutral-800"
      >
        <span class="text-xs text-neutral-400">
          Page {{ admin.page }} of {{ admin.totalPages }}
        </span>
        <div class="flex gap-2">
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            :disabled="admin.page <= 1"
            @click="changePage(admin.page - 1)"
          >
            Previous
          </UButton>
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            :disabled="admin.page >= admin.totalPages"
            @click="changePage(admin.page + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </div>

    <!-- AI Models Management section -->
    <div
      class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
    >
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-200 dark:border-neutral-800"
      >
        <h2 class="text-sm font-medium text-neutral-900 dark:text-white">
          AI Models Management
          <span class="text-neutral-400 font-normal"
            >({{ admin.models.length }})</span
          >
        </h2>
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="admin.modelsLoading"
            @click="admin.fetchModels"
          >
            Refresh
          </UButton>
          <UButton
            size="xs"
            color="primary"
            icon="i-lucide-plus"
            @click="showAddModel = true"
          >
            Add Model
          </UButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="admin.modelsLoading" class="p-6 flex flex-col gap-5">
        <div v-for="i in 2" :key="i" class="space-y-2">
          <div
            class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse"
          />
          <div
            v-for="j in 2"
            :key="j"
            class="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
          />
        </div>
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="admin.modelsError"
        color="error"
        variant="soft"
        class="m-5"
        :title="admin.modelsError"
      />

      <!-- Grouped models -->
      <div v-else class="p-5 flex flex-col gap-6">
        <div v-for="group in groupedAdminModels" :key="group.key">
          <!-- Group header -->
          <div class="flex items-center gap-2.5 mb-3">
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

          <!-- Model rows -->
          <div class="flex flex-col gap-2">
            <div
              v-for="model in group.models"
              :key="model.model"
              class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3"
              :class="!model.is_active ? 'opacity-50' : ''"
            >
              <!-- Info -->
              <div class="min-w-0 flex-1">
                <p
                  class="text-sm font-medium text-neutral-900 dark:text-white truncate"
                >
                  {{ model.label || model.model }}
                </p>
                <p
                  class="text-[11px] font-mono text-neutral-400 truncate mt-0.5"
                >
                  {{ model.model }}
                </p>
              </div>

              <!-- Controls -->
              <div class="flex items-center gap-2 shrink-0">
                <USelect
                  :model-value="model.is_active"
                  :items="[
                    { label: 'Active', value: true },
                    { label: 'Inactive', value: false },
                  ]"
                  size="xs"
                  class="w-28"
                  @update:model-value="
                    (val) => updateStatus(model.model, val as boolean)
                  "
                />
                <USelect
                  :model-value="model.plans || []"
                  :items="planOptions"
                  multiple
                  size="xs"
                  class="w-40"
                  placeholder="All plans"
                  @update:model-value="
                    (val) => updatePlans(model.model, val as string[])
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Ungrouped fallback -->
        <div v-if="ungroupedAdminModels.length" class="flex flex-col gap-2">
          <div class="flex items-center gap-2.5 mb-3">
            <UIcon name="i-lucide-cpu" class="w-4 h-4 text-neutral-400" />
            <span
              class="text-xs font-medium text-neutral-400 uppercase tracking-widest"
              >Other</span
            >
          </div>
          <div
            v-for="model in ungroupedAdminModels"
            :key="model.model"
            class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3"
            :class="!model.is_active ? 'opacity-50' : ''"
          >
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium text-neutral-900 dark:text-white truncate"
              >
                {{ model.label || model.model }}
              </p>
              <p class="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                {{ model.model }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <USelect
                :model-value="model.is_active"
                :items="[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ]"
                size="xs"
                class="w-28"
                @update:model-value="
                  (val) => updateStatus(model.model, val as boolean)
                "
              />
              <USelect
                :model-value="model.plans || []"
                :items="planOptions"
                multiple
                size="xs"
                class="w-40"
                placeholder="All plans"
                @update:model-value="
                  (val) => updatePlans(model.model, val as string[])
                "
              />
            </div>
          </div>
        </div>

        <!-- Empty -->
        <p
          v-if="admin.models.length === 0"
          class="text-sm text-neutral-400 text-center py-4"
        >
          No models found
        </p>
      </div>
    </div>
  </div>

  <!-- Add Model Modal -->
  <UModal v-model:open="showAddModel" title="Add Model">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Model ID" required>
          <UInput
            v-model="newModel.model"
            placeholder="e.g. openai/gpt-4o"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Label" required>
          <UInput
            v-model="newModel.label"
            placeholder="e.g. GPT-4o"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Status">
          <USelect
            v-model="newModel.is_active"
            :items="[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Plans">
          <USelect
            v-model="newModel.plans"
            :items="planOptions"
            multiple
            placeholder="All plans"
            class="w-full"
          />
        </UFormField>
        <p v-if="addModelError" class="text-sm text-red-500">
          {{ addModelError }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" color="neutral" @click="showAddModel = false"
          >Cancel</UButton
        >
        <UButton
          color="primary"
          :loading="addModelLoading"
          @click="submitAddModel"
          >Add</UButton
        >
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useAdminStore } from "~/stores/admin";

const { setPageHeader } = usePageHeader();
useHead({ title: "Admin Dashboard" });
setPageHeader("Admin Dashboard", "Manage your application");

const admin = useAdminStore();
const searchInput = ref("");

const statCards = computed(() => [
  { label: "Total Users", value: admin.stats?.total_users ?? "—" },
  { label: "Items Today", value: admin.stats?.items_today ?? "—" },
  {
    label: "Active Subscriptions",
    value: admin.stats?.active_subscriptions ?? "—",
  },
]);

const handleSearch = () => {
  admin.search = searchInput.value;
  admin.page = 1;
  admin.fetchUsers();
};

const changePage = (p: number) => {
  admin.page = p;
  admin.fetchUsers();
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const roleBadgeClass = (role: string) => {
  if (role === "admin")
    return "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400";
  if (role === "staff")
    return "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400";
  return "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400";
};

const planBadgeClass = (plan: string) => {
  if (plan === "ultimate")
    return "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400";
  if (plan === "pro")
    return "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400";
  return "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400";
};

const planOptions = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
  { label: "Ultimate", value: "ultimate" },
];

const PROVIDER_GROUPS = [
  { key: "openai", label: "OpenAI", prefix: ["openai/"] },
  { key: "anthropic", label: "Anthropic", prefix: ["anthropic/"] },
  { key: "google", label: "Google", prefix: ["google/"] },
  { key: "deepseek", label: "DeepSeek", prefix: ["deepseek/"] },
];

const groupedAdminModels = computed(() =>
  PROVIDER_GROUPS.map((g) => ({
    ...g,
    models: admin.models.filter((m) =>
      g.prefix.some((p) => m.model.startsWith(p)),
    ),
  })).filter((g) => g.models.length > 0),
);

const ungroupedAdminModels = computed(() =>
  admin.models.filter(
    (m) =>
      !PROVIDER_GROUPS.some((g) => g.prefix.some((p) => m.model.startsWith(p))),
  ),
);

const showAddModel = ref(false);
const addModelLoading = ref(false);
const addModelError = ref<string | null>(null);
const newModel = ref({
  model: "",
  label: "",
  is_active: true,
  plans: [] as string[],
});

const submitAddModel = async () => {
  if (!newModel.value.model.trim() || !newModel.value.label.trim()) {
    addModelError.value = "Model ID and Label are required.";
    return;
  }
  addModelError.value = null;
  addModelLoading.value = true;
  try {
    await admin.addModel({
      model: newModel.value.model.trim(),
      label: newModel.value.label.trim(),
      is_active: newModel.value.is_active,
      plans: newModel.value.plans.length > 0 ? newModel.value.plans : null,
    });
    showAddModel.value = false;
    newModel.value = { model: "", label: "", is_active: true, plans: [] };
  } catch (e: any) {
    addModelError.value = e?.data?.error || e?.message || "Failed to add model";
  } finally {
    addModelLoading.value = false;
  }
};

const updateStatus = async (model: string, is_active: boolean) => {
  try {
    await admin.updateModel(model, { is_active });
  } catch {
    await admin.fetchModels();
  }
};

const updatePlans = async (model: string, plans: string[]) => {
  try {
    await admin.updateModel(model, { plans: plans.length > 0 ? plans : null });
  } catch {
    await admin.fetchModels();
  }
};

onMounted(() => {
  admin.fetchStats();
  admin.fetchUsers();
  admin.fetchModels();
});
</script>
