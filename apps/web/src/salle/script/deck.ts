import type { Role, Tache } from "@/api/state/schema"

// Rôles affectables ayant ≥ 1 tâche sur l'étage, + chef (decisions.md#2026-10-16)
function rolesUtilises(roles: Role[], taches: Tache[]): Role[] {
	const occupes = new Set(taches.map((t) => t.role))
	return roles.filter(
		(r) => r.cle === "chef" || (r.affectable && occupes.has(r.cle)),
	)
}

// Deck = rôles utilisés + vault (objet du plan)
export function deckRoles(roles: Role[], taches: Tache[]): Role[] {
	const utilises = new Set(rolesUtilises(roles, taches).map((r) => r.cle))
	return roles.filter((r) => r.cle === "vault" || utilises.has(r.cle))
}
