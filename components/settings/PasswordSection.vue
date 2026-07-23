<template>
  <div class="inline-flex">
    <UButton
      variant="outline"
      color="neutral"
      size="sm"
      icon="i-lucide-key-round"
      class="shrink-0"
      @click="openModal"
    >
      Change password
    </UButton>

    <UModal
      v-model:open="open"
      title="Change password"
      :ui="{
        content:
          'max-w-md rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/95 dark:bg-neutral-950/95 shadow-xl',
      }"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Set a new password for your account. This also lets you sign in with
            your email and password if you normally use a magic link or Google.
          </p>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :description="error"
          />

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
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="open = false"
          />
          <UButton
            :loading="loading"
            label="Update password"
            @click="handleSave"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { updatePassword } = useAuth();
const toast = useGlobalToast();

const open = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const openModal = () => {
  error.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  open.value = true;
};

const handleSave = async () => {
  error.value = "";

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
    newPassword.value = "";
    confirmPassword.value = "";
    open.value = false;
    toast.success(
      "Password updated",
      "Your password has been changed successfully.",
    );
  } catch (e: any) {
    error.value = e.message || "Failed to update password.";
  } finally {
    loading.value = false;
  }
};
</script>
