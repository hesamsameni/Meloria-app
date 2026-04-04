<template>
  <div class="min-h-screen p-8 max-w-2xl mx-auto">

    <h1 class="text-3xl font-bold text-primary-500 mb-2">Meloria</h1>
    <p class="text-neutral-500 mb-8">API test page</p>

    <!-- token input -->
    <UCard class="mb-6">
      <template #header>
        <p class="font-medium">API Token</p>
      </template>
      <UInput
        v-model="token"
        placeholder="mk_test_supersecrettoken123"
        type="password"
      />
    </UCard>

    <!-- capture -->
    <UCard class="mb-6">
      <template #header>
        <p class="font-medium">Capture something</p>
      </template>

      <div class="flex flex-col gap-3">
        <UTextarea
          v-model="captureInput"
          placeholder="Paste a URL, movie title, thought..."
          :rows="3"
        />
        <div class="flex items-center gap-2">
          <USelect
            v-model="captureSource"
            :items="sources"
          />
          <UButton
            @click="capture"
            :loading="capturing"
            :disabled="!captureInput.trim() || !token"
            color="primary"
          >
            Send to brain
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="captureResult"
        class="mt-4"
        color="success"
        :title="captureResult.title || 'Saved'"
        :description="`${captureResult.category} · ${captureResult.ai_notes || ''}`"
      />

      <UAlert
        v-if="captureError"
        class="mt-4"
        color="error"
        title="Error"
        :description="captureError"
      />
    </UCard>

    <!-- fetch items -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-medium">Your items</p>
          <UButton
            @click="fetchItems"
            :loading="fetching"
            :disabled="!token"
            variant="ghost"
            size="sm"
          >
            Refresh
          </UButton>
        </div>
      </template>

      <p v-if="!token" class="text-neutral-400 text-sm">Enter your token above first</p>

      <div v-else-if="fetching" class="flex flex-col gap-2">
        <USkeleton v-for="i in 4" :key="i" class="h-14 w-full" />
      </div>

      <div v-else-if="items.length === 0" class="text-neutral-400 text-sm">
        No items yet
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-start gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900"
        >
          <span class="text-xl mt-0.5">{{ categoryEmoji(item.category) }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ item.title || item.raw_input?.slice(0, 60) }}</p>
            <p v-if="item.creator" class="text-xs text-neutral-500">{{ item.creator }}</p>
            <div class="flex gap-1.5 mt-1 flex-wrap">
              <UBadge :label="item.category" size="sm" variant="soft" />
              <UBadge :label="item.source" size="sm" variant="outline" />
            </div>
          </div>
        </div>
      </div>
    </UCard>

  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const token = ref('')
const captureInput = ref('')
const captureSource = ref('manual')
const capturing = ref(false)
const fetching = ref(false)
const captureResult = ref<any>(null)
const captureError = ref('')
const items = ref<any[]>([])

const sources = ['manual', 'instagram', 'youtube', 'x', 'shazam']

const headers = computed(() => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token.value}`
}))

const capture = async () => {
  capturing.value = true
  captureResult.value = null
  captureError.value = ''

  try {
    const data = await $fetch(`${config.public.apiUrl}/ingest`, {
      method: 'POST',
      headers: headers.value,
      body: {
        content: captureInput.value,
        input_type: 'text',
        source: captureSource.value
      }
    }) as any

    captureResult.value = data.item
    captureInput.value = ''
    await fetchItems()
  } catch (e: any) {
    captureError.value = e.data?.error || e.message || 'Something went wrong'
  } finally {
    capturing.value = false
  }
}

const fetchItems = async () => {
  fetching.value = true
  try {
    const data = await $fetch(`${config.public.apiUrl}/mcp-test/search_items`, {
      method: 'POST',
      headers: headers.value,
      body: {}
    }) as any[]
    items.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    fetching.value = false
  }
}

const categoryEmoji = (cat: string) => {
  const map: Record<string, string> = {
    movie: '🎬', music: '🎵', book: '📚', show: '📺',
    article: '📰', place: '📍', person: '👤', idea: '💡',
    note: '📝', product: '🛍️'
  }
  return map[cat] || '✦'
}

// auto-fetch when token is entered
watch(token, (val) => {
  if (val.length > 10) fetchItems()
})
</script>