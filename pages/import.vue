<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        Bulk Import
      </h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        Paste a list of movies, shows, books, or music — one per line. Up to 200
        items at once.
      </p>
    </div>

    <!-- Input card -->
    <div
      class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden mb-4"
    >
      <!-- Card header -->
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <span
          class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wide uppercase"
          >Bulk Import</span
        >
        <span class="text-xs text-neutral-400 dark:text-neutral-600"
          >Up to 200 items</span
        >
      </div>

      <!-- Textarea -->
      <div class="px-4 pb-4">
        <UTextarea
          v-model="text"
          placeholder="The Godfather&#10;Crime and Punishment&#10;Dark Side of the Moon&#10;Breaking Bad&#10;..."
          :rows="12"
          autoresize
          :disabled="submitting"
          class="w-full bulk-textarea"
          :ui="{ base: 'w-full' }"
        />

        <!-- Footer row -->
        <div
          class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800"
        >
          <span
            class="text-xs text-neutral-400 dark:text-neutral-600 tabular-nums"
            >{{
              lineCount > 0
                ? `${lineCount} / 200 items`
                : "One item per line, or comma-separated"
            }}</span
          >
          <UButton
            @click="handleSubmit"
            :loading="submitting"
            :disabled="lineCount === 0 || submitting"
            color="primary"
            size="sm"
            class="import-cta rounded-lg px-4"
          >
            Import {{ lineCount > 0 ? lineCount : "" }} items
          </UButton>
        </div>
      </div>
    </div>

    <!-- Processing banner -->
    <Transition name="fade">
      <div
        v-if="processing"
        class="rounded-2xl border border-primary-200/60 dark:border-primary-700/40 bg-primary-50/50 dark:bg-primary-950/30 px-5 py-4 mb-4 flex items-start justify-between gap-4"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-loader-circle"
            class="animate-spin text-primary-500 size-5 mt-0.5 shrink-0"
          />
          <div>
            <p class="font-medium text-neutral-900 dark:text-white text-sm">
              Processing {{ queuedCount }} items in the background…
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              This may take a few minutes. Results will appear below.
            </p>
          </div>
        </div>
        <UButton
          variant="ghost"
          size="xs"
          :loading="pollingLoading"
          @click="pollStatus"
          class="shrink-0"
        >
          Refresh
        </UButton>
      </div>
    </Transition>

    <!-- Error -->
    <Transition name="fade">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Something went wrong"
        :description="error"
        :close-button="{ onClick: () => (error = null) }"
        class="mb-4"
      />
    </Transition>

    <!-- Recent imports -->
    <div v-if="recentImports.length > 0">
      <h2
        class="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3"
      >
        Recent imports
      </h2>
      <div class="space-y-2">
        <div
          v-for="record in recentImports"
          :key="record.id"
          class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm px-5 py-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-medium text-neutral-900 dark:text-white text-sm">
                  {{ record.success }} of {{ record.total }} imported
                </p>
                <span
                  v-if="record.failed > 0"
                  class="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5"
                >
                  {{ record.failed }} failed
                </span>
                <span
                  v-if="record.limit_reached"
                  class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2 py-0.5"
                >
                  Monthly limit reached —
                  <NuxtLink
                    to="/settings"
                    class="underline underline-offset-2 hover:text-primary-500 transition-colors"
                  >
                    upgrade your plan
                  </NuxtLink>
                  to add more.
                </span>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{ summarizeCategories(record.category_counts) }}
              </p>
            </div>
            <p
              class="text-xs text-neutral-400 whitespace-nowrap shrink-0 mt-0.5"
            >
              {{ formatDate(record.completed_at || record.created_at) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createItemsService,
  type BulkImportRecord,
} from "~/services/items.service";

const { setPageHeader } = usePageHeader();
useHead({ title: "Bulk Import" });
setPageHeader("Bulk Import", "Import multiple items at once");

const api = useApiService();
const itemsService = createItemsService(api);

const text = ref("");
const submitting = ref(false);
const processing = ref(false);
const pollingLoading = ref(false);
const queuedCount = ref(0);
const recentImports = ref<BulkImportRecord[]>([]);
const error = ref<string | null>(null);

const lineCount = computed(() => {
  const separator = text.value.includes("\n") ? /\n/ : /,/;
  return text.value
    .split(separator)
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .filter((l) => !l.match(/^[-#*=]+$/))
    .slice(0, 200).length;
});

let pollInterval: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const startPolling = () => {
  stopPolling();
  let pollCount = 0;
  pollInterval = setInterval(async () => {
    await pollStatus();
    pollCount++;
    // Stop if done or after 10 minutes (120 × 5s)
    if (!processing.value || pollCount >= 120) {
      stopPolling();
    }
  }, 5000);
};

const handleSubmit = async () => {
  if (!text.value.trim()) return;
  submitting.value = true;
  error.value = null;
  try {
    const result = await itemsService.bulkImport(text.value);
    queuedCount.value = result.queued;
    processing.value = true;
    text.value = "";
    // Initial poll after short delay, then keep polling every 5s
    setTimeout(async () => {
      await pollStatus();
      startPolling();
    }, 3000);
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || "Failed to start import";
  } finally {
    submitting.value = false;
  }
};

const pollStatus = async () => {
  pollingLoading.value = true;
  try {
    const all = await itemsService.getBulkImportStatus();
    // Only show completed records in recent imports
    recentImports.value = all.filter((r) => r.completed_at);
    // Stop processing banner if the latest record (including pending) is done
    if (all.length > 0 && all[0].completed_at) {
      processing.value = false;
    }
  } catch {
    // silently ignore poll errors
  } finally {
    pollingLoading.value = false;
  }
};

onUnmounted(stopPolling);

const summarizeCategories = (counts: Record<string, number> | null): string => {
  if (!counts) return "";
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `${n} ${cat}${n !== 1 ? "s" : ""}`)
    .join(", ");
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Load recent imports on mount
onMounted(pollStatus);
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

.bulk-textarea {
  width: 100%;
}

.bulk-textarea :deep(textarea) {
  width: 100%;
  background: transparent !important;
  resize: none;
}

.import-cta {
  box-shadow: 0 6px 18px -6px
    color-mix(in srgb, var(--color-primary-500) 60%, transparent);
  transition: box-shadow 0.2s ease;
}

.import-cta:hover:not(:disabled) {
  box-shadow: 0 8px 22px -6px
    color-mix(in srgb, var(--color-primary-500) 80%, transparent);
}
</style>
