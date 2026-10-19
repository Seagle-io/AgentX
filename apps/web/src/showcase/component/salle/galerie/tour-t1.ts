// T130 · T1 « pleine largeur » : tour ×1,35, plaques en colonne à droite, toit terrasse.
// 2 étages (1 alerte, 1 en cours), chef en session, sous-sol 4 cartons.
import type { Box } from "@/engine/svg/iso"
import {
	hauteurTour,
	largeurTour,
	type TourVue,
	tourImmeuble,
} from "@/engine/svg/tour"

export const vue: TourVue = {
	etages: [
		{
			slug: "agentx",
			titre: "Outillage AgentX (rôles, salle)",
			num: 2,
			compteurs: { enCours: 0, revue: 3, bloque: 1 },
			alerte: { niveau: "urgent", texte: "T085 prête mais aucun agent lancé" },
			agents: [],
			selection: false,
			dormant: false,
		},
		{
			slug: "salle-v2",
			titre: "Salle des agents v2",
			num: 1,
			compteurs: { enCours: 3, revue: 1, bloque: 0 },
			alerte: { niveau: "", texte: "" },
			agents: [
				{ role: "implementeur", couleur: "#ff8a3d", bloque: false },
				{ role: "critique", couleur: "#e879f9", bloque: false },
			],
			selection: true,
			dormant: false,
		},
	],
	chef: { vivant: true },
	todo: 36,
	urgent: 5,
	sousSol: [
		{ slug: "compta", titre: "Comptabilité" },
		{ slug: "previsions", titre: "Prévisions de trésorerie" },
		{ slug: "exercices", titre: "Exercices" },
		{ slug: "ancien", titre: "Ancien projet" },
	],
}

const box: Box = [0, 0, largeurTour(), hauteurTour(2)]

export default {
	id: "tour-t1",
	fn: "tourImmeuble",
	state:
		"T1 pleine largeur · ×1,35 · plaques colonne droite · terrasse + antenne 2 LED",
	svg: tourImmeuble(vue)
		.replace(/^<svg[^>]*>/, "")
		.replace(/<\/svg>$/, ""),
	box,
}
