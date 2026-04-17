<template>
  <div
    class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-2">
      <span
        class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wide uppercase"
        >Capture</span
      >
      <NuxtLink
        to="/import"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 shrink-0" />
        Bulk import
      </NuxtLink>
    </div>

    <!-- Input area -->
    <div class="px-4 pb-4">
      <UTextarea
        v-model="input"
        :placeholder="placeholder"
        :rows="3"
        autoresize
        class="capture-textarea w-full"
        @keydown.meta.enter="handleCapture"
        @keydown.ctrl.enter="handleCapture"
      />

      <!-- Footer row -->
      <div
        class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800"
      >
        <span
          class="text-xs text-neutral-400 dark:text-neutral-600 tabular-nums"
        >
          {{
            input.trim().length > 0
              ? `${input.trim().length} chars`
              : "⌘ + Enter to capture"
          }}
        </span>
        <UButton
          @click="handleCapture"
          :loading="loading"
          :disabled="!input.trim()"
          color="primary"
          size="sm"
          class="capture-cta rounded-lg px-4"
        >
          Capture
        </UButton>
      </div>
    </div>

    <!-- Feedback -->
    <Transition name="slide-fade">
      <div
        v-if="lastCaptured || error"
        class="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3"
      >
        <UAlert
          v-if="lastCaptured"
          color="success"
          variant="soft"
          :title="lastCaptured.title || 'Saved'"
          :description="
            lastCaptured.category +
            (lastCaptured.creator ? ` · ${lastCaptured.creator}` : '')
          "
          :close-button="{ onClick: reset }"
        />
        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          title="Something went wrong"
          :close-button="{ onClick: reset }"
        >
          <template #description>
            <span v-if="upgradeParts">
              {{ upgradeParts.before }}
              <NuxtLink
                to="/settings"
                class="underline underline-offset-2 hover:text-primary-500 transition-colors"
              >
                {{ upgradeParts.match }}
              </NuxtLink>
              {{ upgradeParts.after }}
            </span>
            <span v-else>{{ error }}</span>
          </template>
        </UAlert>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useCapture } from "~/composables/useCapture";

const emit = defineEmits<{ captured: [] }>();

const { loading, lastCaptured, error, capture, reset } = useCapture();

const input = ref("");
const source = "Meloria Dashboard";

const placeholder = "Drop anything - a title, link, note, or idea";

const upgradeParts = computed(() => {
  if (!error.value) return null;
  const msg = String(error.value);

  // Turn the first occurrence of the word "upgrade" into a link.
  const idx = msg.toLowerCase().indexOf("upgrade");
  if (idx === -1) return null;

  return {
    before: msg.slice(0, idx),
    match: msg.slice(idx, idx + "upgrade".length),
    after: msg.slice(idx + "upgrade".length),
  };
});

const handleCapture = async () => {
  const item = await capture(input.value, source);
  if (item) {
    input.value = "";
    emit("captured");
  }
};
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

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.capture-cta {
  box-shadow: 0 6px 18px -6px
    color-mix(in srgb, var(--color-primary-500) 60%, transparent);
  transition: box-shadow 0.2s ease;
}

.capture-cta:hover:not(:disabled) {
  box-shadow: 0 8px 22px -6px
    color-mix(in srgb, var(--color-primary-500) 80%, transparent);
}

:deep(.capture-textarea textarea) {
  background: transparent !important;
  resize: none;
}
</style>
