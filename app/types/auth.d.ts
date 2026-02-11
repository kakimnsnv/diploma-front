declare global {

	interface AuthResponse {
		user: User;
		token: string;
	};
}

export {};
