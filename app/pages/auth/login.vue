<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { loginSchema, type LoginSchema } from '~/schemas/auth'
import type { AuthResponse } from '~/types/auth'

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}]

const {user} = useAuth()

const loginRequestBody = ref<LoginSchema | null>(null)
const { data, pending, error, execute } = useAPIFetch<AuthResponse>("/login", {
      method: "POST",
      body: loginRequestBody,
    })

async function onSubmit(payload: FormSubmitEvent<LoginSchema>) {
  loginRequestBody.value = payload.data
  await execute()

  if (!error.value) {
    if (data.value){
      user.value = data.value.user
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="loginSchema"
        :fields="fields"
        title="Welcome back!"
        icon="i-lucide-lock"
        :loading="pending"
        :disabled="pending"
        @submit="onSubmit"
      >
        <template #description>
          Don't have an account? <ULink to="/auth/register" class="text-primary font-medium">Sign up</ULink>.
        </template>
        <template #password-hint>
          <ULink to="#" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
        </template>
        <template #validation>
          <UAlert color="error" icon="i-lucide-info" title="Error signing in" v-if="error" :description="error.data?.error" />
        </template>
        <template #footer>
          By signing in, you agree to our <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>