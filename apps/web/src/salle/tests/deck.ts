import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import { deckRoles } from "@/salle/script/deck"

const etat = SalleStateSchema.parse(stateFixture)

describe("deckRoles", () => {
	const scribe = { ...etat.roles[1], cle: "scribe" }
	const vault = { ...etat.roles[0], cle: "vault" }
	const roles = [...etat.roles, scribe, vault]

	it("rôle sans poste exclu, rôle recruté inclus", () => {
		const cles = deckRoles(roles, { eclaireur: 1 }).map((r) => r.cle)
		expect(cles).not.toContain("scribe")
		expect(cles).toContain("eclaireur")
	})

	it("chef et vault toujours inclus", () => {
		const cles = deckRoles(roles, {}).map((r) => r.cle)
		expect(cles).toEqual(["chef", "vault"])
	})

	it("ordre de roles conservé", () => {
		const inverse = [vault, scribe, ...etat.roles]
		const cles = deckRoles(inverse, { eclaireur: 1 }).map((r) => r.cle)
		expect(cles).toEqual(["vault", "chef", "eclaireur"])
	})
})
