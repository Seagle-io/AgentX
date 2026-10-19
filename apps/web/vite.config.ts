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
