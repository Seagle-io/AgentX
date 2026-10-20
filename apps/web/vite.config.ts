/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Cible du proxy : le serveur Python de la salle (dash.py)
const api = process.env.SALLE_API ?? "http://127.0.0.1:7777"

export default defineConfig({
	// dist/ est servi par dash.py à la racine d'un autre port
	base: "./",
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	build: {
		rolldownOptions: {
			output: {
				// sort les libs stables de index-*.js (cache navigateur, < 500 kB)
				codeSplitting: {
					groups: [
						{
							name: "vendor-react",
							test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
							priority: 2,
						},
						{
							name: "vendor-libs",
							test: /node_modules[\\/](@tanstack|i18next|react-i18next|zod|zustand)[\\/]/,
							priority: 1,
						},
					],
				},
			},
		},
	},
	server: {
		proxy: {
			"/state.json": api,
			"/api": api,
		},
	},
	test: {
		// tests dans <module>/tests/, fichiers sans suffixe
		include: ["src/**/tests/**/*.ts"],
	},
})
