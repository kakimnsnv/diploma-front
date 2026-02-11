<script setup lang="ts">
const authStore = useAuthStore();
const route = useRoute();
const { getProfile } = useAuth();

if (!authStore.cookiesChecked) {
	getProfile();
}

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
	if (isLoggedIn) {
		navigateTo(route.query.redirect ? route.query.redirect as string : "/");
	}
}, { immediate: true });
</script>

<template>
	<div class="min-h-screen">
		<slot />
	</div>
</template>
