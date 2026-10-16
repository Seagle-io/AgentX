import type { Role, SalleState, Tache } from "@/api/state/schema"
import type { BuildingScene, FloorView } from "@/engine/building"
import type { SalleView } from "@/shared/lib/store/salle"

// `FloorView.alerte` est fermé : tout niveau inconnu (`sonde`…) tombe à "".
const alerte = (niveau: string): FloorView["alerte"] =>
	niveau === "bloque" || niveau === "urgent" ? niveau : ""

export function toScene(
	s: SalleState,
	view: SalleView,
	hovered: string | null,
): BuildingScene {
	const immeuble = s.immeuble
	return {
		view,
		project: s.projet.slug,
		floors: (immeuble?.etages ?? []).map((e) => ({
			slug: e.slug,
			titre: e.titre,
			num: e.num,
			dormant: e.dormant,
			selected: e.selection,
			agents: e.agents,
			enCours: e.compteurs["en-cours"] ?? 0,
			alerte: alerte(e.alerte.niveau),
		})),
		basement: (immeuble?.sous_sol ?? []).map(({ slug, titre }) => ({
			slug,
			titre,
		})),
		roof: immeuble
			? {
					chefAlive: immeuble.toit.chef.vivant,
					todo: immeuble.toit.todo,
					urgent: immeuble.toit.urgent,
					alerte: immeuble.toit.alerte.texte,
				}
			: { chefAlive: null, todo: s.todo_total, urgent: 0, alerte: "" },
		// Plan de salle = registre complet ; le filtre par tâche est réservé au deck.
		desks: s.roles
			.filter((r) => r.affectable || r.cle === "chef")
			.map(({ cle, nom, couleur, actifs, actif }) => ({
				cle,
				nom,
				couleur,
				actifs,
				actif,
			})),
		flux: s.flux.map(({ de, vers, etat, objet }) => ({
			de,
			vers,
			etat,
			objet,
		})),
		pipeline: s.pipeline,
		serie: { points: s.serie.points, valeur: s.serie.valeur },
		abandoned: s.taches.filter((t) => t.statut === "abandonne").length,
		hovered,
	}
}

// Deck = rôles affectables ayant ≥ 1 tâche sur l'étage, + chef + vault (decisions.md#2026-10-16)
export function deckRoles(roles: Role[], taches: Tache[]): Role[] {
	const occupes = new Set(taches.map((t) => t.role))
	return roles.filter(
		(r) =>
			r.cle === "chef" ||
			r.cle === "vault" ||
			(r.affectable && occupes.has(r.cle)),
	)
}
