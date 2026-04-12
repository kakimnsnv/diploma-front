export default defineNuxtRouteMiddleware(() => {
	const authStore = useAuthStore();

	// роль берём из стора, где уже лежит user после логина
	if (authStore.user?.role !== "admin") {
		return navigateTo("/", { replace: true });
	}
});
