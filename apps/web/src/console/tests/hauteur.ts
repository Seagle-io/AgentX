import { afterEach, describe, expect, it, vi } from "vitest"
import {
	borner,
	CLE_HAUTEUR,
	ecrireHauteur,
	lireHauteur,
	pasClavier,
} from "@/console/script/hauteur"

function stub(valeur: string | null) {
	const setItem = vi.fn()
	vi.stubGlobal("localStorage", { getItem: () => valeur, setItem })
	return setItem
}

afterEach(() => vi.unstubAllGlobals())

describe("borner", () => {
	it("sous le minimum → 160", () => {
		expect(borner(50, 1000)).toBe(160)
	})
	it("au-dessus de fenêtre − 120 → plafond", () => {
		expect(borner(900, 800)).toBe(680)
	})
	it("dans l'intervalle → inchangé", () => {
		expect(borner(400, 1000)).toBe(400)
	})
	it("fenêtre < 280 → 160", () => {
		expect(borner(300, 250)).toBe(160)
	})
})

describe("pasClavier", () => {
	it("flèches ±24, autre 0", () => {
		expect(pasClavier("ArrowUp")).toBe(24)
		expect(pasClavier("ArrowDown")).toBe(-24)
		expect(pasClavier("a")).toBe(0)
	})
})

describe("mémoire", () => {
	it("lire : absent → 320", () => {
		stub(null)
		expect(lireHauteur()).toBe(320)
	})
	it("lire : « abc » → 320", () => {
		stub("abc")
		expect(lireHauteur()).toBe(320)
	})
	it("lire : « 400 » → 400", () => {
		stub("400")
		expect(lireHauteur()).toBe(400)
	})
	it("écrire : « 400 » sous agentx.termHauteur", () => {
		const setItem = stub(null)
		ecrireHauteur(400)
		expect(setItem).toHaveBeenCalledWith(CLE_HAUTEUR, "400")
	})
})
