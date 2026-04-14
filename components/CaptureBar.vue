<template>
  <div>
    <div
      class="rounded-2xl border border-neutral-200/70 dark:border-neutral-700/50 bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-950 shadow-sm px-5 py-4"
    >
      <div class="mb-3">
        <h3
          class="text-lg text-xl font-semibold text-neutral-900 dark:text-white leading-tight"
        >
          Capture to Meloria
        </h3>
      </div>
      <div class="flex items-stretch flex-col">
        <UTextarea
          v-model="input"
          :placeholder="placeholder"
          :rows="3"
          autoresize
          class="capture-textarea"
          @keydown.meta.enter="handleCapture"
          @keydown.ctrl.enter="handleCapture"
        />

        <div class="flex justify-between items-center mt-3 mb-3">
          <p class="text-xs text-neutral-400">
            {{ input.trim().length }} chars
          </p>
          <div>
            <UButton
              @click="handleCapture"
              :loading="loading"
              :disabled="!input.trim()"
              color="primary"
              size="lg"
              class="capture-cta"
            >
              Capture
            </UButton>
          </div>
        </div>
      </div>

      <!-- feedback -->
      <Transition name="fade">
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
      </Transition>

      <Transition name="fade">
        <UAlert
          v-if="error"
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
      </Transition>
    </div>
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

.capture-cta {
  width: 100%;
  margin-top: 0.6rem;
  box-shadow: 0 10px 22px -12px
    color-mix(in srgb, var(--color-primary-500) 75%, transparent);
}

@media (max-width: 640px) {
  .capture-cta {
    width: 100%;
    min-width: 0;
  }
}
</style>
