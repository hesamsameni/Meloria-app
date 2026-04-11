<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <p class="text-sm font-medium text-neutral-900 dark:text-white">
        Choose a sign-up method
      </p>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        Pick the option you prefer.
      </p>
    </div>

    <AuthMethodSelector v-model="method" @update:model-value="clearState" />

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
          placeholder="Min 6 characters"
          class="w-full"
          @keyup.enter="handleEmailSignUp"
        />
      </UFormField>
      <UAlert
        v-if="signUpSuccess"
        color="success"
        variant="soft"
        description="Account created! Check your email to confirm."
      />
      <UButton
        class="w-full"
        :loading="loadingEmail"
        @click="handleEmailSignUp"
      >
        Create account
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signUpWithEmail, signInWithMagicLink, signInWithGoogle } = useAuth();

const method = ref<"google" | "magic" | "password">("google");
const error = ref("");
const signUpSuccess = ref(false);

const magicEmail = ref("");
const magicSent = ref(false);
const loadingMagic = ref(false);

const email = ref("");
const password = ref("");
const loadingEmail = ref(false);

const loadingGoogle = ref(false);

const clearState = () => {
  error.value = "";
  magicSent.value = false;
  signUpSuccess.value = false;
};

const handleGoogle = async () => {
  loadingGoogle.value = true;
  error.value = "";
  try {
    await signInWithGoogle();
  } catch (e: any) {
    error.value = e.message || "Google sign-up failed";
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

const handleEmailSignUp = async () => {
  error.value = "";
  signUpSuccess.value = false;
  loadingEmail.value = true;
  try {
    await signUpWithEmail(email.value, password.value);
    signUpSuccess.value = true;
  } catch (e: any) {
    error.value = e.message || "Could not create account";
  } finally {
    loadingEmail.value = false;
  }
};
</script>
