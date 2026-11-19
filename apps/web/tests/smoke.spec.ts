import { expect, test } from "@playwright/test"

// Service réel (salle-v2-dev, proxy dash.py) : 0 interception réseau

test("#/ : immeuble, en-tête et liste des étages", async ({ page }) => {
	await page.goto("/#/")
	await expect(page.locator("header h1")).toBeVisible()
	await expect(
		page.locator('[data-testid="vignette-immeuble"] svg').first(),
	).toBeVisible()
	await expect(page.locator("nav button").first()).toBeVisible()
	expect(await page.locator("nav button").count()).toBeGreaterThanOrEqual(1)
})

test("#/floor/agentx : boîte de décisions et barre d'étage", async ({
	page,
}) => {
	await page.goto("/#/floor/agentx")
	await expect(page.locator("header h1")).toBeVisible()
	await expect(page.locator('[data-testid="boite-decisions"]')).toBeVisible()
	await expect(page.locator('[data-testid="barre-etage"]')).toBeVisible()
	await expect(
		page.locator('nav button[aria-current="true"]').first(),
	).toBeVisible()
})

test("#/showcase : 9 sections", async ({ page }) => {
	await page.goto("/#/showcase")
	await expect(page.locator("section[id]")).toHaveCount(9)
})
