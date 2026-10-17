import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import { selectPipeline } from "@/pipeline/script/select"

const state = SalleStateSchema.parse(stateFixture)
const ks = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait", "rejete"]
const sept = ks.map((k, i) => ({ k, n: [4, 0, 2, 8, 1, 3, 0][i] ?? 0 }))

describe("selectPipeline", () => {
	it("7 barres, ordre serveur", () => {
		const { bars } = selectPipeline({ ...state, pipeline: sept })
		expect(bars).toHaveLength(7)
		expect(bars.map((b) => b.k)).toEqual(ks)
		expect(bars.map((b) => b.n)).toEqual(sept.map((b) => b.n))
	})

	it("ratio max = 1", () => {
		const { bars } = selectPipeline({ ...state, pipeline: sept })
		expect(Math.max(...bars.map((b) => b.ratio))).toBe(1)
		expect(bars[3]?.ratio).toBe(1)
		expect(bars[0]?.ratio).toBe(0.5)
	})

	it("tout à 0 ⇒ ratios 0", () => {
		const zero = ks.map((k) => ({ k, n: 0 }))
		const { bars } = selectPipeline({ ...state, pipeline: zero })
		expect(bars.map((b) => b.ratio)).toEqual(ks.map(() => 0))
	})

	it("0 seuils dans la vue", () => {
		expect(Object.keys(selectPipeline(state))).toEqual(["bars"])
	})
})
