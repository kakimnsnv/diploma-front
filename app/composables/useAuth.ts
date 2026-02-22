import { jwtDecode } from "jwt-decode";

interface TokenPayload {
	user_id: number;
	role: string;
	exp: number;
}

function getTokenFromCookie(): string | null {
	if (import.meta.server) return null;

	const cookies = document.cookie.split(";");
	const authCookie = cookies.find(c => c.trim().startsWith("auth_token="));

	if (!authCookie) return null;

	return authCookie.split("=")[1]?.trim() ?? null;
}

function decodeToken(): TokenPayload | null {
	const token = getTokenFromCookie();
	if (!token) return null;
	try {
		const decoded = jwtDecode<TokenPayload>(token);
		// Проверяем не истёк ли токен
		if (decoded.exp * 1000 < Date.now()) return null;
		return decoded;
	}
	catch {
		return null;
	}
}

export const useAuth = () => {
	const authStore = useAuthStore();
	const payload = decodeToken();

	const isAuthenticated = computed(() => authStore.isLoggedIn);
	const userRole = computed(() => payload?.role ?? null);
	const userId = computed(() => payload?.user_id ?? null);
	const isAdmin = computed(() => authStore.user?.role === "admin");

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
		isAuthenticated,
		userRole,
		userId,
		isAdmin,
	};
};
