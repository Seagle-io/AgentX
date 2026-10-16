import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import { deckRoles, toScene } from "@/salle/script/scene"

const etat = SalleStateSchema.parse(stateFixture)
const immeuble = etat.immeuble as NonNullable<SalleState["immeuble"]>

describe("toScene", () => {
	it("floors.length === etages.length, selected lu de selection", () => {
		const scene = toScene(etat, "building", null)
		expect(scene.floors.length).toBe(immeuble.etages.length)
		expect(scene.floors.map((f) => f.selected)).toEqual(
			immeuble.etages.map((e) => e.selection),
		)
		expect(scene.project).toBe("salle-v2")
	})

	it("enCours lu des compteurs, alerte inconnue ⇒ ''", () => {
		const scene = toScene(etat, "floor", null)
		expect(scene.floors[1].enCours).toBe(3)
		expect(scene.floors[0].enCours).toBe(0)
		expect(scene.floors[0].alerte).toBe("")
	})

	it("desks = affectable + chef, 0 vault", () => {
		const avecVault: SalleState = {
			...etat,
			roles: [...etat.roles, { ...etat.roles[0], cle: "vault" }],
		}
		const cles = toScene(avecVault, "building", null).desks.map((d) => d.cle)
		expect(cles).toEqual(["chef", "eclaireur"])
	})

	it("immeuble null ⇒ floors [], basement [], roof.todo === todo_total", () => {
		const scene = toScene({ ...etat, immeuble: null }, "building", null)
		expect(scene.floors).toEqual([])
		expect(scene.basement).toEqual([])
		expect(scene.roof).toEqual({
			chefAlive: null,
			todo: etat.todo_total,
			urgent: 0,
			alerte: "",
		})
	})

	it("roof lu du toit, basement du sous_sol", () => {
		const scene = toScene(etat, "building", null)
		expect(scene.roof).toEqual({
			chefAlive: true,
			todo: 68,
			urgent: 0,
			alerte: "",
		})
		expect(scene.basement).toEqual(
			immeuble.sous_sol.map(({ slug, titre }) => ({ slug, titre })),
		)
	})

	it("abandoned compté sur statut === 'abandonne'", () => {
		expect(toScene(etat, "building", null).abandoned).toBe(0)
		const taches = [...etat.taches, { ...etat.taches[0], statut: "abandonne" }]
		expect(toScene({ ...etat, taches }, "building", null).abandoned).toBe(1)
	})

	it("hovered et view propagés tels quels", () => {
		const scene = toScene(etat, "floor", "scribe")
		expect(scene.hovered).toBe("scribe")
		expect(scene.view).toBe("floor")
		expect(toScene(etat, "building", null).hovered).toBeNull()
	})
})

describe("deckRoles", () => {
	const scribe = { ...etat.roles[1], cle: "scribe" }
	const vault = { ...etat.roles[0], cle: "vault" }
	const roles = [...etat.roles, scribe, vault]

	it("rôle affectable sans tâche exclu", () => {
		const cles = deckRoles(roles, etat.taches).map((r) => r.cle)
		expect(cles).not.toContain("scribe")
		expect(cles).toContain("eclaireur")
	})

	it("chef et vault toujours inclus", () => {
		const cles = deckRoles(roles, []).map((r) => r.cle)
		expect(cles).toEqual(["chef", "vault"])
	})

	it("ordre de roles conservé", () => {
		const inverse = [vault, scribe, ...etat.roles]
		const cles = deckRoles(inverse, etat.taches).map((r) => r.cle)
		expect(cles).toEqual(["vault", "chef", "eclaireur"])
	})
})
