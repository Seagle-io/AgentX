// T118 : B impulsion · actif — implémenteur → critique, 0 flèche.
import { arcScene } from "@/showcase/component/salle/galerie/arc-scene"

const { svg, box } = arcScene("actif")

export default {
	id: "arc-b-actif",
	fn: "arcsRelais",
	state:
		"B impulsion · actif · dessin 1,2 s ease-out, tenue 0,4 s, extinction 0,6 s → .15, glyphe 8 px 0,4 s, cycle 2,6 s",
	svg,
	box,
}
