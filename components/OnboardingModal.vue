<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition name="modal-pop">
          <div
            v-if="visible"
            class="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            <!-- Progress dots -->
            <div class="flex justify-center gap-1.5 pt-5 pb-1">
              <div
                v-for="(_, i) in steps"
                :key="i"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="
                  i === currentStep
                    ? 'w-6 bg-primary-500'
                    : i < currentStep
                      ? 'w-3 bg-primary-300'
                      : 'w-3 bg-neutral-200 dark:bg-neutral-700'
                "
              />
            </div>

            <!-- Step content -->
            <div class="px-8 pt-6 pb-8 min-h-[360px] flex flex-col">
              <Transition :name="transitionName" mode="out-in">
                <div :key="currentStep" class="flex flex-col flex-1">
                  <!-- Icon -->
                  <div
                    class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    :class="step.iconBg"
                  >
                    <UIcon
                      :name="step.icon"
                      class="w-7 h-7"
                      :class="step.iconColor"
                    />
                  </div>

                  <!-- Text -->
                  <h2
                    class="text-xl font-semibold text-neutral-900 dark:text-white leading-snug mb-2"
                  >
                    {{ step.title }}
                  </h2>
                  <p
                    class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed flex-1"
                  >
                    {{ step.body }}
                  </p>

                  <!-- Feature pills for step 0 -->
                  <div v-if="step.pills" class="mt-5 flex flex-wrap gap-2">
                    <span
                      v-for="pill in step.pills"
                      :key="pill"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    >
                      {{ pill }}
                    </span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Footer -->
            <div class="px-8 pb-7 flex items-center gap-3">
              <UButton
                v-if="currentStep > 0"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="prev"
              >
                ← Back
              </UButton>
              <div class="flex-1" />
              <UButton v-if="!isLast" color="primary" size="sm" @click="next">
                Next →
              </UButton>
              <UButton v-else color="primary" size="sm" @click="close">
                Let's go 🎉
              </UButton>
            </div>

            <!-- Close button -->
            <button
              class="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              @click="close"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ done: [] }>();

const STORAGE_KEY = computed(() => `meloria_onboarded_${props.userId}`);

const visible = ref(false);
const currentStep = ref(0);
const transitionName = ref("slide-left");

const steps = [
  {
    icon: "i-lucide-sparkles",
    iconBg: "bg-primary-50 dark:bg-primary-900/30",
    iconColor: "text-primary-500",
    title: "Welcome to Meloria 👋",
    body: "Meloria is your personal second brain for everything you watch, read, and listen to. Here's a quick tour of what you can do.",
    pills: [
      "🎬 Movies & Shows",
      "📚 Books",
      "🎵 Music",
      "🎮 Games",
      "🎙 Podcasts",
    ],
  },
  {
    icon: "i-lucide-zap",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-500",
    title: "Capture anything, instantly",
    body: "Use the search bar at the top of your dashboard to add anything — just type a title and we'll find it. You can also import from Telegram, Apple Shortcuts, or use Bulk Import to add a whole list at once.",
  },
  {
    icon: "i-lucide-library",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-500",
    title: "Your library, your way",
    body: "Everything you add lands in your Library, sorted by category. Track your status — Want to, In progress, or Finished — and rate things as you go. Finished items help us learn your taste.",
  },
  {
    icon: "i-lucide-brain",
    iconBg: "bg-violet-50 dark:bg-violet-900/30",
    iconColor: "text-violet-500",
    title: "Get smarter recommendations",
    body: "Once you have a few finished items, Meloria builds your Taste Profile and generates personalised Suggestions. The more you add and rate, the better it gets.",
  },
  {
    icon: "i-lucide-compass",
    iconBg: "bg-green-50 dark:bg-green-900/30",
    iconColor: "text-green-500",
    title: "Discover what others love",
    body: "Head to Discover to see the most popular titles in our community. Add them straight to your library to seed your taste profile and unlock recommendations right away.",
  },
];

const step = computed(() => steps[currentStep.value]);
const isLast = computed(() => currentStep.value === steps.length - 1);

const next = () => {
  transitionName.value = "slide-left";
  currentStep.value++;
};

const prev = () => {
  transitionName.value = "slide-right";
  currentStep.value--;
};

const close = () => {
  visible.value = false;
  localStorage.setItem(STORAGE_KEY.value, "1");
  emit("done");
};

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY.value)) {
    // Small delay so the dashboard renders first
    setTimeout(() => {
      visible.value = true;
    }, 600);
  }
});
</script>

<style scoped>
/* Overlay */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Modal pop */
.modal-pop-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-pop-enter-from {
  opacity: 0;
  transform: scale(0.93) translateY(12px);
}
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* Step slide left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(28px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

/* Step slide right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(28px);
}
</style>
