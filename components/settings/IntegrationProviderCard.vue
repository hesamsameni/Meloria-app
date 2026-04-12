<template>
  <UCard class="border border-neutral-200/80 dark:border-neutral-800/80">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <div
          class="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0"
        >
          <UIcon :name="icon" class="w-5 h-5" />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ title }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {{ description }}
          </p>
        </div>
      </div>

      <UButton
        v-if="isTelegram"
        size="sm"
        :variant="telegramStatus?.linked ? 'soft' : 'outline'"
        :color="telegramStatus?.linked ? 'success' : 'neutral'"
        :loading="generatingCode"
        :disabled="telegramStatus?.linked"
        class="shrink-0"
        @click="generateCode"
      >
        {{ telegramStatus?.linked ? "Connected" : "Connect" }}
      </UButton>

      <UButton
        v-else-if="isSpotify"
        size="sm"
        :variant="spotifyStatus?.linked ? 'soft' : 'outline'"
        :color="spotifyStatus?.linked ? 'success' : 'neutral'"
        :loading="spotifyLoading"
        class="shrink-0"
        @click="spotifyStatus?.linked ? disconnectSpotify() : connectSpotify()"
      >
        {{ spotifyStatus?.linked ? "Disconnect" : "Connect" }}
      </UButton>

      <UBadge v-else color="neutral" variant="soft" label="Coming soon" />
    </div>

    <div
      v-if="isTelegram"
      class="mt-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 px-3 py-2"
    >
      <p
        v-if="telegramStatus?.linked"
        class="text-xs text-neutral-500 dark:text-neutral-400"
      >
        @{{ telegramStatus.telegram_username || "unknown" }} linked
        {{ formatDate(telegramStatus.linked_at) }}
      </p>

      <div v-else-if="linkCode" class="flex flex-col gap-2">
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Open
          <strong
            ><a href="https://t.me/meloria_app_bot" target="_blank"
              >@MeloriaBot</a
            ></strong
          >
          and send this command:
        </p>

        <div class="flex items-center gap-2 flex-wrap">
          <code
            class="flex-1 min-w-[12rem] text-sm font-mono font-semibold text-center py-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 tracking-widest"
          >
            /link {{ linkCode.code }}
          </code>

          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            class="shrink-0"
            @click="copyLinkCode"
          >
            {{ codeCopied ? "Copied" : "Copy" }}
          </UButton>
        </div>

        <p class="text-xs text-neutral-400">Code expires in 15 minutes</p>
      </div>

      <p v-else class="text-xs text-neutral-500 dark:text-neutral-400">
        Tap Connect to generate your Telegram linking code.
      </p>
    </div>

    <div
      v-if="isSpotify"
      class="mt-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 px-3 py-2 space-y-2"
    >
      <template v-if="spotifyStatus?.linked">
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Connected as
          <strong>{{
            spotifyStatus.display_name || spotifyStatus.spotify_user_id
          }}</strong>
          <span v-if="spotifyStatus.linked_at">
            • linked {{ formatDate(spotifyStatus.linked_at) }}
          </span>
        </p>

        <div v-if="!showPlaylistInput" class="flex items-center gap-2">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 flex-1">
            Saving music to your
            <strong>Meloria</strong> playlist automatically.
          </p>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            @click="showPlaylistInput = true"
          >
            Change playlist
          </UButton>
        </div>

        <div v-else class="flex flex-col gap-2">
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Paste a Spotify playlist URL to use as the target instead:
          </p>
          <div class="flex items-center gap-2">
            <UInput
              v-model="playlistInput"
              class="flex-1 text-xs"
              placeholder="https://open.spotify.com/playlist/..."
              size="sm"
            />
            <UButton
              size="sm"
              variant="solid"
              color="neutral"
              :loading="savingPlaylist"
              @click="savePlaylist"
            >
              Save
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              @click="
                showPlaylistInput = false;
                playlistInput = '';
              "
            >
              Cancel
            </UButton>
          </div>
        </div>
      </template>

      <p v-else class="text-xs text-neutral-500 dark:text-neutral-400">
        Connect Spotify to enable playlist and listening-based features.
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon: string;
    title: string;
    description: string;
    provider?: "telegram" | "spotify" | "soundcloud";
  }>(),
  {
    provider: "spotify",
  },
);

const isTelegram = computed(() => props.provider === "telegram");
const isSpotify = computed(() => props.provider === "spotify");

const api = useApiService();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const telegramStatus = ref<any>(null);
const linkCode = ref<any>(null);
const generatingCode = ref(false);
const codeCopied = ref(false);
const spotifyStatus = ref<any>(null);
const spotifyLoading = ref(false);
const showPlaylistInput = ref(false);
const playlistInput = ref("");
const savingPlaylist = ref(false);

const loadTelegramStatus = async () => {
  if (!isTelegram.value) return;
  try {
    telegramStatus.value = await api.call("/telegram/status");
  } catch {
    telegramStatus.value = null;
  }
};

const generateCode = async () => {
  if (!isTelegram.value || telegramStatus.value?.linked) return;
  generatingCode.value = true;
  try {
    linkCode.value = await api.call("/telegram/generate-code", {
      method: "POST",
    });
  } finally {
    generatingCode.value = false;
  }
};

const copyLinkCode = async () => {
  if (!linkCode.value?.code) return;
  await navigator.clipboard.writeText(`/link ${linkCode.value.code}`);
  codeCopied.value = true;
  setTimeout(() => {
    codeCopied.value = false;
  }, 2000);
};

const loadSpotifyStatus = async () => {
  if (!isSpotify.value) return;
  spotifyLoading.value = true;
  try {
    spotifyStatus.value = await api.call("/spotify/status");
  } catch {
    spotifyStatus.value = { linked: false };
  } finally {
    spotifyLoading.value = false;
  }
};

const connectSpotify = async () => {
  if (!isSpotify.value) return;
  spotifyLoading.value = true;
  try {
    const response = await api.call<{ url: string }>("/spotify/auth-url", {
      method: "POST",
      body: {
        // Backend can use this to return user to settings after callback.
        return_to: "/settings",
      },
    });

    if (response?.url) {
      window.location.href = response.url;
    }
  } catch (e: any) {
    toast.add({
      title: "Spotify connection failed",
      description: e?.data?.error || e?.message || "Please try again.",
      color: "error",
    });
  } finally {
    spotifyLoading.value = false;
  }
};

const disconnectSpotify = async () => {
  if (!isSpotify.value) return;
  spotifyLoading.value = true;
  try {
    await api.call("/spotify/disconnect", { method: "DELETE" });
    spotifyStatus.value = { linked: false };
    toast.add({
      title: "Spotify disconnected",
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: "Could not disconnect Spotify",
      description: e?.data?.error || e?.message || "Please try again.",
      color: "error",
    });
  } finally {
    spotifyLoading.value = false;
  }
};

const handleSpotifyCallbackStatus = async () => {
  if (!isSpotify.value) return;
  const state = route.query.spotify;
  if (state === "connected") {
    toast.add({ title: "Spotify connected", color: "success" });
    await loadSpotifyStatus();
    const query = { ...route.query };
    delete query.spotify;
    router.replace({ query });
    return;
  }

  if (state === "error") {
    toast.add({
      title: "Spotify connection failed",
      description: "Please retry the connection.",
      color: "error",
    });
    const query = { ...route.query };
    delete query.spotify;
    router.replace({ query });
  }
};

const savePlaylist = async () => {
  if (!playlistInput.value.trim()) return;
  savingPlaylist.value = true;
  try {
    await api.call("/spotify/playlist", {
      method: "PATCH",
      body: { playlist_url: playlistInput.value.trim() },
    });
    toast.add({ title: "Playlist updated", color: "success" });
    showPlaylistInput.value = false;
    playlistInput.value = "";
    await loadSpotifyStatus();
  } catch (e: any) {
    toast.add({
      title: "Could not update playlist",
      description: e?.data?.error || e?.message || "Please try again.",
      color: "error",
    });
  } finally {
    savingPlaylist.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadTelegramStatus(), loadSpotifyStatus()]);
  await handleSpotifyCallbackStatus();
});
</script>
