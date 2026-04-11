<template>
  <UCard>
    <div class="flex flex-col gap-3">
      <UTextarea
        v-model="input"
        :placeholder="placeholder"
        :rows="2"
        autoresize
        @keydown.meta.enter="handleCapture"
        @keydown.ctrl.enter="handleCapture"
      />

      <div class="flex justify-end gap-2 flex-wrap">
        <UButton
          @click="handleCapture"
          :loading="loading"
          :disabled="!input.trim()"
          color="primary"
          size="sm"
        >
          Capture
        </UButton>
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
  </UCard>
</template>

<script setup lang="ts">
import { useCapture } from "~/composables/useCapture";

const emit = defineEmits<{ captured: [] }>();

const { loading, lastCaptured, error, capture, reset } = useCapture();

const input = ref("");
const selectedSource = ref("manual");

const sources = ["manual", "instagram", "youtube", "x", "shazam"];

const placeholder =
  "Drop anything — a movie title, YouTube link, Shazam result, idea…  ⌘↵ to send";

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
  const item = await capture(input.value, selectedSource.value);
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
</style>
