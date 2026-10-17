// T110 : fusée F1 calme — posée sur le pas de tir, flamme éteinte.
import { fusee } from "@/engine/svg/objets"

const { svg, box } = fusee(0, 0, false)

export default {
	id: "fusee-1-calme",
	fn: "fusee",
	state: "F1 · fusée verticale, pas de tir · calme, flamme éteinte",
	svg,
	box,
}
