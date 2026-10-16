// Arcs de relais entre postes (calcul pur) + dessin

import { PLATEAU } from "@/engine/building/hit"
import { contourBoite, iso, type Pt } from "@/engine/building/iso"
import { POS_VAULT } from "@/engine/building/layout"
import type {
	BuildingPalette,
	FluxView,
	PaletteKey,
} from "@/engine/building/types"

type Etat = FluxView["etat"]
export const RANG_ETAT: Record<Etat, number> = {
	attente: 0,
	livre: 1,
	actif: 2,
	bloque: 3,
}
export const COULEUR_ETAT: Record<Etat, PaletteKey> = {
	attente: "border",
	livre: "accent",
	actif: "success",
	bloque: "error",
}
export const OPACITE_ETAT: Record<Etat, number> = {
	attente: 0.3,
	livre: 0.7,
	actif: 0.95,
	bloque: 0.95,
}
const ECHANTILLONS = 101
const HAUT_MASCOTTES = 28

export type Boite = { x: number; y: number; w: number; h: number }
export type Arc = {
	cle: string
	de: string
	vers: string
	etat: Etat
	objet: string
	a: Pt
	m: Pt
	b: Pt
}

// point d'accroche d'un poste
export function ancre([gx, gy]: Pt): Pt {
	return iso(gx + 0.75, gy + 0.45, 1.3)
}

// boîte px du bureau (plateau + mascottes au-dessus)
export function boiteBureau([gx, gy]: Pt): Boite {
	const pts = contourBoite(gx, gy, PLATEAU.z, PLATEAU.w, PLATEAU.d, PLATEAU.h)
	const xs = pts.map((p) => p[0])
	const ys = pts.map((p) => p[1])
	const x = Math.min(...xs)
	const y = Math.min(...ys) - HAUT_MASCOTTES
	return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

export function bezier(a: Pt, m: Pt, b: Pt, t: number): Pt {
	const u = 1 - t
	return [
		u * u * a[0] + 2 * u * t * m[0] + t * t * b[0],
		u * u * a[1] + 2 * u * t * m[1] + t * t * b[1],
	]
}

function dansBoite([px, py]: Pt, b: Boite): boolean {
	return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h
}

// nb d'échantillons de la courbe tombant dans une boîte
export function compterDansBoites(
	a: Pt,
	m: Pt,
	b: Pt,
	boites: Boite[],
): number {
	let n = 0
	for (let i = 0; i < ECHANTILLONS; i++) {
		const p = bezier(a, m, b, i / (ECHANTILLONS - 1))
		if (boites.some((bo) => dansBoite(p, bo))) n++
	}
	return n
}

// milieu quadratique : 9 candidats, le moins de points dans les boîtes tierces
export function choisirMilieu(a: Pt, b: Pt, tiers: Boite[]): Pt {
	const h = 42 + Math.abs(b[0] - a[0]) * 0.14
	const cx = (a[0] + b[0]) / 2
	const cy = (a[1] + b[1]) / 2
	const offsets: Pt[] = [
		[0, -h],
		[0, 0],
		[0, h],
		[h, 0],
		[-h, 0],
		[0, -2 * h],
		[0, 2 * h],
		[2 * h, 0],
		[-2 * h, 0],
	]
	let meilleur: Pt = [cx, cy]
	let min = Number.POSITIVE_INFINITY
	for (const [dx, dy] of offsets) {
		const m: Pt = [cx + dx, cy + dy]
		const n = compterDansBoites(a, m, b, tiers)
		if (n < min) {
			min = n
			meilleur = m
		}
	}
	return meilleur
}

// 1 arc par couple de>vers au rang max ; vers==="scribe" ⇒ départ vault
export function arcsRelais(
	flux: FluxView[],
	postes: Record<string, Pt>,
): Arc[] {
	const tous: Record<string, Pt> = {
		...postes,
		vault: postes.vault ?? POS_VAULT,
	}
	const parCouple = new Map<string, FluxView>()
	for (const f of flux) {
		const depart = f.vers === "scribe" ? "vault" : f.de
		if (!tous[depart] || !tous[f.vers]) continue
		const cle = `${f.de}>${f.vers}`
		const prec = parCouple.get(cle)
		if (!prec || RANG_ETAT[f.etat] > RANG_ETAT[prec.etat]) parCouple.set(cle, f)
	}
	const boites = Object.entries(tous).map(([cle, p]) => ({
		cle,
		boite: boiteBureau(p),
	}))
	return [...parCouple.entries()].map(([cle, f]) => {
		const depart = f.vers === "scribe" ? "vault" : f.de
		const a = ancre(tous[depart])
		const b = ancre(tous[f.vers])
		const tiers = boites
			.filter((bo) => bo.cle !== depart && bo.cle !== f.vers)
			.map((bo) => bo.boite)
		return {
			cle,
			de: f.de,
			vers: f.vers,
			etat: f.etat,
			objet: f.objet,
			a,
			m: choisirMilieu(a, b, tiers),
			b,
		}
	})
}

function pastille(
	ctx: CanvasRenderingContext2D,
	[x, y]: Pt,
	r: number,
	fill: string,
	bord: string,
) {
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2)
	ctx.fillStyle = fill
	ctx.fill()
	ctx.strokeStyle = bord
	ctx.lineWidth = 1.5
	ctx.stroke()
}

// colis : progression 0..1 par clé d'arc
export function dessinerArcs(
	ctx: CanvasRenderingContext2D,
	arcs: Arc[],
	palette: BuildingPalette,
	colis: Map<string, number>,
) {
	for (const arc of arcs) {
		const couleur = palette[COULEUR_ETAT[arc.etat]]
		ctx.globalAlpha = OPACITE_ETAT[arc.etat]
		ctx.strokeStyle = couleur
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.moveTo(arc.a[0], arc.a[1])
		ctx.quadraticCurveTo(arc.m[0], arc.m[1], arc.b[0], arc.b[1])
		ctx.stroke()
		pastille(ctx, arc.b, 3, couleur, palette.bg)
		if (arc.etat === "bloque")
			pastille(
				ctx,
				bezier(arc.a, arc.m, arc.b, 0.5),
				7,
				palette.error,
				palette.bg,
			)
		const p = colis.get(arc.cle)
		if (p !== undefined)
			pastille(ctx, bezier(arc.a, arc.m, arc.b, p), 5, couleur, palette.bg)
	}
	ctx.globalAlpha = 1
}
