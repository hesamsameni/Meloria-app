<template>
  <!-- Item detail -->
  <div v-if="item" class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <!-- Back link -->
    <NuxtLink
      to="/library"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to library
    </NuxtLink>

    <ItemHero :item="item" @status-change="updateStatus" />
    <ItemEmbeds :item="item" />

    <!-- Description -->
    <UCard v-if="item.description" class="mb-6">
      <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {{ item.description }}
      </p>
    </UCard>

    <ItemPlatformLinks :item="item" />

    <!-- AI notes -->
    <UCard v-if="item.ai_notes" class="mb-6">
      <div class="flex items-start gap-2">
        <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
        <p class="text-sm text-neutral-500 dark:text-neutral-400 italic">
          {{ item.ai_notes }}
        </p>
      </div>
    </UCard>

    <!-- Your notes -->
    <div class="mb-6">
      <p class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
        Your notes
      </p>
      <UTextarea
        v-model="userNotes"
        placeholder="Add your thoughts..."
        :rows="3"
        @blur="saveNotes"
      />
    </div>

    <!-- Tags -->
    <div v-if="item.tags?.length" class="mb-6">
      <p class="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">Tags</p>
      <div class="flex gap-1.5 flex-wrap">
        <UBadge
          v-for="tag in item.tags"
          :key="tag"
          :label="tag"
          size="sm"
          variant="outline"
          color="neutral"
        />
      </div>
    </div>

    <!-- Meta footer -->
    <div
      class="text-xs text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between"
    >
      <span>Saved {{ fullDate }} via {{ item.source }}</span>
      <UButton size="xs" color="error" variant="ghost" label="Delete" @click="deleteItem" />
    </div>
  </div>

  <!-- Loading skeleton -->
  <div v-else-if="loading" class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="flex gap-5 mb-8">
      <USkeleton class="w-28 h-40 rounded-xl shrink-0" />
      <div class="flex-1 flex flex-col gap-3">
        <USkeleton class="h-6 w-3/4" />
        <USkeleton class="h-4 w-1/2" />
        <USkeleton class="h-4 w-1/3" />
      </div>
    </div>
    <USkeleton class="h-32 w-full rounded-xl mb-4" />
    <USkeleton class="h-20 w-full rounded-xl" />
  </div>
</template>

<script setup lang="ts">
import { createItemsService, type Item } from '~/services/items.service'

const route = useRoute()
const router = useRouter()
const api = useApiService()
const itemsService = createItemsService(api)

const item = ref<Item | null>(null)
const loading = ref(true)
const userNotes = ref('')

const fullDate = computed(() =>
  item.value
    ? new Date(item.value.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '',
)

const updateStatus = async (status: string) => {
  if (!item.value) return
  await itemsService.updateItem(item.value.id, { status })
  item.value.status = status
}

const saveNotes = async () => {
  if (!item.value) return
  await itemsService.updateItem(item.value.id, { your_notes: userNotes.value })
}

const deleteItem = async () => {
  if (!item.value) return
  await itemsService.remove(item.value.id)
  router.push('/library')
}

onMounted(async () => {
  try {
    const data = await itemsService.getById(route.params.id as string)
    item.value = data
    userNotes.value = data.your_notes || ''
  } finally {
    loading.value = false
  }
})
</script>
