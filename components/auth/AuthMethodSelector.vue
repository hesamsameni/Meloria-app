<template>
  <div class="grid grid-cols-3 gap-2">
    <UButton
      v-for="method in methods"
      :key="method.value"
      class="w-full"
      size="sm"
      :variant="modelValue === method.value ? 'solid' : 'outline'"
      color="neutral"
      @click="$emit('update:modelValue', method.value)"
    >
      {{ method.label }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();

const methods = [
  { value: "google", label: "Google" },
  { value: "magic", label: "Magic" },
  { value: "password", label: "Email" },
];
</script>
