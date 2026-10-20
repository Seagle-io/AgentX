import type { Demande, SalleState } from "@/api/state/schema"

export const DEMANDE_COURT = 120

// Espaces aplatis ; au-delà de 120 car. : 119 + « … » (le texte complet va dans `title`)
export const courtDemande = (texte: string): string => {
	const plat = texte.replace(/\s+/g, " ").trim()
	return plat.length > DEMANDE_COURT
		? `${plat.slice(0, DEMANDE_COURT - 1)}…`
		: plat
}

// Global : le serveur ne rattache pas les demandes à un étage
export const selectDemandes = (
	s: SalleState,
): { items: Demande[]; total: number } => ({
	items: s.demandes,
	total: s.demandes_total,
})
