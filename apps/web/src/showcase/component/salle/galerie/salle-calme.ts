// S1 : étage calme — 3 bureaux, 1 agent chacun, 0 arc, lampe éteinte.
import type { Box } from "@/engine/svg/iso"
import { type SalleVue, salleEtage } from "@/engine/svg/salle"

const agent = (tid: string) => ({ tid, bloque: false })

const vue: SalleVue = {
	desks: [
		{ cle: "chef", nom: "CHEF", couleur: "#3b82f6", agents: [agent("T001")] },
		{
			cle: "implementeur",
			nom: "IMPLÉMENTEUR",
			couleur: "#ff8a3d",
			agents: [agent("T002")],
		},
		{
			cle: "critique",
			nom: "CRITIQUE",
			couleur: "#ff4fd8",
			agents: [agent("T003")],
		},
	],
	flux: [],
	pipeline: { bloque: 0, enCours: 0, faits: 2 },
	abandonnees: 0,
	props: { slug: "salle-v2" },
	hovered: null,
}

const box: Box = [0, 0, 700, 480]

export default {
	id: "salle-calme",
	fn: "salleEtage",
	state:
		"3 bureaux · 3 agents · 0 bloqué · 0 arc · lampe éteinte · vault 3 LED",
	svg: salleEtage(vue)
		.replace(/^<svg[^>]*>/, "")
		.replace(/<\/svg>$/, ""),
	box,
}
