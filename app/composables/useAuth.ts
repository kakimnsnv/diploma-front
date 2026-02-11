export const useAuth = () => {
	const authStore = useAuthStore();

	const { error: logoutError, execute: logoutExecute } = useAPIFetch("/logout", {
		method: "POST",
	});

	const { data: profileData, execute: profileExecute } = useAPIFetch<User>("/profile", {
		method: "GET",
	});

	const getProfile = async () => {
		await profileExecute();
		if (profileData.value) {
			authStore.setUser(profileData.value);
			return profileData.value;
		}
		else {
			authStore.clearUser();
			return null;
		}
	};

	const logout = async () => {
		await logoutExecute();
		if (!logoutError.value) {
			authStore.clearUser();
		}
	};

	watch(() => authStore.cookiesChecked, (newVal) => {
		if (newVal) {
			getProfile();
		}
	}, { immediate: true });

	return {
		getProfile,
		logout,
	};
};
