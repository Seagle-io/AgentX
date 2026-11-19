import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import { lireSondes, vueActivite, vueNav } from "@/salle/script/activite"

const base = SalleStateSchema.parse(stateFixture)

const etat = (extra: Record<string, unknown>): SalleState =>
	({ ...base, ...extra }) as unknown as SalleState

const immeuble = {
	...base.immeuble,
	etages: [
		{ slug: "a", num: 1, titre: "A", compteurs: { "en-cours": 2, revue: 1 } },
		{ slug: "b", num: 3, titre: "B", compteurs: { bloque: 4 } },
		{ slug: "c", num: 2, titre: "C", compteurs: {} },
	],
	sous_sol: [{ slug: "z" }, { slug: "y" }],
}
const choix = (etage: string) => ({
	etiquette: "VOTRE CHOIX",
	etage,
	projet: etage,
})

describe("vueNav", () => {
	const s = etat({ immeuble, todo: [choix("a"), choix("a"), choix("c")] })

	it("tri num décroissant, compteurs, clos", () => {
		const v = vueNav(s, null)
		expect(v.etages.map((e) => e.slug)).toEqual(["b", "c", "a"])
		expect(v.etages[0]).toMatchObject({ bloque: 4, enCours: 0, revue: 0 })
		expect(v.etages[2]).toMatchObject({ enCours: 2, revue: 1, bloque: 0 })
		expect(v.clos).toBe(2)
	})

	it("choix par étage, sélection", () => {
		const v = vueNav(s, "a")
		expect(v.etages.map((e) => e.choix)).toEqual([0, 1, 2])
		expect(v.etages.map((e) => e.selection)).toEqual([false, false, true])
	})
})

describe("lireSondes", () => {
	it("absent ⇒ []", () => expect(lireSondes({})).toEqual([]))
	it("valide", () => {
		const sondes = [{ nom: "prod", etat: "ko", detail: "503" }]
		expect(lireSondes({ sondes })).toEqual(sondes)
	})
	it("sonde invalide ⇒ []", () =>
		expect(
			lireSondes({ sondes: [{ nom: "p", etat: "?", detail: "" }] }),
		).toEqual([]))
})

describe("vueActivite", () => {
	const s = etat({
		immeuble,
		roles: [{ cle: "implementeur", couleur: "#123456" }],
		agents: [
			{ tid: "T1", role: "implementeur", projet: "a", vivant: true },
			{ tid: "T2", role: "testeur", projet: "zz", vivant: true },
			{ tid: "T3", role: "testeur", projet: "a", vivant: false },
		],
		evenements: [1, 2, 3, 4, 5, 6].map((i) => ({
			id: `e${i}`,
			t: `10:0${i}`,
			role: "r",
			tid: `T${i}`,
			statut: "revue",
		})),
		supervision: { sondes: [{ nom: "p", etat: "ok", detail: "" }] },
		voix: { journal: [{ t: "x", texte: "y" }] },
	})

	it("vivants, couleur, étage", () => {
		expect(vueActivite(s).vivants).toEqual([
			{ tid: "T1", role: "implementeur", couleur: "#123456", etageNum: 1 },
			{ tid: "T2", role: "testeur", couleur: "#8a8a8a", etageNum: null },
		])
	})

	it("5 derniers rendus, récent d'abord ; sondes ; voix", () => {
		const v = vueActivite(s)
		expect(v.rendus.map((r) => r.id)).toEqual(["e6", "e5", "e4", "e3", "e2"])
		expect(v.sondes).toHaveLength(1)
		expect(v.voix).toBe(1)
	})

	it("voix null ⇒ 0", () =>
		expect(vueActivite(etat({ voix: null })).voix).toBe(0))
})
