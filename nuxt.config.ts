// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxt/a11y", "@nuxt/eslint", "@nuxt/hints", "@nuxt/image", "@nuxt/ui", "nuxt-auth-utils", "@pinia/nuxt"],
	devtools: {
		enabled: true,

		timeline: {
			enabled: true,
		},
	},
	app: {
		head: {
			title: "MRI AI",
			meta: [{ charset: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }],
		},
	},
	css: ["~/assets/css/main.css"],
	runtimeConfig: {
		public: {
			// baseURL: "https://api-mri-ai.nsnv.kz/api",
			baseURL: "http://localhost:8080/api",
		},
	},
	dir: {
		app: "app",
	},
	compatibilityDate: "2025-07-15",
	eslint: {
		config: {
			stylistic: {
				indent: "tab",
				semi: true,
				quotes: "double",
			},
		},
	},
});
