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

      <div class="flex items-center gap-2 flex-wrap">
        <!-- source selector -->
        <div class="flex items-center gap-1.5 flex-wrap flex-1">
          <button
            v-for="s in sources"
            :key="s"
            @click="selectedSource = s"
            class="px-2.5 py-1 rounded-full text-xs transition-colors border"
            :class="
              selectedSource === s
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-300'
            "
          >
            {{ s }}
          </button>
        </div>

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
          :description="error"
          :close-button="{ onClick: reset }"
        />
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
