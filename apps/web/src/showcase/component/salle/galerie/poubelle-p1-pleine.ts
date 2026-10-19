// T132 : corbeille P1 (grillagée, boules de papier) · n = 29.
import { poubelle } from "@/engine/svg/objets"

const { svg, box } = poubelle(0, 0, 29)

export default {
	id: "poubelle-p1-pleine",
	fn: "poubelle",
	state: "P1 · n 29",
	svg,
	box,
}
