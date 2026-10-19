// T110 : fusée F1 active — flamme 2 tons 0,4 s, tremblement 2 px.
import { fusee } from "@/engine/svg/objets"

const { svg, box } = fusee(0, 0, true)

export default {
	id: "fusee-1-active",
	fn: "fusee",
	state:
		"F1 · fusée verticale, pas de tir · active, flamme 0,4 s + tremblement 2 px",
	svg,
	box,
}
