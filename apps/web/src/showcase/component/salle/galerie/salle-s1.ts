// T128 S1 « atelier » : 11 bureaux, 3 agents, 1 arc, pipeline 7 statuts ; plinthe, grille α .18,
// bureaux pieds + chant, ombre 3 ellipses, tableau pipeline mur y = 0.
import type { Box } from "@/engine/svg/iso"
import { type SalleVue, salleEtage } from "@/engine/svg/salle"

const un = (tid: string) => [{ tid, bloque: false }]
const desk = (cle: string, nom: string, couleur: string, tid = "") => ({
	cle,
	role: cle,
	provisoire: false,
	nom,
	couleur,
	agents: tid ? un(tid) : [],
})

export const vue: SalleVue = {
	desks: [
		desk("chef", "CHEF", "#3b82f6", "T001"),
		desk("eclaireur", "ÉCLAIREUR", "#22e07a"),
		desk("architecte", "ARCHITECTE", "#a855f7"),
		desk("designer", "DESIGNER", "#e879f9"),
		desk("implementeur", "IMPLÉMENTEUR", "#ff8a3d", "T002"),
		desk("testeur", "TESTEUR", "#818cf8"),
		desk("verificateur", "VÉRIFICATEUR", "#ff3b5c", "T003"),
		desk("critique", "CRITIQUE", "#ff4fd8"),
		desk("relecteur", "RELECTEUR", "#2de2e6"),
		desk("securite", "SÉCURITÉ", "#ffcc33"),
		desk("evaluateur", "ÉVALUATEUR", "#7c8aa6"),
	],
	flux: [
		{ de: "implementeur", vers: "verificateur", etat: "actif", objet: "diff" },
	],
	pipeline: {
		bloque: 0,
		enCours: 2,
		faits: 12,
		parStatut: [
			{ k: "a-faire", n: 4 },
			{ k: "pret", n: 2 },
			{ k: "en-cours", n: 2 },
			{ k: "revue", n: 1 },
			{ k: "bloque", n: 0 },
			{ k: "fait", n: 12 },
			{ k: "abandonne", n: 1 },
		],
	},
	abandonnees: 1,
	props: { slug: "salle-v2" },
	hovered: null,
}

const box: Box = [0, 0, 700, 480]

export default {
	id: "salle-s1",
	fn: "salleEtage S1",
	state:
		"atelier · 11 bureaux · 3 agents · 1 arc · plinthe · grille α .18 /3 · pieds + chant · tableau mur y=0",
	svg: salleEtage(vue, true, "S1")
		.replace(/^<svg[^>]*>/, "")
		.replace(/<\/svg>$/, ""),
	box,
}
