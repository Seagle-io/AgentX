import type { Role } from "@/api/state/schema"

// Deck = vault (objet du plan) + chef + rôles affectables recrutés (postes > 0)
export function deckRoles(
	roles: Role[],
	postes: Record<string, number>,
): Role[] {
	return roles.filter(
		(r) =>
			r.cle === "vault" ||
			r.cle === "chef" ||
			(r.affectable && (postes[r.cle] ?? 0) > 0),
	)
}
