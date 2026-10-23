import { describe, expect, it } from "vitest"
import { bornerLargeur, largeurDepuisGlisse } from "@/console/script/largeur"

describe("bornerLargeur", () => {
	it("sous le minimum → 360", () => {
		expect(bornerLargeur(100)).toBe(360)
	})
	it("au-dessus du maximum → 900", () => {
		expect(bornerLargeur(2000)).toBe(900)
	})
	it("dans l'intervalle → inchangé", () => {
		expect(bornerLargeur(500)).toBe(500)
	})
})

describe("largeurDepuisGlisse", () => {
	it("glisse vers la gauche agrandit", () => {
		expect(largeurDepuisGlisse(480, 1000, 900)).toBe(580)
	})
	it("glisse vers la droite réduit", () => {
		expect(largeurDepuisGlisse(480, 1000, 1060)).toBe(420)
	})
	it("borné aux deux bouts", () => {
		expect(largeurDepuisGlisse(480, 1000, 0)).toBe(900)
		expect(largeurDepuisGlisse(480, 1000, 1500)).toBe(360)
	})
})
