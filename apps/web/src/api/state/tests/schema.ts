import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import {
	RunBodySchema,
	SalleStateSchema,
	StateErreurSchema,
} from "@/api/state/schema"

const base = SalleStateSchema.parse(stateFixture)

describe("SalleStateSchema", () => {
	it("parse la fixture relevée", () => {
		expect(base.projet.slug).toBe("salle-v2")
		expect(base.jeton).toBe("0".repeat(32))
		expect(Object.keys(base)).toHaveLength(23)
	})

	it("accepte immeuble: null et voix: null (démo)", () => {
		const etat = SalleStateSchema.parse({ ...base, immeuble: null, voix: null })
		expect(etat.immeuble).toBeNull()
		expect(etat.voix).toBeNull()
	})

	it("ignore une clé inconnue (strip)", () => {
		const etat = SalleStateSchema.parse({ ...base, inconnue: 1 })
		expect("inconnue" in etat).toBe(false)
	})

	it("replie flux[0].etat inconnu sur 'attente' (catch)", () => {
		const flux = [{ ...base.flux[0], etat: "zzz" }]
		const etat = SalleStateSchema.parse({ ...base, flux })
		expect(etat.flux[0]?.etat).toBe("attente")
	})

	// relevés GET state.json?projet=<slug> (.sorties/salle-v2/T016) ; {} en CI sans salle ⇒ skip
	const reels = import.meta.glob<unknown>(
		"../../../../../../.sorties/salle-v2/T016/etat-*.json",
		{ eager: true, import: "default" },
	)
	const chemins = Object.keys(reels)
	it.skipIf(chemins.length === 0)(
		"parse les états réels complets relevés",
		() => {
			for (const chemin of chemins) {
				const res = SalleStateSchema.safeParse(reels[chemin])
				expect(res.success, `${chemin} : ${res.error?.message}`).toBe(true)
			}
		},
	)

	it("accepte un pipeline de 7 entrées sans 'abandonne'", () => {
		const cles = [
			"a-faire",
			"pret",
			"en-cours",
			"revue",
			"bloque",
			"fait",
			"rejete",
		]
		const pipeline = cles.map((k) => ({ k, n: 0 }))
		const etat = SalleStateSchema.parse({ ...base, pipeline })
		expect(etat.pipeline).toHaveLength(7)
		expect(etat.pipeline.some((p) => p.k === "abandonne")).toBe(false)
	})
})

describe("StateErreurSchema", () => {
	it("accepte {erreur: 'x'}", () => {
		expect(StateErreurSchema.parse({ erreur: "x" })).toEqual({ erreur: "x" })
	})

	it("refuse un état complet", () => {
		expect(StateErreurSchema.safeParse(base).success).toBe(false)
	})
})

describe("RunBodySchema", () => {
	it("accepte set T001 agentx pret", () => {
		const body = {
			action: "set",
			tid: "T001",
			projet: "agentx",
			statut: "pret",
		}
		expect(RunBodySchema.parse(body)).toEqual(body)
	})

	it("refuse {}", () => {
		expect(RunBodySchema.safeParse({}).success).toBe(false)
	})

	it("refuse un motif de 201 caractères", () => {
		const body = {
			action: "virer",
			tid: "T001",
			projet: "agentx",
			motif: "a".repeat(201),
		}
		expect(RunBodySchema.safeParse(body).success).toBe(false)
	})
})
