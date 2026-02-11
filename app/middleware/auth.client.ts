export default defineNuxtRouteMiddleware(async (to, from) => {
	const { getProfile } = useAuth();
	const authStore = useAuthStore();

	if (authStore.isLoggedIn) {
		if (to.path.startsWith("/auth")) {
			return navigateTo(from.path);
		}
	}

	if (!authStore.isLoggedIn) {
		const user = await getProfile();
		if (user !== null) {
			if (to.query.redirect !== undefined) {
				return navigateTo(to.query.redirect as string);
			}
		}

		if (!to.path.startsWith("/auth")) {
			return navigateTo({
				path: "/auth/login",
				query: { redirect: to.fullPath },
			});
		}
	}
});
