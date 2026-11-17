import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"

const taches = () => SalleStateSchema.parse(stateFixture).taches

describe("TacheSchema.chef", () => {
	it("avec chef ⇒ conservé", () => {
		expect(taches()[0].chef).toBe("marianne@MAR")
	})
	it("sans clé ⇒ absent", () => {
		expect(taches()[1].chef ?? null).toBeNull()
	})
	it("chef null ⇒ null", () => {
		const s = structuredClone(stateFixture) as { taches: object[] }
		s.taches[1] = { ...s.taches[1], chef: null }
		expect(SalleStateSchema.parse(s).taches[1].chef).toBeNull()
	})
})
