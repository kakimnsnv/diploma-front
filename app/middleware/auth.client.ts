export default defineNuxtRouteMiddleware(async (to, from) => {
	const { getProfile } = useAuth();
	const authStore = useAuthStore();

	// Если стор пустой — сначала пробуем получить профиль
	if (!authStore.isLoggedIn) {
		const user = await getProfile();

		// Если получили юзера и есть redirect query
		if (user !== null) {
			if (to.query.redirect !== undefined) {
				return navigateTo(to.query.redirect as string);
			}
			return; // пускаем дальше
		}

		// Профиль не получили — редирект на логин
		if (!to.path.startsWith("/auth")) {
			return navigateTo({
				path: "/auth/login",
				query: { redirect: to.fullPath },
			});
		}

		return;
	}

	// Стор уже заполнен — не пускаем на /auth страницы
	if (to.path.startsWith("/auth")) {
		return navigateTo(from.path || "/");
	}
});
