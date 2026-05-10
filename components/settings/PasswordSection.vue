<template>
  <section class="mb-10">
    <p class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
      Password
    </p>

    <UCard
      class="border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/70 shadow-sm rounded-2xl"
    >
      <div class="flex flex-col gap-4 max-w-sm">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Set a new password for your account. Leave blank if you prefer to sign in with a magic link or Google.
        </p>

        <UAlert v-if="error" color="error" variant="soft" :description="error" />
        <UAlert v-if="success" color="success" variant="soft" description="Password updated successfully." />

        <UFormField label="New password">
          <UInput
            v-model="newPassword"
            type="password"
            placeholder="••••••••"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField label="Confirm new password">
          <UInput
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            class="w-full"
            autocomplete="new-password"
            @keyup.enter="handleSave"
          />
        </UFormField>

        <div>
          <UButton :loading="loading" @click="handleSave">
            Update password
          </UButton>
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
const { updatePassword } = useAuth();

const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const handleSave = async () => {
  error.value = "";
  success.value = false;

  if (!newPassword.value || newPassword.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await updatePassword(newPassword.value);
    success.value = true;
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (e: any) {
    error.value = e.message || "Failed to update password.";
  } finally {
    loading.value = false;
  }
};
</script>
