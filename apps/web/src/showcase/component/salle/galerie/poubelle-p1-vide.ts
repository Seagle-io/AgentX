// T132 : corbeille P1 (grillagée, boules de papier) · n = 0.
import { poubelle } from "@/engine/svg/objets"

const { svg, box } = poubelle(0, 0, 0)

export default {
	id: "poubelle-p1-vide",
	fn: "poubelle",
	state: "P1 · n 0",
	svg,
	box,
}
