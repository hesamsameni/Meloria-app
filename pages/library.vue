<template>
  <div class="max-w-2xl mx-auto px-6 py-10">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
        Library
      </h1>
      <p class="text-sm text-neutral-400 mt-0.5">Everything you've captured</p>
    </div>

    <!-- filters -->
    <div class="flex flex-col gap-3 mb-6">
      <UInput
        v-model="search"
        placeholder="Search by title or creator…"
        icon="i-lucide-search"
      />

      <div class="flex items-center gap-1.5 flex-wrap">
        <UButton
          v-for="cat in categories"
          :key="cat.value"
          size="xs"
          :variant="activeCategory === cat.value ? 'solid' : 'outline'"
          :color="activeCategory === cat.value ? 'primary' : 'neutral'"
          @click="
            activeCategory = activeCategory === cat.value ? '' : cat.value
          "
        >
          {{ cat.emoji }} {{ cat.label }}
        </UButton>
      </div>

      <div class="flex items-center gap-1.5">
        <UButton
          v-for="s in statuses"
          :key="s.value"
          size="xs"
          :variant="activeStatus === s.value ? 'solid' : 'ghost'"
          :color="activeStatus === s.value ? 'primary' : 'neutral'"
          @click="activeStatus = s.value"
        >
          {{ s.label }}
          <UBadge
            v-if="statusCount(s.value)"
            :label="String(statusCount(s.value))"
            size="xs"
            class="ml-1"
          />
        </UButton>
      </div>
    </div>

    <ItemList
      :items="filtered"
      :loading="items.loading.value"
      :show-status="true"
      empty-message="No items match your filters"
      @status-change="items.updateStatus"
    />
  </div>
</template>

<script setup lang="ts">
const items = useItems();

const search = ref("");
const activeCategory = ref("");
const activeStatus = ref("all");

const categories = [
  { value: "movie", label: "Movies", emoji: "🎬" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "book", label: "Books", emoji: "📚" },
  { value: "show", label: "Shows", emoji: "📺" },
  { value: "article", label: "Articles", emoji: "📰" },
  { value: "idea", label: "Ideas", emoji: "💡" },
];

const statuses = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const filtered = computed(() =>
  items.items.value.filter((item: any) => {
    const matchSearch =
      !search.value ||
      item.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      item.creator?.toLowerCase().includes(search.value.toLowerCase());
    const matchCat =
      !activeCategory.value || item.category === activeCategory.value;
    const matchStatus =
      activeStatus.value === "all" || item.status === activeStatus.value;
    return matchSearch && matchCat && matchStatus;
  }),
);

const statusCount = (status: string) =>
  status === "all"
    ? items.items.value.length
    : items.items.value.filter((i: any) => i.status === status).length;

onMounted(() => items.fetch());
</script>
