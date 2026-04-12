<template>
  <div class="capture-shell border-0">
    <div class="capture-bg rounded-2xl p-4 p-5">
      <div class="mb-3">
        <h3
          class="text-lg text-xl font-semibold text-neutral-100 leading-tight"
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

        <div class="flex justify-between items-center mt-3">
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

.capture-shell {
  overflow: hidden;
}

.capture-bg {
  --capture-accent-1: color-mix(
    in srgb,
    var(--color-primary-500) 26%,
    transparent
  );
  --capture-accent-2: color-mix(
    in srgb,
    var(--color-primary-700) 26%,
    transparent
  );
  --capture-surface-top: var(--color-neutral-800);
  --capture-surface-bottom: var(--color-neutral-950);
  --capture-border: color-mix(
    in srgb,
    var(--color-neutral-400) 24%,
    transparent
  );
  --capture-shadow: color-mix(
    in srgb,
    var(--color-neutral-950) 92%,
    transparent
  );

  background:
    radial-gradient(
      120% 120% at 0% 0%,
      var(--capture-accent-1) 0%,
      transparent 56%
    ),
    radial-gradient(
      100% 110% at 100% 100%,
      var(--capture-accent-2) 0%,
      transparent 62%
    ),
    linear-gradient(
      180deg,
      var(--capture-surface-top) 0%,
      var(--capture-surface-bottom) 100%
    );
  background-size:
    130% 130%,
    130% 130%,
    100% 100%;
  background-position:
    0% 0%,
    100% 100%,
    50% 50%;
  animation: captureGradientDrift 12s ease-in-out infinite;
  border: 1px solid var(--capture-border);
  box-shadow: 0 14px 36px -20px var(--capture-shadow);
}

:global(.light) .capture-bg {
  --capture-accent-1: color-mix(
    in srgb,
    var(--color-primary-500) 16%,
    transparent
  );
  --capture-accent-2: color-mix(
    in srgb,
    var(--color-primary-700) 12%,
    transparent
  );
  --capture-surface-top: var(--color-neutral-100);
  --capture-surface-bottom: var(--color-neutral-50);
  --capture-border: color-mix(
    in srgb,
    var(--color-neutral-400) 45%,
    transparent
  );
  --capture-shadow: color-mix(
    in srgb,
    var(--color-neutral-900) 20%,
    transparent
  );
}

@keyframes captureGradientDrift {
  0% {
    background-position:
      0% 0%,
      100% 100%,
      50% 50%;
  }
  50% {
    background-position:
      8% 6%,
      92% 94%,
      50% 50%;
  }
  100% {
    background-position:
      4% 2%,
      96% 98%,
      50% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .capture-bg {
    animation: none;
  }
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
