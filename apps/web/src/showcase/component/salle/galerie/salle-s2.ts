// T128 S2 « studio » : même étage que S1 ; murs unis + LED au sol, grille en points,
// plateau 5 px sans pied, ombre rectangle iso α .2, tableau pipeline mur x = 0.
import type { Box } from "@/engine/svg/iso"
import { salleEtage } from "@/engine/svg/salle"
import { vue } from "@/showcase/component/salle/galerie/salle-s1"

const box: Box = [0, 0, 700, 480]

export default {
	id: "salle-s2",
	fn: "salleEtage S2",
	state:
		"studio · 11 bureaux · 3 agents · 1 arc · LED accent α .5 · grille points · plateau 5 px · tableau mur x=0",
	svg: salleEtage(vue, true, "S2")
		.replace(/^<svg[^>]*>/, "")
		.replace(/<\/svg>$/, ""),
	box,
}
