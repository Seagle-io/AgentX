import type { Role, SalleState, Tache } from "@/api/state/schema"
import type { TourVue } from "@/engine/svg/tour"

// Champs lus : `SalleState` s'y assigne ; les tests n'écrivent que ceux-là.
type Source = Pick<SalleState, "immeuble"> & {
	roles: Pick<Role, "cle" | "couleur">[]
	taches: Pick<Tache, "id" | "statut">[]
	projet: Pick<SalleState["projet"], "slug">
}

const GRIS = "#7c8aa6" // rôle absent du registre

/**
 * `state.immeuble` → vue de la tour. Étages par rang
 * (rang 0 en haut). Bloqué par agent : `s.taches` ne couvre que l'étage
 * courant (`s.projet`) ; ailleurs inconnu ⇒ `false`, le blocage se lit sur
 * le gyro d'étage (`compteurs.bloque`).
 */
export function toTourVue(s: Source, lastFloor: string | null = null): TourVue {
	const im = s.immeuble
	// cabine = dernier étage visité s'il existe encore ; sinon sélection serveur
	// (sur `#/` le serveur désigne déjà un étage par défaut : il ne prime pas)
	const visite = im.etages.some((e) => e.slug === lastFloor)
	const couleur = new Map(s.roles.map((r) => [r.cle, r.couleur]))
	const bloquees = new Set(
		s.taches.filter((t) => t.statut === "bloque").map((t) => t.id),
	)
	const etages = [...im.etages]
		.sort((a, b) => a.rang - b.rang)
		.map((e) => ({
			slug: e.slug,
			titre: e.titre,
			num: e.num,
			compteurs: {
				enCours: e.compteurs["en-cours"] ?? 0,
				revue: e.compteurs.revue ?? 0,
				bloque: e.compteurs.bloque ?? 0,
			},
			alerte: { niveau: e.alerte.niveau, texte: e.alerte.texte },
			agents: e.agents.map((a) => ({
				role: a.role,
				couleur: couleur.get(a.role) ?? GRIS,
				bloque: e.slug === s.projet.slug && bloquees.has(a.tid),
			})),
			selection: visite ? e.slug === lastFloor : e.selection,
			dormant: e.dormant,
		}))
	return {
		etages,
		chef: { vivant: im.toit.chef.vivant },
		todo: im.toit.todo,
		urgent: im.toit.urgent,
		sousSol: im.sous_sol.map((p) => ({ slug: p.slug, titre: p.titre })),
	}
}
