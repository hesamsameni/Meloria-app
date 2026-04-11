<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <p class="text-sm font-medium text-neutral-900 dark:text-white">
        Choose a sign-in method
      </p>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        You can switch methods anytime.
      </p>
    </div>

    <AuthMethodSelector v-model="method" @update:model-value="clearError" />

    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <!-- Google -->
    <div v-if="method === 'google'" class="flex flex-col gap-3">
      <AuthGoogleButton :loading="loadingGoogle" @click="handleGoogle" />
    </div>

    <!-- Magic link -->
    <div v-else-if="method === 'magic'" class="flex flex-col gap-3">
      <UFormField label="Email">
        <UInput
          v-model="magicEmail"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          @keyup.enter="handleMagicLink"
        />
      </UFormField>
      <UButton
        variant="outline"
        color="neutral"
        class="w-full"
        :loading="loadingMagic"
        @click="handleMagicLink"
      >
        Send magic link
      </UButton>
      <UAlert
        v-if="magicSent"
        color="success"
        variant="soft"
        description="Check your email for the magic link."
      />
    </div>

    <!-- Email + password -->
    <div v-else class="flex flex-col gap-3">
      <UFormField label="Email">
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Password">
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          @keyup.enter="handleEmailSignIn"
        />
      </UFormField>
      <UButton class="w-full" :loading="loadingEmail" @click="handleEmailSignIn"
        >Sign in</UButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const { signInWithEmail, signInWithMagicLink, signInWithGoogle } = useAuth();

const method = ref<"google" | "magic" | "password">("google");
const error = ref("");

const magicEmail = ref("");
const magicSent = ref(false);
const loadingMagic = ref(false);

const email = ref("");
const password = ref("");
const loadingEmail = ref(false);

const loadingGoogle = ref(false);

const clearError = () => {
  error.value = "";
  magicSent.value = false;
};

const handleGoogle = async () => {
  loadingGoogle.value = true;
  error.value = "";
  try {
    await signInWithGoogle();
  } catch (e: any) {
    error.value = e.message || "Google sign-in failed";
  } finally {
    loadingGoogle.value = false;
  }
};

const handleMagicLink = async () => {
  magicSent.value = false;
  error.value = "";
  loadingMagic.value = true;
  try {
    await signInWithMagicLink(magicEmail.value);
    magicSent.value = true;
  } catch (e: any) {
    error.value = e.message || "Could not send magic link";
  } finally {
    loadingMagic.value = false;
  }
};

const handleEmailSignIn = async () => {
  error.value = "";
  loadingEmail.value = true;
  try {
    await signInWithEmail(email.value, password.value);
    await navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e.message || "Invalid email or password";
  } finally {
    loadingEmail.value = false;
  }
};
</script>
