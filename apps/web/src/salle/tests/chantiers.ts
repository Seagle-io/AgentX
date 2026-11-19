import { describe, expect, it } from "vitest"
import type { SalleState } from "@/api/state/schema"
import { chantiersEtage } from "@/salle/script/chantiers"

const p = (slug: string, actif = false) => ({
	slug,
	titre: `Titre ${slug}`,
	statut: "cadrage",
	activite: "",
	encours: 1,
	revue: 0,
	bloque: 2,
	actif,
})

const etat = (projets?: ReturnType<typeof p>[], projet?: string) =>
	({
		immeuble: {
			selection: { slug: "a", projet, source: "defaut", refus: "" },
			etages: [{ slug: "a", projets }],
			sous_sol: [
				{ slug: "c1", produit: "a" },
				{ slug: "c2", produit: "b" },
				{ slug: "c3", produit: "a" },
			],
		},
	}) as unknown as SalleState

describe("chantiersEtage", () => {
	it("ordre = projets serveur, sélection marquée", () => {
		const r = chantiersEtage(etat([p("z"), p("y")], "y"), "a")
		expect(r.ouverts.map((c) => [c.slug, c.actif])).toEqual([
			["z", false],
			["y", true],
		])
		expect(r.ouverts[0]).toMatchObject({ encours: 1, bloque: 2 })
	})
	it("archives filtrées par produit", () => {
		expect(chantiersEtage(etat([p("z")]), "a").archives).toBe(2)
	})
	it("slug inconnu ⇒ vide", () => {
		expect(chantiersEtage(etat([p("z")]), "nope")).toEqual({
			ouverts: [],
			archives: 0,
		})
	})
	it("projets absent ⇒ []", () => {
		expect(chantiersEtage(etat(undefined), "a").ouverts).toEqual([])
	})
	it("projet de sélection absent ⇒ repli sur actif serveur", () => {
		const r = chantiersEtage(etat([p("z", true), p("y")]), "a")
		expect(r.ouverts.map((c) => c.actif)).toEqual([true, false])
	})
})
