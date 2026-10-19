import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: "tests",
	use: {
		baseURL: process.env.SALLE_URL ?? "http://127.0.0.1:5174",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
