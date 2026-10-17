// Immeuble v2 : tour v1 en coupe dessinée par les
// fonctions de la galerie. 1 fantôme par type d'agent au travail par étage,
// yeux rouges si un agent de ce type est bloqué, props déterministes par
// slug, niveau chef, cabine, sous-sol. Chaîne SVG pure, déterministe.
import {
	boiteT,
	type ChefState,
	COUV_H,
	coiffe,
	coqueTour,
	isoT,
	type Lum,
	type P3,
	type Pt,
	polyT,
	posteTour,
	T_NX,
	T_NY,
	T_S,
	TS,
} from "@/engine/svg/coupe"
import { GLOW_DEFS, mascotte } from "@/engine/svg/fantome"
import { COLOR_BLOCKED, esc, TH, ZH } from "@/engine/svg/iso"
import { niveauPostes } from "@/engine/svg/meuble"
import {
	type Alerte,
	CHEF,
	type Compteurs,
	gaine,
	PLAQUE_W,
	PLAQUE_X,
	plaqueChef,
	plaqueEtage,
	SS,
	TERRE,
} from "@/engine/svg/plaque"
import { carton } from "@/engine/svg/props"

export type TourAgent = { role: string; couleur: string; bloque: boolean }
export type TourEtage = {
	slug: string
	titre: string
	num: number
	compteurs: Compteurs
	alerte: Alerte
	agents: TourAgent[]
	selection: boolean
	dormant: boolean
}
export type TourVue = {
	etages: TourEtage[]
	chef: { vivant: boolean | null }
	todo: number
	urgent: number
	sousSol: { slug: string; titre: string }[]
}

type Fantome = {
	role: string
	couleur: string
	travail: boolean
	bloque: boolean
}

// T130 : échelle 1,35 ; colonne de plaques à droite (viewBox 648).
// `OX` : marge gauche pour terre + gaine (x négatifs) ; `X0` : x du 1er poste.
const S = T_S * 1.35
const W = PLAQUE_X + PLAQUE_W
const OX = 88
const X0 = 2.2
const PAS = 1.5
const MAX = 4 // fantômes montrés par étage, au-delà `+N`
const RANGEE = 6 // cartons par rangée du sous-sol
const PAS_C = 1.1 // pas des cartons (cases)
const MARGE_V = 12 // px de viewBox au-dessus et au-dessous du dessin (≤ 20 px css à 1440)
const ECHELLE_C = 0.75 // props v1 → tour : taille × 0.75 (meuble.ts)

/** 1 fantôme par rôle distinct, dans l'ordre d'apparition */
export function fantomes(agents: TourAgent[]): Fantome[] {
	const par = new Map<string, Fantome>()
	for (const a of agents) {
		const f = par.get(a.role) ?? {
			role: a.role,
			couleur: a.couleur,
			travail: false,
			bloque: false,
		}
		if (a.bloque) f.bloque = true
		else f.travail = true
		par.set(a.role, f)
	}
	return [...par.values()]
}

type Geo = {
	P: P3
	hz: number
	taille: number
	h: number
	nx: number
	x0: number
}

// v1 : hF = min(56, 300/(n+1)) ; viewBox = hauteur du dessin + 2 × MARGE_V (T121).
function geometrie(n: number): Geo {
	const hF = Math.min(56, 300 / (n + 1))
	const u = ZH * S
	const nx = T_NX
	const hz = hF / u
	const haut = ((n + 1) * hz + COUV_H) * u
	const bas = (nx + 0.3 + T_NY) * TH * S + TERRE * u
	const oy = MARGE_V + haut
	return {
		P: (x, y, z = 0) => isoT(x, y, z, OX, oy, S),
		h: Math.round(haut + bas + 2 * MARGE_V),
		hz,
		nx,
		x0: X0,
		taille: Math.min(0.95, (hF - 8) / 34),
	}
}

/** hauteur du viewBox d'une tour de `n` étages */
export const hauteurTour = (n: number) => geometrie(n).h

/** largeur du viewBox */
export const largeurTour = () => W

/** fantôme d'un type : bob + frange si ≥ 1 au travail, yeux rouges glow si ≥ 1 bloqué */
function fantome(g: Geo, mx: number, my: number, f: Fantome, k: number) {
	const m = mascotte(
		mx,
		my,
		f.couleur,
		g.taille,
		k * 0.37,
		f.bloque ? COLOR_BLOCKED : undefined,
	)
	const corps = f.bloque ? `<g class="v1-bloque">${m}</g>` : m
	return `<g${f.travail ? ` class="tour-agent"` : ""} data-role="${esc(f.role)}">${corps}</g>`
}

function niveauEtage(g: Geo, e: TourEtage, z0: number) {
	const tous = fantomes(e.agents)
	const montres = tous.slice(0, MAX)
	// `+N` à droite de la tête du 4e emplacement
	const [px, py] = g.P(g.x0 + (MAX - 1) * PAS - 0.12, 0.5, z0 + TS)
	const plus =
		tous.length > MAX
			? `<text class="tour-plus" x="${(px + 12 * g.taille).toFixed(1)}" y="${(py - 18 * g.taille).toFixed(1)}">+${tous.length - MAX}</text>`
			: ""
	const lum: Lum = e.dormant ? "eteint" : tous.length ? "allume" : "vide"
	const niveau = niveauPostes(g.P, e.slug, z0, lum, {
		hz: g.hz,
		nx: g.nx,
		taille: g.taille,
		// MAX bureaux fixes, occupés ou non : décor = f(slug) seul
		xs: Array.from({ length: MAX }, (_, k) => g.x0 + k * PAS),
		ecran: false,
		postes: montres.map((f, k) => ({
			c: f.couleur,
			fantome: (mx, my) => fantome(g, mx, my, f, k),
		})),
		apres: plus,
	})
	return `<g class="tour-niveau tn-${lum}" data-slug="${esc(e.slug)}">${niveau.svg}</g>`
}

/** v1 niveau direction : poste + fantôme du chef */
function niveauChef(g: Geo, z0: number, k: ChefState) {
	const lum: Lum = k === "ok" ? "allume" : k === "off" ? "eteint" : "vide"
	const c = k === "ko" ? "#5d6880" : CHEF
	const zs = z0 + TS
	const x = g.nx * 0.45
	const [mx, my] = g.P(x - 0.12, 0.5, zs)
	const dedans = `${posteTour(g.P, x, zs, g.taille, c, k === "ok", false)}<g class="tour-chef ${k}">${mascotte(mx, my + 2 * g.taille, c, g.taille)}</g>`
	return `<g class="tour-niv-direction tn-${lum}" style="--c:${c}">${coqueTour(g.P, z0, g.hz, TS, lum, dedans, g.nx)}</g>`
}

/** sous-sol en coupe : terre hachurée, 1 carton nu par projet clos (titre au survol, T110), 2 rangées de 6 */
function sousSol(g: Geo, clos: { slug: string; titre: string }[]) {
	const terre = polyT(g.P, [
		[-1.2, T_NY, 0],
		[g.nx + 0.3, T_NY, 0],
		[g.nx + 0.3, T_NY, -TERRE],
		[-1.2, T_NY, -TERRE],
	])
	const sol: Pt[] = [
		[-1.2, T_NY, 0],
		[g.nx + 0.3, T_NY, 0],
	]
	const zs = -SS + TS
	const s = g.taille * ECHELLE_C
	const d = carton(0, 0)
	const cx = (d.box[0] + d.box[2]) / 2
	const pied = d.box[3] - 4
	// fond d'abord : la rangée avant recouvre l'arrière
	const cartons = clos
		.slice(0, 2 * RANGEE)
		.map((p, k) => ({ p, k, rang: Math.floor(k / RANGEE) }))
		.sort((a, b) => b.rang - a.rang)
		.map(({ p, k, rang }) => {
			const [tx, ty] = g.P(
				0.4 + (k % RANGEE) * PAS_C,
				0.15 + (1 - rang) * 0.25,
				zs,
			)
			return `<g class="tour-carton" data-slug="${esc(p.slug)}"><title>${esc(p.titre)}</title><g transform="translate(${(tx - cx * s).toFixed(1)},${(ty - pied * s).toFixed(1)}) scale(${s.toFixed(3)})">${d.svg}</g></g>`
		})
		.join("")
	return `<polygon points="${terre}" fill="url(#tour-hachure)"/>
    ${coqueTour(g.P, -SS, SS, TS, "vide", cartons, g.nx)}
    <polyline points="${polyT(g.P, sol)}" fill="none" stroke="#262c3e" stroke-width="1.4"/>`
}

const HACHURE = `<pattern id="tour-hachure" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#262c3e" stroke-width="1.2"/></pattern>`

/** tour complète ; étage `etages[0]` en haut, sous le chef (rang v1)  */
export function tourImmeuble(vue: TourVue): string {
	const n = vue.etages.length
	const g = geometrie(n)
	const z = (i: number) => (n - 1 - i) * g.hz
	const k: ChefState =
		vue.chef.vivant === null ? "ko" : vue.chef.vivant ? "ok" : "off"
	const sel = vue.etages.findIndex((e) => e.selection)
	// peints de bas en haut (v1) : le mur d'un niveau ne masque pas les fantômes du dessus
	const niveaux = vue.etages
		.map((e, i) => niveauEtage(g, e, z(i)))
		.reverse()
		.join("")
	const plaques = vue.etages
		.map((e, i) => plaqueEtage(g.P, z(i), g.hz, e))
		.join("")
	return `<svg class="v1-scene" viewBox="0 0 ${W} ${g.h}" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:auto">
  <defs>${GLOW_DEFS}${HACHURE}</defs>
  <g class="v1-tour">
    ${sousSol(g, vue.sousSol)}
    ${niveaux}
    ${niveauChef(g, n * g.hz, k)}
    ${boiteT(g.P, 0, 0, (n + 1) * g.hz, g.nx, T_NY, COUV_H, "#232a3c")}
    ${coiffe(g.P, (n + 1) * g.hz + COUV_H, g.nx, k)}
    ${gaine(g.P, n + 1, g.hz, sel < 0 ? 0 : n - 1 - sel)}
    ${plaqueChef(g.P, n * g.hz, g.hz, n + 1, k, vue.todo, vue.urgent)}
    ${plaques}
  </g>
</svg>`
}
