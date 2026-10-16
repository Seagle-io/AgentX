// Géométrie logique : postes de la salle, objets, tour (fonctions pures)

import { LH, type Pt, TH } from "@/engine/building/iso"
import type { DeskView, FloorView } from "@/engine/building/types"

// salle
export const NX = 12
export const NY = 9
export const MUR = 5
export const X0 = 1.2
export const PAS_X = 2.25
export const Y0 = 2.0
export const CHEF: Pt = [9.9, 0.7]
export const POS_VAULT: Pt = [11.1, 4.3]

export type Objet = {
	nom: "vault" | "fusee" | "radar" | "poubelle" | "plante"
	x: number
	y: number
}
export const OBJETS: Objet[] = [
	{ nom: "vault", x: POS_VAULT[0], y: POS_VAULT[1] },
	{ nom: "fusee", x: 10.7, y: 6.4 },
	{ nom: "radar", x: 10.7, y: 7.9 },
	{ nom: "poubelle", x: 0.3, y: 6.0 },
	{ nom: "plante", x: 11.6, y: 1.4 },
	{ nom: "plante", x: 0.3, y: 3.2 },
	{ nom: "plante", x: 5.0, y: 8.6 },
	{ nom: "plante", x: 7.0, y: 8.5 },
]

// desks = affectables (ordre registre) + chef ; chef fixe
export function postesSalle(desks: DeskView[]): Record<string, Pt> {
	const aff = desks.filter((d) => d.cle !== "chef")
	const n = aff.length
	const cols = n <= 6 ? 3 : 4
	const rows = Math.ceil(n / cols)
	const pasY = rows > 1 ? Math.min(2.2, 4.4 / (rows - 1)) : 0
	const postes: Record<string, Pt> = {}
	aff.forEach((d, i) => {
		postes[d.cle] = [X0 + (i % cols) * PAS_X, Y0 + Math.floor(i / cols) * pasY]
	})
	if (desks.some((d) => d.cle === "chef")) postes.chef = CHEF
	return postes
}

// tour
export const T_NX = 7
export const T_NY = 0.7
export const T_S = 0.9
export const T_OX = 150
export const T_LX = 380
export const T_LW = 310
export const TOIT_H = 22
export const SOUS_SOL_H = 16

export function hauteurEtage(n: number): number {
	return Math.min(56, 300 / (n + 1))
}

export type Plaque = { x: number; y: number; w: number; h: number }
export type Tour = {
	hF: number
	sol: number // y px du coin (0,0) au niveau du sol
	yRef: number // y px de la face avant au sol, aligne les plaques
	toitZ: number
	toitH: number
	etages: { slug: string; zBas: number; plaque: Plaque }[] // rang 0 en haut
	sousSol: { slug: string; plaque: Plaque }[]
}

// z en px ; étage i (rang 0 en haut) occupe [zBas, zBas+hF]
export function tourLayout(
	floors: FloorView[],
	basement: { slug: string }[],
): Tour {
	const n = floors.length
	const hF = hauteurEtage(n)
	const profondeur = (T_NX + T_NY) * TH * T_S
	const total = n * hF + TOIT_H + profondeur + basement.length * SOUS_SOL_H
	const sol = (LH - total) / 2 + n * hF + TOIT_H
	const yRef = sol + (T_NX + T_NY / 2) * TH * T_S
	const etages = floors.map((f, i) => {
		const zBas = (n - 1 - i) * hF
		return {
			slug: f.slug,
			zBas,
			plaque: { x: T_LX, y: yRef - zBas - hF, w: T_LW, h: hF },
		}
	})
	const sousSol = basement.map((b, j) => ({
		slug: b.slug,
		plaque: {
			x: T_LX,
			y: yRef + j * SOUS_SOL_H + 3,
			w: T_LW,
			h: SOUS_SOL_H - 6,
		},
	}))
	return { hF, sol, yRef, toitZ: n * hF, toitH: TOIT_H, etages, sousSol }
}
