<template>
  <section class="mb-10">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Suggestions
    </p>

    <UCard
      class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Dismissed suggestions
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <template v-if="countLoading">Loading…</template>
            <template v-else-if="dismissedCount === 0"
              >No dismissed suggestions</template
            >
            <template v-else
              >{{ dismissedCount }} suggestion{{
                dismissedCount === 1 ? "" : "s"
              }}
              permanently hidden</template
            >
          </p>
        </div>

        <UButton
          variant="outline"
          color="error"
          size="sm"
          :disabled="dismissedCount === 0 || countLoading"
          :loading="clearing"
          class="shrink-0"
          @click="confirmClear"
        >
          Clear all
        </UButton>
      </div>
    </UCard>

    <!-- Confirmation modal -->
    <UModal v-model:open="showConfirm">
      <template #content>
        <div class="p-6">
          <h3
            class="text-base font-semibold text-neutral-900 dark:text-white mb-2"
          >
            Clear dismissed suggestions?
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            This will allow
            {{ dismissedCount }} previously dismissed suggestion{{
              dismissedCount === 1 ? "" : "s"
            }}
            to appear again in future batches.
          </p>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showConfirm = false"
            >
              Cancel
            </UButton>
            <UButton color="error" :loading="clearing" @click="doClear">
              Clear {{ dismissedCount }} dismissed
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { createItemsService } from "~/services/items.service";

const api = useApiService();
const itemsService = createItemsService(api);
const toast = useGlobalToast();

const dismissedCount = ref(0);
const countLoading = ref(true);
const clearing = ref(false);
const showConfirm = ref(false);

onMounted(async () => {
  try {
    const { count } = await itemsService.getDismissedCount();
    dismissedCount.value = count;
  } catch {
    // non-critical, leave at 0
  } finally {
    countLoading.value = false;
  }
});

function confirmClear() {
  showConfirm.value = true;
}

async function doClear() {
  clearing.value = true;
  try {
    const { cleared } = await itemsService.clearDismissed();
    dismissedCount.value = 0;
    showConfirm.value = false;
    toast.success(
      "Cleared",
      `${cleared} dismissed suggestion${cleared === 1 ? "" : "s"} removed`,
    );
  } catch (e: any) {
    toast.error(
      "Failed",
      e?.data?.error || e?.message || "Something went wrong",
    );
  } finally {
    clearing.value = false;
  }
}
</script>
