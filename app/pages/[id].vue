<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <div v-if="pending">
        <USkeleton class="h-48 w-full mb-8" />
        <USkeleton class="h-48 w-full" />
      </div>

      <div v-if="!pending && chat" class="space-y-4 h-full">
        <div class="flex flex-col md:flex-row gap-4">
          <NuxtImg :src="chat?.original_image_url" alt="Original" class="aspect-square w-full md:w-1/2 mx-auto" />
          <NuxtImg :src="chat?.result_image_url" alt="Result" class="aspect-square w-full md:w-1/2 mx-auto" />
        </div>
          <UButton
            block
            to="/"
            label="New chat"
          />
      </div>

      <div v-if="!pending && error">
        <UError :error="error" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Chat } from '~/types/chat'

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: chat, pending, error, execute } = await useAPIFetch<Chat>(
  () => `/results/${id.value}`,
  {
    key: () => `results-${id.value}`,
  }
)

execute()


</script>