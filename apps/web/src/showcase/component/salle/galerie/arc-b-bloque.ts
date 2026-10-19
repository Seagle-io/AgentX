// T118 : B impulsion · bloqué — implémenteur → critique, 0 flèche.
import { arcScene } from "@/showcase/component/salle/galerie/arc-scene"

const { svg, box } = arcScene("bloque")

export default {
	id: "arc-b-bloque",
	fn: "arcsRelais",
	state:
		"B impulsion · bloqué · trait rouge rembobiné cible → source, clignote 2×, cycle 2,6 s",
	svg,
	box,
}
