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
        <div v-if="tab === 0">
          <div class="flex flex-col gap-3">
            <!-- Google -->
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

            <UDivider label="or" />

            <!-- email + password -->
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

            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              :description="error"
            />

            <UButton
              class="w-full"
              :loading="loadingEmail"
              @click="handleEmailSignIn"
            >
              Sign in
            </UButton>

            <UDivider label="or use magic link" />

            <div class="flex gap-2">
              <UInput
                v-model="magicEmail"
                type="email"
                placeholder="you@example.com"
                class="flex-1"
              />
              <UButton
                variant="outline"
                color="neutral"
                :loading="loadingMagic"
                @click="handleMagicLink"
              >
                Send link
              </UButton>
            </div>

            <UAlert
              v-if="magicSent"
              color="success"
              variant="soft"
              description="Check your email for the magic link."
            />
          </div>
        </div>

        <!-- sign up -->
        <div v-if="tab === 1">
          <div class="flex flex-col gap-3">
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
              Sign up with Google
            </UButton>

            <UDivider label="or" />

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
              v-if="error"
              color="error"
              variant="soft"
              :description="error"
            />
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
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
} = useAuth();

const tab = ref(0);
const tabs = [{ label: "Sign in" }, { label: "Sign up" }];

const email = ref("");
const password = ref("");
const magicEmail = ref("");
const error = ref("");
const magicSent = ref(false);
const signUpSuccess = ref(false);

const loadingEmail = ref(false);
const loadingGoogle = ref(false);
const loadingMagic = ref(false);

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

const handleMagicLink = async () => {
  error.value = "";
  magicSent.value = false;
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

const handleGoogle = async () => {
  loadingGoogle.value = true;
  try {
    await signInWithGoogle();
  } catch (e: any) {
    error.value = e.message;
    loadingGoogle.value = false;
  }
};
</script>
