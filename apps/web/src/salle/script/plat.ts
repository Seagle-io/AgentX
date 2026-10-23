import type { SalleState } from "@/api/state/schema"
import { COLOR_BLOCKED } from "@/engine/svg/iso"
import type {
	ChefEtat,
	Clos,
	EtageGrand,
	NiveauLum,
	ServeurPlat,
} from "@/engine/svg/plat"
import type { TourAgent } from "@/engine/svg/tour"
import { toTourVue } from "@/salle/script/tour"

export type LogoProjet = { lettres: string; teinte: number }
export type EtagePlatVue = {
	slug: string
	num: number
	titre: string
	court: string
	branche: string
	todo: number
	dormant: boolean
	selection: boolean
	lum: NiveauLum
	enCours: number
	revue: number
	bloque: number
	alerte: boolean
	alerteNiveau: string
	alerteTexte: string
	logo: LogoProjet
	agents: TourAgent[]
	agentsN: number
	serveurs: ServeurPlat[]
}
export type ImmeublePlatVue = {
	etages: EtagePlatVue[]
	clos: Clos[]
	agentsTotal: number
	toit: {
		etages: number
		todo: number
		urgent: number
		chef: ChefEtat
		chefNum: number
		chefsN: number
		contextePct: number | null
	}
}

const JAUNE = "#ffcc33"

/** Monogramme : initiales des 2 premiers mots (sinon 2 premières lettres), teinte dérivée du slug */
export function logoProjet(slug: string, titre: string): LogoProjet {
	let h = 0
	for (const ch of slug) h = (Math.imul(h, 31) + (ch.codePointAt(0) ?? 0)) >>> 0
	const mots = titre.split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean)
	const lettres = (
		mots.length > 1 ? mots[0][0] + mots[1][0] : (mots[0] ?? slug).slice(0, 2)
	).toUpperCase()
	return { lettres, teinte: h % 360 }
}

export function court(titre: string, n = 40): string {
	const a = titre.split(" : ")[0]
	return a.length > n ? `${a.slice(0, n - 1)}…` : a
}

export function chefEtat(vivant: boolean | null): ChefEtat {
	return vivant === true ? "ok" : vivant === false ? "off" : "ko"
}

export function alerteCouleur(e: EtagePlatVue): string {
	const rouge =
		e.bloque > 0 || e.alerteNiveau === "bloque" || e.alerteNiveau === "choix"
	return rouge ? COLOR_BLOCKED : JAUNE
}

export function versEtageGrand(e: EtagePlatVue): EtageGrand {
	return {
		slug: e.slug,
		num: e.num,
		court: e.court,
		agents: e.agents,
		lum: e.lum,
		selection: e.selection,
		logo: e.logo.lettres,
		logoCouleur: `oklch(72% 0.17 ${e.logo.teinte})`,
		branche: e.branche,
		enCours: e.enCours,
		revue: e.revue,
		bloque: e.bloque,
		alerte: e.alerte,
		alerteCouleur: alerteCouleur(e),
		serveurs: e.serveurs,
	}
}

/** `state.immeuble` → vue de l'immeuble à plat ; agents et compteurs via `toTourVue` (étages par rang) */
export function toImmeublePlat(
	s: SalleState,
	slugSel: string | null,
	chefCle: string,
): ImmeublePlatVue {
	const tour = toTourVue(s, slugSel)
	const bruts = new Map(s.immeuble.etages.map((e) => [e.slug, e]))
	const etages = tour.etages.map((e): EtagePlatVue => {
		const brut = bruts.get(e.slug)
		const lum: NiveauLum = e.dormant
			? "eteint"
			: e.agents.length
				? "allume"
				: "vide"
		return {
			slug: e.slug,
			num: e.num,
			titre: e.titre,
			court: court(e.titre),
			branche: brut?.branche ?? "∅",
			todo: brut?.todo ?? 0,
			dormant: e.dormant,
			selection: slugSel !== null && e.slug === slugSel,
			lum,
			enCours: e.compteurs.enCours,
			revue: e.compteurs.revue,
			bloque: e.compteurs.bloque,
			alerte: e.alerte.niveau !== "" || e.compteurs.bloque > 0,
			alerteNiveau: e.alerte.niveau,
			alerteTexte: e.alerte.texte,
			logo: logoProjet(e.slug, e.titre),
			agents: e.agents,
			agentsN: e.agents.length,
			serveurs: brut?.serveurs ?? [],
		}
	})
	const chefs = s.immeuble.chefs ?? []
	const pct = chefs.find((c) => c.cle === chefCle)?.contexte?.pct
	return {
		etages,
		clos: s.immeuble.sous_sol.map((p) => ({
			titre: p.titre,
			statut: p.statut,
			maj: p.maj,
		})),
		agentsTotal: etages.reduce((n, e) => n + e.agentsN, 0),
		toit: {
			etages: etages.length,
			todo: tour.todo,
			urgent: tour.urgent,
			chef: chefEtat(tour.chef.vivant),
			chefNum: etages.length + 1,
			chefsN: chefs.length,
			contextePct: pct == null ? null : Math.round(pct),
		},
	}
}
