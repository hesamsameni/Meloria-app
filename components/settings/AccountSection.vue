<template>
  <section class="mb-8">
    <p
      class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3"
    >
      Account
    </p>

    <UCard>
      <div class="flex items-center gap-3">
        <div class="relative">
          <UAvatar
            :alt="user?.email"
            :src="profile?.avatar_url || undefined"
            size="md"
          />
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarSelected"
          />
        </div>

        <div class="min-w-0">
          <p
            class="text-sm font-medium text-neutral-900 dark:text-white truncate"
          >
            {{ displayLabel || user?.email }}
          </p>
          <p class="text-xs text-neutral-400">
            {{ subscriptionLabel }}
          </p>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            :loading="loading"
            @click="avatarInput?.click()"
          >
            Change photo
          </UButton>
          <UButton variant="ghost" color="neutral" size="sm" @click="signOut">
            Sign out
          </UButton>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div class="sm:col-span-2">
          <p class="text-xs font-medium text-neutral-500 mb-1">Display name</p>
          <UInput
            v-model="displayName"
            placeholder="Your name"
            @keyup.enter="saveDisplayName"
          />
        </div>
        <div class="flex items-end">
          <UButton
            class="w-full"
            :loading="loading"
            :disabled="displayName === (profile?.display_name || '')"
            @click="saveDisplayName"
          >
            Save
          </UButton>
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-500 mt-2">{{ error }}</p>
    </UCard>
  </section>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth();
const { profile, loading, error, displayLabel, updateProfile, uploadAvatar } =
  useProfile();

const avatarInput = ref<HTMLInputElement | null>(null);
const displayName = ref(profile.value?.display_name || "");

const subscriptionLabel = computed(() => {
  const sub = profile.value?.subscription || "free";
  return sub.charAt(0).toUpperCase() + sub.slice(1) + " plan";
});

watch(
  () => profile.value?.display_name,
  (v) => {
    displayName.value = v || "";
  },
  { immediate: true },
);

const saveDisplayName = async () => {
  await updateProfile({ display_name: displayName.value || null });
};

const onAvatarSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const processed = await resizeAndCompressAvatar(file);
    await uploadAvatar(processed);
  } finally {
    input.value = "";
  }
};
</script>
