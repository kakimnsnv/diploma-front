<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { registerSchema, type RegisterSchema } from "~/schemas/auth";

definePageMeta({
	layout: "auth",
});

const fields: AuthFormField[] = [{
	name: "email",
	type: "email",
	label: "Email",
	placeholder: "Enter your email",
	required: true,
}, {
	name: "password",
	label: "Password",
	type: "password",
	placeholder: "Enter your password",
	required: true,
}, {
	name: "name",
	label: "Name",
	type: "text",
	placeholder: "Enter your name",
	required: true,
}];

const authStore = useAuthStore();
const route = useRoute();

const registerRequestBody = ref<RegisterSchema | null>(null);
const { data, pending, error, execute } = useAPIFetch<AuthResponse>("/register", {
	method: "POST",
	body: registerRequestBody,
});

async function onSubmit(payload: FormSubmitEvent<RegisterSchema>) {
	registerRequestBody.value = payload.data;
	await execute();

	if (!error.value) {
		if (data.value) {
			authStore.user = data.value.user;
			navigateTo(route.query.redirect ? route.query.redirect as string : "/");
		}
	}
}
</script>

<template>
	<div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
		<UPageCard class="w-full max-w-md">
			<UAuthForm
				:schema="registerSchema"
				:fields="fields"
				title="Welcome back!"
				icon="i-lucide-lock"
				:loading="pending"
				:disabled="pending"
				@submit="onSubmit"
			>
				<template #description>
					Already have an account? <ULink
						to="/auth/login"
						class="text-primary font-medium"
					>Sign in</ULink>.
				</template>
				<template #password-hint>
					<ULink
						to="#"
						class="text-primary font-medium"
						tabindex="-1"
					>Forgot password?</ULink>
				</template>
				<template #validation>
					<UAlert
						v-if="error"
						color="error"
						icon="i-lucide-info"
						title="Error registering"
						:description="error.data?.error"
					/>
				</template>
				<template #footer>
					By registering, you agree to our <ULink
						to="#"
						class="text-primary font-medium"
					>Terms of Service</ULink>.
				</template>
			</UAuthForm>
		</UPageCard>
	</div>
</template>
