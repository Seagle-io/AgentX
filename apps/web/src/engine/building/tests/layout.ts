import { describe, expect, it } from "vitest"
import {
	CHEF,
	hauteurEtage,
	PAS_X,
	postesSalle,
	tourLayout,
	X0,
	Y0,
} from "@/engine/building/layout"
import type { DeskView, FloorView } from "@/engine/building/types"

const bureaux = (n: number): DeskView[] =>
	Array.from({ length: n }, (_, i) => ({
		cle: `r${i}`,
		nom: `R${i}`,
		couleur: "rgb(10 20 30)",
		actifs: 0,
		actif: false,
	}))
const chef: DeskView = {
	cle: "chef",
	nom: "Chef",
	couleur: "rgb(1 2 3)",
	actifs: 1,
	actif: true,
}
const etages = (n: number): FloorView[] =>
	Array.from({ length: n }, (_, i) => ({
		slug: `p${i}`,
		titre: `P${i}`,
		num: i,
		dormant: false,
		selected: i === 0,
		agents: [],
		enCours: 0,
		alerte: "",
	}))
const distincts = (postes: Record<string, [number, number]>, axe: 0 | 1) =>
	new Set(Object.values(postes).map((p) => p[axe])).size

describe("postesSalle", () => {
	it("6 postes ⇒ 3 colonnes, 2 lignes", () => {
		const p = postesSalle(bureaux(6))
		expect(distincts(p, 0)).toBe(3)
		expect(distincts(p, 1)).toBe(2)
		expect(p.r0).toEqual([X0, Y0])
		expect(p.r3[0]).toBe(p.r0[0])
		expect(p.r4[0]).toBeCloseTo(X0 + PAS_X)
	})
	it("12 postes ⇒ 4 colonnes, 3 lignes, PAS_Y = 2.2", () => {
		const p = postesSalle(bureaux(12))
		expect(distincts(p, 0)).toBe(4)
		expect(distincts(p, 1)).toBe(3)
		expect(p.r4[1]).toBeCloseTo(Y0 + 2.2)
	})
	it("chef fixe, hors grille", () => {
		const p = postesSalle([...bureaux(3), chef])
		expect(p.chef).toEqual(CHEF)
		expect(p.r2).toEqual([X0 + 2 * PAS_X, Y0])
		expect(Object.keys(p)).toHaveLength(4)
	})
	it("1 ligne ⇒ PAS_Y = 0", () => {
		const p = postesSalle(bureaux(3))
		expect(distincts(p, 1)).toBe(1)
	})
})

describe("tour", () => {
	it("hF : n=3 ⇒ 56, n=12 ⇒ 300/13", () => {
		expect(hauteurEtage(3)).toBe(56)
		expect(hauteurEtage(12)).toBeCloseTo(300 / 13)
	})
	it("rang 0 en haut : zBas décroît, plaque y croît", () => {
		const t = tourLayout(etages(3), [{ slug: "x" }])
		expect(t.etages[0].zBas).toBeCloseTo(2 * t.hF)
		expect(t.etages[2].zBas).toBe(0)
		expect(t.etages[0].plaque.y).toBeLessThan(t.etages[2].plaque.y)
		expect(t.sousSol[0].plaque.y).toBeGreaterThan(t.etages[2].plaque.y)
	})
})
