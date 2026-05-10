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
        <!-- Loading / waiting for Supabase to process the recovery token -->
        <div
          v-if="state === 'loading'"
          class="flex flex-col items-center gap-3 py-4"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="w-6 h-6 animate-spin text-neutral-400"
          />
          <p class="text-sm text-neutral-500">Verifying reset link…</p>
        </div>

        <!-- Invalid / expired token -->
        <div v-else-if="state === 'invalid'" class="flex flex-col gap-4">
          <UAlert
            color="error"
            variant="soft"
            title="Link invalid or expired"
            description="This password reset link has expired or already been used. Please request a new one."
          />
          <UButton
            variant="outline"
            color="neutral"
            class="w-full"
            @click="navigateTo('/login')"
          >
            Back to sign in
          </UButton>
        </div>

        <!-- Set new password form -->
        <div v-else-if="state === 'form'" class="flex flex-col gap-4">
          <div>
            <p
              class="text-sm font-medium text-neutral-900 dark:text-white mb-0.5"
            >
              Set a new password
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Choose a strong password for your account.
            </p>
          </div>

          <UAlert
            v-if="formError"
            color="error"
            variant="soft"
            :description="formError"
          />

          <UFormField label="New password">
            <UInput
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
              class="w-full"
              @keyup.enter="handleSubmit"
            />
          </UFormField>
          <UFormField label="Confirm password">
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="w-full"
              @keyup.enter="handleSubmit"
            />
          </UFormField>
          <UButton class="w-full" :loading="loading" @click="handleSubmit">
            Update password
          </UButton>
        </div>

        <!-- Success -->
        <div v-else-if="state === 'done'" class="flex flex-col gap-4">
          <UAlert
            color="success"
            variant="soft"
            title="Password updated"
            description="Your password has been changed. You'll be redirected to your dashboard shortly."
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: "Reset Password" });

const { $supabase } = useNuxtApp();
const { updatePassword } = useAuth();

type State = "loading" | "invalid" | "form" | "done";
const state = ref<State>("loading");
const newPassword = ref("");
const confirmPassword = ref("");
const formError = ref("");
const loading = ref(false);

onMounted(async () => {
  if (import.meta.server) return;

  // The global auth store redirects here on PASSWORD_RECOVERY, so by the
  // time this page mounts there is usually already a recovery session.
  const {
    data: { session },
  } = await ($supabase as any).auth.getSession();
  if (session?.user) {
    state.value = "form";
    return;
  }

  // Fallback: if for some reason the session isn't ready yet, wait for it.
  const {
    data: { subscription },
  } = ($supabase as any).auth.onAuthStateChange((event: string) => {
    if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
      state.value = "form";
    }
  });

  // After 6s with no session, the link is invalid/expired.
  setTimeout(() => {
    if (state.value === "loading") state.value = "invalid";
  }, 6000);

  onUnmounted(() => subscription.unsubscribe());
});

const handleSubmit = async () => {
  formError.value = "";
  if (!newPassword.value || newPassword.value.length < 6) {
    formError.value = "Password must be at least 6 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    formError.value = "Passwords do not match.";
    return;
  }
  loading.value = true;
  try {
    await updatePassword(newPassword.value);
    state.value = "done";
    setTimeout(() => navigateTo("/dashboard"), 2000);
  } catch (e: any) {
    formError.value = e.message || "Failed to update password.";
  } finally {
    loading.value = false;
  }
};
</script>
