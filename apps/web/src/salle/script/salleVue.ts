import type { Role, SalleState } from "@/api/state/schema"
import type { AgentVue, DeskVue, SalleVue } from "@/engine/svg/salle"

const compte = (s: SalleState, k: string) =>
	s.pipeline.find((p) => p.k === k)?.n ?? 0

// 1 fantôme par agent de l'étage sélectionné (triés projet, tid) ; sans étage, `actifs` du registre.
function agentsDe(s: SalleState, r: Role): AgentVue[] {
	const etage = s.immeuble?.etages.find((e) => e.selection)
	if (!etage)
		return Array.from({ length: r.actifs }, () => ({ tid: "", bloque: false }))
	const bloquees = new Set(
		s.taches.filter((t) => t.statut === "bloque").map((t) => t.id),
	)
	return etage.agents
		.filter((a) => a.role === r.cle)
		.sort(
			(a, b) =>
				(a.projet ?? "").localeCompare(b.projet ?? "") ||
				a.tid.localeCompare(b.tid),
		)
		.map((a) => ({
			tid: a.tid,
			bloque: bloquees.has(a.tid) || a.etat === "bloque",
			rendu: a.etat === "rendu",
		}))
}

// chef, puis par rôle (ordre registre) : postes `role#k` occupés dans l'ordre, surplus ⇒ 1 provisoire `role#x`
function desksDe(s: SalleState): DeskVue[] {
	const postes =
		s.immeuble?.etages.find((e) => e.selection)?.effectif?.postes ?? {}
	const desks: DeskVue[] = []
	for (const r of s.roles) {
		// le vault du deck est un objet, pas un bureau
		if (r.cle === "vault") continue
		const base = { role: r.cle, nom: r.nom, couleur: r.couleur }
		if (r.cle === "chef") {
			desks.push({
				...base,
				cle: "chef",
				agents:
					s.immeuble?.toit.chef.vivant === false
						? []
						: [{ tid: "", bloque: false }],
				provisoire: false,
			})
			continue
		}
		const p = postes[r.cle] ?? 0
		const agents = agentsDe(s, r)
		for (let k = 0; k < p; k++)
			desks.push({
				...base,
				cle: `${r.cle}#${k}`,
				agents: agents.slice(k, k + 1),
				provisoire: false,
			})
		if (agents.length > p)
			desks.push({
				...base,
				cle: `${r.cle}#x`,
				agents: agents.slice(p),
				provisoire: true,
			})
	}
	return desks
}

/** `faitsPrecedent` : faits du rendu précédent (null au 1er) ; un fait de plus ⇒ flash du vault */
export function toSalleVue(
	s: SalleState,
	hovered: string | null,
	faitsPrecedent: number | null = null,
): SalleVue {
	const faits = compte(s, "fait")
	const desks = desksDe(s)
	// 1er desk du rôle avec agent, sinon son 1er desk (`#0`) ; rôle sans desk ⇒ null
	const bureauDe = (role: string) => {
		if (role === "vault") return "vault"
		const du = desks.filter((d) => d.role === role)
		return (du.find((d) => d.agents.length > 0) ?? du[0])?.cle ?? null
	}
	const occupe = new Set(
		desks.filter((d) => d.agents.length > 0).map((d) => d.cle),
	)
	return {
		desks,
		// un arc vit vers un bureau occupé ; source sans agent ⇒ le pack part du vault
		flux: s.flux.flatMap(({ de, vers, etat, objet }) => {
			const vivant = etat === "actif" || etat === "bloque"
			const a = bureauDe(vers)
			const b = bureauDe(de)
			if (a === null || (vivant && !occupe.has(a))) return []
			if (b === null && !vivant) return []
			const source = b === null || (vivant && !occupe.has(b)) ? "vault" : b
			return [{ de: source, vers: a, etat, objet }]
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
