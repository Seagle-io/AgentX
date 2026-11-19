import type { SalleState } from "@/api/state/schema"
import { court } from "@/salle/script/plat"

export type ChantierVue = {
	slug: string
	titre: string
	court: string
	encours: number
	revue: number
	bloque: number
	actif: boolean
}
export type ChantiersEtage = { ouverts: ChantierVue[]; archives: number }

/** chantiers de l'étage (ordre serveur) + nombre de clos du produit ; sélection = `immeuble.selection.projet`, repli `actif` serveur */
export function chantiersEtage(s: SalleState, slug: string): ChantiersEtage {
	const etage = s.immeuble.etages.find((e) => e.slug === slug)
	const choisi = s.immeuble.selection?.projet
	const ouverts = (etage?.projets ?? []).map((p) => ({
		slug: p.slug,
		titre: p.titre,
		court: court(p.titre),
		encours: p.encours,
		revue: p.revue,
		bloque: p.bloque,
		actif: choisi ? p.slug === choisi : p.actif,
	}))
	const archives = s.immeuble.sous_sol.filter((p) => p.produit === slug).length
	return { ouverts, archives }
}
