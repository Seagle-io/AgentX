// S2 : étage chargé — 6 bureaux, 9 agents dont 1 bloqué, lampe en alerte, 2 arcs.
import type { Box } from "@/engine/svg/iso"
import { type SalleVue, salleEtage } from "@/engine/svg/salle"

const agents = (ids: string[], bloques: string[] = []) =>
	ids.map((tid) => ({ tid, bloque: bloques.includes(tid) }))

const vue: SalleVue = {
	desks: [
		{ cle: "chef", nom: "CHEF", couleur: "#3b82f6", agents: agents(["T001"]) },
		{
			cle: "architecte",
			nom: "ARCHITECTE",
			couleur: "#a855f7",
			agents: agents(["T002"]),
		},
		{
			cle: "implementeur",
			nom: "IMPLÉMENTEUR",
			couleur: "#ff8a3d",
			agents: agents(["T003", "T004", "T005"], ["T004"]),
		},
		{
			cle: "verificateur",
			nom: "VÉRIFICATEUR",
			couleur: "#ff3b5c",
			agents: agents(["T006", "T007"]),
		},
		{
			cle: "testeur",
			nom: "TESTEUR",
			couleur: "#818cf8",
			agents: agents(["T008"]),
		},
		{
			cle: "critique",
			nom: "CRITIQUE",
			couleur: "#ff4fd8",
			agents: agents(["T009"]),
		},
	],
	flux: [
		{ de: "implementeur", vers: "verificateur", etat: "actif", objet: "diff" },
		{
			de: "verificateur",
			vers: "implementeur",
			etat: "bloque",
			objet: "defauts",
		},
	],
	pipeline: { bloque: 1, enCours: 4, faits: 5 },
	abandonnees: 2,
	props: { slug: "agentx" },
	hovered: null,
}

const box: Box = [0, 0, 700, 480]

export default {
	id: "salle-chargee",
	fn: "salleEtage",
	state:
		"6 bureaux · 9 agents · 1 bloqué · 2 arcs (diff actif, défauts bloqué) · lampe alerte · fusée · poubelle 2",
	svg: salleEtage(vue)
		.replace(/^<svg[^>]*>/, "")
		.replace(/<\/svg>$/, ""),
	box,
}
