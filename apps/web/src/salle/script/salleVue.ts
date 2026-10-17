import type { Role, SalleState } from "@/api/state/schema"
import type { AgentVue, SalleVue } from "@/engine/svg/salle"
import { deckRoles } from "@/salle/script/deck"

const compte = (s: SalleState, k: string) =>
	s.pipeline.find((p) => p.k === k)?.n ?? 0

// 1 fantôme par agent de l'étage sélectionné ; sans étage, `actifs` du registre.
// Chef : 1 fantôme comme v1, 0 si la session est morte.
function agentsDe(s: SalleState, r: Role): AgentVue[] {
	if (r.cle === "chef")
		return s.immeuble?.toit.chef.vivant === false
			? []
			: [{ tid: "", bloque: false }]
	const etage = s.immeuble?.etages.find((e) => e.selection)
	if (!etage)
		return Array.from({ length: r.actifs }, () => ({ tid: "", bloque: false }))
	const bloquees = new Set(
		s.taches.filter((t) => t.statut === "bloque").map((t) => t.id),
	)
	return etage.agents
		.filter((a) => a.role === r.cle)
		.map(({ tid }) => ({ tid, bloque: bloquees.has(tid) }))
}

/** `faitsPrecedent` : faits du rendu précédent (null au 1er) ; un fait de plus ⇒ flash du vault */
export function toSalleVue(
	s: SalleState,
	hovered: string | null,
	faitsPrecedent: number | null = null,
): SalleVue {
	const faits = compte(s, "fait")
	// rôles avec ≥ 1 tâche + chef ; le vault du deck est un objet, pas un bureau
	const desks = deckRoles(s.roles, s.taches)
		.filter((r) => r.cle !== "vault")
		.map((r) => ({
			cle: r.cle,
			nom: r.nom,
			couleur: r.couleur,
			agents: agentsDe(s, r),
		}))
	const occupe = new Set(
		desks.filter((d) => d.agents.length > 0).map((d) => d.cle),
	)
	return {
		desks,
		// un arc vit vers un bureau occupé ; source sans agent ⇒ le pack part du vault
		flux: s.flux.flatMap(({ de, vers, etat, objet }) => {
			const vivant = etat === "actif" || etat === "bloque"
			if (vivant && !occupe.has(vers)) return []
			return [
				{ de: vivant && !occupe.has(de) ? "vault" : de, vers, etat, objet },
			]
		}),
		pipeline: {
			bloque: compte(s, "bloque"),
			enCours: compte(s, "en-cours"),
			faits,
			flash: faitsPrecedent !== null && faits > faitsPrecedent,
			parStatut: s.pipeline,
		},
		abandonnees: s.taches.filter((t) => t.statut === "abandonne").length,
		props: { slug: s.projet.slug },
		hovered,
	}
}
