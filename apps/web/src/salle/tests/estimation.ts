import { describe, expect, it } from "vitest"
import type { Estimation } from "@/api/state/schema"
import {
	detailRoles,
	etatReste,
	formatDuree,
} from "@/salle/component/EtageEstimation"

const base: Estimation = {
	ouvertes: 9,
	par_role: {
		implementeur: { ouvertes: 6, moy_min: 12.5, n_mesures: 44 },
		verificateur: { ouvertes: 3, moy_min: 7.8, n_mesures: 19 },
	},
	reste_min: 98.7,
	fiabilite: "haute",
}

describe("formatDuree", () => {
	it("98,7 → « 1 h 39 »", () => {
		expect(formatDuree(98.7)).toBe("1 h 39")
	})

	it("45 → « 45 min »", () => {
		expect(formatDuree(45)).toBe("45 min")
	})

	it("complète les minutes sur 2 chiffres", () => {
		expect(formatDuree(125)).toBe("2 h 05")
	})
})

describe("etatReste", () => {
	it("0 ouverte → rien", () => {
		expect(
			etatReste({ ...base, ouvertes: 0, par_role: {}, reste_min: 0 }),
		).toBe("rien")
	})

	it("reste_min null → indisponible", () => {
		expect(etatReste({ ...base, reste_min: null })).toBe("indisponible")
	})

	it("fiabilité ∅ → indisponible", () => {
		expect(etatReste({ ...base, fiabilite: "∅" })).toBe("indisponible")
	})

	it("reste_min connu → durée", () => {
		expect(etatReste(base)).toBe("duree")
	})
})

describe("detailRoles", () => {
	it("liste « N rôle × moy min » séparée par ·", () => {
		expect(detailRoles(base)).toBe(
			"6 implementeur × 12,5 min · 3 verificateur × 7,8 min",
		)
	})
})
