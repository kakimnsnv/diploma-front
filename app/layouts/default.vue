<script setup lang="ts">
import type { Chat } from '~/types/chat'

const {isLoggedIn} = useAuth()

const {ago} = useDate()

const open = ref(false)

const { data: chats, refresh: refreshChats, execute } = await useAPIFetch<Chat[]>('/history', {
  key: 'history',
  immediate: true,
  transform: chats => chats.map(chat => ({
    to: `/${chat.id}`,
    icon: 'i-lucide-message-circle',
    label: `${chat.id}: ${ago(chat.created_at)}`,
    avatar: {
      src: chat.original_image_url,
      alt: chat.original_image_url
    },
  }))
})

execute()

watch(isLoggedIn, () => {
  refreshChats()

  open.value = false
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="bg-elevated/50"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-0.5">
          <NuxtImg src="/brain.png" class="h-8 w-auto shrink-0"/>
          <span v-if="!collapsed" class="text-xl font-bold text-highlighted">MRI AI</span>
        </NuxtLink>

        <div v-if="!collapsed" class="flex items-center gap-1.5 ms-auto">
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'New chat' }"
            variant="soft"
            block
            to="/"
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSidebarCollapse />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          color="primary"
          variant="pill"
          :items="chats"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu v-if="isLoggedIn" :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>