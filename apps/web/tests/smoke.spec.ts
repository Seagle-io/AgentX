import { expect, test } from "@playwright/test"

// Service réel (salle-v2-dev, proxy dash.py) : 0 interception réseau

test("#/ : immeuble, en-tête et liste des étages", async ({ page }) => {
	await page.goto("/#/")
	await expect(page.locator("header h1")).toBeVisible()
	await expect(page.locator("canvas")).toBeVisible()
	await expect(page.locator("nav button").first()).toBeVisible()
	expect(await page.locator("nav button").count()).toBeGreaterThanOrEqual(1)
})

test("#/floor/salle-v2 : étage, deck et jauges", async ({ page }) => {
	await page.goto("/#/floor/salle-v2")
	await expect(page.locator("canvas")).toBeVisible()
	await expect(page.locator("header h1")).toBeVisible()
	const chef = page.locator("section", { hasText: "CHEF" })
	await expect(chef.first()).toBeVisible()
	expect(await chef.count()).toBeGreaterThanOrEqual(1)
	const meters = page.locator('[role="meter"]')
	await expect(meters.first()).toBeVisible()
	expect(await meters.count()).toBeGreaterThanOrEqual(1)
})

test("#/showcase : 8 sections", async ({ page }) => {
	await page.goto("/#/showcase")
	await expect(page.locator("section[id]")).toHaveCount(8)
})
