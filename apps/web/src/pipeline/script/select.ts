import type { SalleState } from "@/api/state/schema"

type Bar = { k: string; n: number; ratio: number }
type PipelineView = { bars: Bar[] }

// ratio relatif au max : la barre la plus haute vaut 1, tout à 0 ⇒ 0
export const selectPipeline = (s: SalleState): PipelineView => {
	const max = Math.max(1, ...s.pipeline.map((b) => b.n))
	return {
		bars: s.pipeline.map(({ k, n }) => ({ k, n, ratio: n / max })),
	}
}

export type { Bar, PipelineView }
