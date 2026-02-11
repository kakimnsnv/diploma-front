export const useAuthStore = defineStore("auth", {
	state: () => ({
		user: null as User | null,
		cookiesChecked: false,
	}),
	getters: {
		isLoggedIn: state => !!state.user,
	},
	actions: {
		setUser(data: User) {
			this.user = data;
			this.cookiesChecked = true;
		},
		clearUser() {
			this.user = null;
			this.cookiesChecked = false;
		},
	},
});
