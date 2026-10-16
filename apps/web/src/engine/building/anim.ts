// Animations autorisées : colis (1 passage par arc) et cabine ; boucle via frame injecté, arrêt au repos

import type { BuildingInput } from "@/engine/building/types"

export const DUREE_COLIS = { actif: 2400, livre: 4200 } as const
export const DUREE_CABINE = 600

type Colis = { debut: number | null; duree: number }
type Cabine = { de: number; vers: number; debut: number | null }

export type Animateur = {
	colis(cle: string, duree: number): void
	cabine(vers: number): void // position cible (z px) ; 1ʳᵉ fois ⇒ directe
	etat(): { colis: Map<string, number>; cabine: number | null }
	demarrer(): void // lance la boucle si ≥ 1 animation vit
	destroy(): void
}

const lisser = (p: number) => 1 - (1 - p) * (1 - p)

// progression 0..1 par colis ; colis terminé ⇒ retiré
function avancerColis(
	colis: Map<string, Colis>,
	progression: Map<string, number>,
	t: number,
) {
	for (const [cle, c] of colis) {
		c.debut ??= t
		const p = (t - c.debut) / c.duree
		if (p >= 1) {
			colis.delete(cle)
			progression.delete(cle)
		} else progression.set(cle, p)
	}
}

export function creerAnimateur(
	frame: BuildingInput["frame"],
	reducedMotion: boolean,
	redessiner: () => void,
): Animateur {
	const colis = new Map<string, Colis>()
	const progression = new Map<string, number>()
	let cabine: Cabine | null = null
	let cabinePos: number | null = null
	let id: number | null = null

	const vivant = () => colis.size > 0 || cabine !== null

	function tick(t: number) {
		avancerColis(colis, progression, t)
		if (cabine) {
			cabine.debut ??= t
			const p = Math.min(1, (t - cabine.debut) / DUREE_CABINE)
			cabinePos = cabine.de + (cabine.vers - cabine.de) * lisser(p)
			if (p >= 1) cabine = null
		}
		redessiner()
		if (vivant()) id = frame.request(tick)
		else {
			if (id !== null) frame.cancel(id)
			id = null
		}
	}

	return {
		colis(cle, duree) {
			if (reducedMotion) return
			colis.set(cle, { debut: null, duree })
		},
		cabine(vers) {
			if (reducedMotion || cabinePos === null) {
				cabinePos = vers
				cabine = null
				return
			}
			if (vers !== (cabine?.vers ?? cabinePos))
				cabine = { de: cabinePos, vers, debut: null }
		},
		etat: () => ({ colis: progression, cabine: cabinePos }),
		demarrer() {
			if (id === null && vivant()) id = frame.request(tick)
		},
		destroy() {
			if (id !== null) frame.cancel(id)
			id = null
			colis.clear()
			progression.clear()
			cabine = null
		},
	}
}
