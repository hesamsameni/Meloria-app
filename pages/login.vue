<template>
  <div
    class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4"
  >
    <div class="w-full max-w-sm">
      <!-- logo -->
      <div class="text-center mb-8">
        <h1
          class="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-1"
        >
          Meloria
        </h1>
        <p class="text-sm text-neutral-400">Your personal second brain</p>
      </div>

      <UCard>
        <!-- mode tabs -->
        <UTabs v-model="tab" :items="tabs" class="mb-6" />

        <!-- sign in -->
        <div v-if="tab === '0'">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                Choose a sign-in method
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                You can switch methods anytime.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                class="w-full"
                size="sm"
                :variant="signInMethod === 'google' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignInMethod('google')"
              >
                Google
              </UButton>
              <UButton
                class="w-full"
                size="sm"
                :variant="signInMethod === 'magic' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignInMethod('magic')"
              >
                Magic
              </UButton>
              <UButton
                class="w-full"
                size="sm"
                :variant="signInMethod === 'password' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignInMethod('password')"
              >
                Email
              </UButton>
            </div>

            <UAlert
              v-if="signInError"
              color="error"
              variant="soft"
              :description="signInError"
            />

            <div v-if="signInMethod === 'google'" class="flex flex-col gap-3">
              <UButton
                variant="outline"
                color="neutral"
                class="w-full"
                @click="handleGoogle"
                :loading="loadingGoogle"
              >
                <template #leading>
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </template>
                Continue with Google
              </UButton>
            </div>

            <div
              v-else-if="signInMethod === 'magic'"
              class="flex flex-col gap-3"
            >
              <UFormField label="Email">
                <UInput
                  v-model="signInMagicEmail"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full"
                  @keyup.enter="handleMagicLinkSignIn"
                />
              </UFormField>
              <UButton
                variant="outline"
                color="neutral"
                class="w-full"
                :loading="loadingMagicSignIn"
                @click="handleMagicLinkSignIn"
              >
                Send magic link
              </UButton>
              <UAlert
                v-if="signInMagicSent"
                color="success"
                variant="soft"
                description="Check your email for the magic link."
              />
            </div>

            <div v-else class="flex flex-col gap-3">
              <UFormField label="Email">
                <UInput
                  v-model="signInEmail"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Password">
                <UInput
                  v-model="signInPassword"
                  type="password"
                  placeholder="••••••••"
                  class="w-full"
                  @keyup.enter="handleEmailSignIn"
                />
              </UFormField>
              <UButton
                class="w-full"
                :loading="loadingEmailSignIn"
                @click="handleEmailSignIn"
              >
                Sign in
              </UButton>
            </div>
          </div>
        </div>

        <!-- sign up -->
        <div v-if="tab === '1'">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                Choose a sign-up method
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Pick the option you prefer.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                class="w-full"
                size="sm"
                :variant="signUpMethod === 'google' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignUpMethod('google')"
              >
                Google
              </UButton>
              <UButton
                class="w-full"
                size="sm"
                :variant="signUpMethod === 'magic' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignUpMethod('magic')"
              >
                Magic
              </UButton>
              <UButton
                class="w-full"
                size="sm"
                :variant="signUpMethod === 'password' ? 'solid' : 'outline'"
                color="neutral"
                @click="selectSignUpMethod('password')"
              >
                Email
              </UButton>
            </div>

            <UAlert
              v-if="signUpError"
              color="error"
              variant="soft"
              :description="signUpError"
            />

            <div v-if="signUpMethod === 'google'" class="flex flex-col gap-3">
              <UButton
                variant="outline"
                color="neutral"
                class="w-full"
                @click="handleGoogle"
                :loading="loadingGoogle"
              >
                <template #leading>
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </template>
                Continue with Google
              </UButton>
            </div>

            <div
              v-else-if="signUpMethod === 'magic'"
              class="flex flex-col gap-3"
            >
              <UFormField label="Email">
                <UInput
                  v-model="signUpMagicEmail"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full"
                  @keyup.enter="handleMagicLinkSignUp"
                />
              </UFormField>
              <UButton
                variant="outline"
                color="neutral"
                class="w-full"
                :loading="loadingMagicSignUp"
                @click="handleMagicLinkSignUp"
              >
                Send magic link
              </UButton>
              <UAlert
                v-if="signUpMagicSent"
                color="success"
                variant="soft"
                description="Check your email for the magic link."
              />
            </div>

            <div v-else class="flex flex-col gap-3">
              <UFormField label="Email">
                <UInput
                  v-model="signUpEmail"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Password">
                <UInput
                  v-model="signUpPassword"
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
                :loading="loadingEmailSignUp"
                @click="handleEmailSignUp"
              >
                Create account
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

type AuthMethod = "google" | "magic" | "password";

const {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
} = useAuth();

const tab = ref("0");
const tabs = [{ label: "Sign in" }, { label: "Sign up" }];

const signInMethod = ref<AuthMethod>("magic");
const signUpMethod = ref<AuthMethod>("password");

const signInEmail = ref("");
const signInPassword = ref("");
const signInMagicEmail = ref("");
const signInError = ref("");
const signInMagicSent = ref(false);

const signUpEmail = ref("");
const signUpPassword = ref("");
const signUpMagicEmail = ref("");
const signUpError = ref("");
const signUpMagicSent = ref(false);
const signUpSuccess = ref(false);

const loadingEmailSignIn = ref(false);
const loadingEmailSignUp = ref(false);
const loadingGoogle = ref(false);
const loadingMagicSignIn = ref(false);
const loadingMagicSignUp = ref(false);

const selectSignInMethod = (method: AuthMethod) => {
  signInMethod.value = method;
  signInError.value = "";
  signInMagicSent.value = false;
};

const selectSignUpMethod = (method: AuthMethod) => {
  signUpMethod.value = method;
  signUpError.value = "";
  signUpMagicSent.value = false;
  signUpSuccess.value = false;
};

watch(tab, () => {
  signInError.value = "";
  signUpError.value = "";
  signInMagicSent.value = false;
  signUpMagicSent.value = false;
  signUpSuccess.value = false;
});

const handleEmailSignIn = async () => {
  signInError.value = "";
  loadingEmailSignIn.value = true;
  try {
    await signInWithEmail(signInEmail.value, signInPassword.value);
    await navigateTo("/dashboard");
  } catch (e: any) {
    signInError.value = e.message || "Invalid email or password";
  } finally {
    loadingEmailSignIn.value = false;
  }
};

const handleEmailSignUp = async () => {
  signUpError.value = "";
  signUpSuccess.value = false;
  loadingEmailSignUp.value = true;
  try {
    await signUpWithEmail(signUpEmail.value, signUpPassword.value);
    signUpSuccess.value = true;
  } catch (e: any) {
    signUpError.value = e.message || "Could not create account";
  } finally {
    loadingEmailSignUp.value = false;
  }
};

const handleMagicLinkSignIn = async () => {
  signInError.value = "";
  signInMagicSent.value = false;
  loadingMagicSignIn.value = true;
  try {
    await signInWithMagicLink(signInMagicEmail.value);
    signInMagicSent.value = true;
  } catch (e: any) {
    signInError.value = e.message || "Could not send magic link";
  } finally {
    loadingMagicSignIn.value = false;
  }
};

const handleMagicLinkSignUp = async () => {
  signUpError.value = "";
  signUpMagicSent.value = false;
  signUpSuccess.value = false;
  loadingMagicSignUp.value = true;
  try {
    await signInWithMagicLink(signUpMagicEmail.value);
    signUpMagicSent.value = true;
  } catch (e: any) {
    signUpError.value = e.message || "Could not send magic link";
  } finally {
    loadingMagicSignUp.value = false;
  }
};

const handleGoogle = async () => {
  loadingGoogle.value = true;
  try {
    await signInWithGoogle();
  } catch (e: any) {
    signInError.value = e.message;
    signUpError.value = e.message;
  } finally {
    loadingGoogle.value = false;
  }
};
</script>
