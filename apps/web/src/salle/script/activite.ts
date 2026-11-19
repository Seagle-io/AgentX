import { z } from "zod"
import type { SalleState } from "@/api/state/schema"
import { selectChoix } from "@/todo/script/select"

export type EtageNav = {
	slug: string
	num: number
	titre: string
	enCours: number
	revue: number
	bloque: number
	choix: number
	selection: boolean
}
export type NavVue = { etages: EtageNav[]; clos: number }

/** Étages par num décroissant ; `etage` = étage sélectionné (null sur la boîte) */
export function vueNav(s: SalleState, etage: string | null): NavVue {
	const etages = [...s.immeuble.etages]
		.sort((a, b) => b.num - a.num)
		.map(
			(e): EtageNav => ({
				slug: e.slug,
				num: e.num,
				titre: e.titre,
				enCours: e.compteurs["en-cours"] ?? 0,
				revue: e.compteurs.revue ?? 0,
				bloque: e.compteurs.bloque ?? 0,
				choix: selectChoix(s, e.slug).length,
				selection: e.slug === etage,
			}),
		)
	return { etages, clos: s.immeuble.sous_sol.length }
}

const SondeSchema = z.object({
	nom: z.string(),
	etat: z.enum(["ok", "warn", "ko"]),
	detail: z.string(),
})
export type Sonde = z.infer<typeof SondeSchema>

/** `supervision.sondes` validé ; absent ou invalide ⇒ [] */
export function lireSondes(sup: Record<string, unknown>): Sonde[] {
	const r = z.array(SondeSchema).safeParse(sup.sondes)
	return r.success ? r.data : []
}

export type ActiviteVue = {
	vivants: {
		tid: string
		role: string
		couleur: string
		etageNum: number | null
	}[]
	sondes: Sonde[]
	rendus: {
		id: string
		t: string
		role: string
		tid: string
		statut: string
	}[]
	voix: number
}

const GRIS = "#8a8a8a"

export function vueActivite(s: SalleState): ActiviteVue {
	const couleur = new Map(s.roles.map((r) => [r.cle, r.couleur]))
	const num = new Map(s.immeuble.etages.map((e) => [e.slug, e.num]))
	return {
		vivants: s.agents
			.filter((a) => a.vivant === true)
			.map((a) => ({
				tid: a.tid,
				role: a.role,
				couleur: couleur.get(a.role) ?? GRIS,
				etageNum: num.get(a.etage || a.projet) ?? null,
			})),
		sondes: lireSondes(s.supervision),
		rendus: s.evenements
			.slice(-5)
			.reverse()
			.map((e) => ({
				id: e.id,
				t: e.t,
				role: e.role,
				tid: e.tid,
				statut: e.statut,
			})),
		voix: s.voix?.journal.length ?? 0,
	}
}
