export default defineNuxtRouteMiddleware(async () => {
	// На сервере auth стор пустой — пропускаем, проверка будет на клиенте
	if (import.meta.server) return;

	const authStore = useAuthStore();

	// Если профиль ещё не загружен — подождём
	if (!authStore.isLoggedIn) {
		const { getProfile } = useAuth();
		await getProfile();
	}

	if (authStore.user?.role !== "admin") {
		return navigateTo("/", { replace: true });
	}
});
