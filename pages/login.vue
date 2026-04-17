<template>
  <div
    class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4"
  >
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1
          class="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-1"
        >
          Meloria
        </h1>
        <p class="text-sm text-neutral-400">Your personal second brain</p>
      </div>

      <UCard>
        <UTabs v-model="tab" :items="tabs" class="mb-6" />

        <AuthSignInPanel v-if="tab === '0'" />
        <AuthSignUpPanel v-if="tab === '1'" />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const tab = ref("0");
const tabs = [
  { label: "Sign in", value: "0" },
  { label: "Sign up", value: "1" },
];
</script>
