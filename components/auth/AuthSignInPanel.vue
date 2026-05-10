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
      <template v-if="!showForgot">
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
        <div class="flex items-center justify-between gap-2">
          <UButton
            class="flex-1"
            :loading="loadingEmail"
            @click="handleEmailSignIn"
            >Sign in</UButton
          >
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            @click="
              showForgot = true;
              resetSent = false;
              resetError = '';
            "
          >
            Forgot password?
          </UButton>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center gap-2 mb-1">
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-arrow-left"
            @click="showForgot = false"
          />
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            Reset your password
          </p>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 -mt-1">
          Enter your email and we'll send you a reset link.
        </p>
        <UAlert
          v-if="resetError"
          color="error"
          variant="soft"
          :description="resetError"
        />
        <UAlert
          v-if="resetSent"
          color="success"
          variant="soft"
          description="Check your email for the reset link."
        />
        <template v-if="!resetSent">
          <UFormField label="Email">
            <UInput
              v-model="resetEmail"
              type="email"
              placeholder="you@example.com"
              class="w-full"
              @keyup.enter="handleResetPassword"
            />
          </UFormField>
          <UButton
            class="w-full"
            :loading="loadingReset"
            @click="handleResetPassword"
          >
            Send reset link
          </UButton>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  signInWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
  sendPasswordReset,
} = useAuth();
const posthog = usePostHog();

const method = ref<"google" | "magic" | "password">("google");
const error = ref("");

const magicEmail = ref("");
const magicSent = ref(false);
const loadingMagic = ref(false);

const email = ref("");
const password = ref("");
const loadingEmail = ref(false);

const loadingGoogle = ref(false);

const showForgot = ref(false);
const resetEmail = ref("");
const resetSent = ref(false);
const resetError = ref("");
const loadingReset = ref(false);

const handleResetPassword = async () => {
  resetError.value = "";
  loadingReset.value = true;
  try {
    await sendPasswordReset(resetEmail.value);
    resetSent.value = true;
  } catch (e: any) {
    resetError.value = e.message || "Could not send reset link";
  } finally {
    loadingReset.value = false;
  }
};

const clearError = () => {
  error.value = "";
  magicSent.value = false;
};

const handleGoogle = async () => {
  loadingGoogle.value = true;
  error.value = "";
  try {
    posthog?.capture("user_signed_in", { method: "google" });
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
    posthog?.capture("user_signed_in", { method: "magic_link" });
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
    posthog?.identify(email.value);
    posthog?.capture("user_signed_in", { method: "email" });
    await navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e.message || "Invalid email or password";
  } finally {
    loadingEmail.value = false;
  }
};
</script>
