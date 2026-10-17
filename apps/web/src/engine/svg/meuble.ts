// Props de décor d'un niveau de la tour (T090) : 1 à 3 props de la galerie,
// tirage déterministe par slug, posés sur le sol du niveau, jamais sur un
// poste ni un fantôme, entièrement dans la coupe du niveau.
import {
	boiteT,
	boxT,
	COUV_H,
	coqueTour,
	HZ,
	isoT,
	type Lum,
	type P3,
	posteTour,
	T_NX,
	T_NY,
	T_S,
	TS,
} from "@/engine/svg/coupe"
import { mascotte, mascotteBox } from "@/engine/svg/fantome"
import { type Box, type Drawn, ROLE_COLORS, union, ZH } from "@/engine/svg/iso"
import {
	aquarium,
	cafe,
	cartons,
	etagere,
	extincteur,
	imprimante,
	lampe,
	plante1,
	plante2,
	plante3,
	tableau,
} from "@/engine/svg/props"

type Prop = (gx: number, gy: number) => Drawn

export type NiveauCtx = {
	/** emprises écran des emplacements (bureau + fantôme, présents ou non : décor = f(slug)) */
	occupes: Box[]
	/** z du plafond */
	haut: number
	/** dimensions du sol (x, y) */
	nx: number
	ny: number
}

const ECHELLE = 0.75 // props v1 (TW 32) → tour : taille × 0.75
const PROFONDEUR = 0.35 // y du pied des props sur le sol
const DECALAGES = [-1.6, 1.1, 3.0, 3.9] // 4 emplacements relatifs à x0
const MARGE = 1.5

const liste = (): Prop[] => [
	plante1,
	plante2,
	plante3,
	cartons,
	etagere,
	extincteur,
	imprimante,
	aquarium,
	cafe,
	lampe,
	tableau,
]

/** h = Σ code · 31^i mod 2^32 (Horner) */
export const hashSlug = (s: string) => {
	let h = 0
	for (const ch of s) h = (Math.imul(h, 31) + (ch.codePointAt(0) ?? 0)) >>> 0
	return h
}

/** xorshift32 seedé (T121 : le LCG donnait des ordres voisins pour des slugs proches) */
const rng = (seed: number) => {
	let s = seed >>> 0 || 1
	return () => {
		s ^= s << 13
		s >>>= 0
		s ^= s >>> 17
		s ^= s << 5
		s >>>= 0
		return s / 2 ** 32
	}
}

/** Fisher-Yates seedé */
const melanger = <T>(a: T[], r: () => number) => {
	const b = [...a]
	for (let i = b.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1))
		;[b[i], b[j]] = [b[j], b[i]]
	}
	return b
}

// y de la polyligne (abscisses croissantes) à l'abscisse sx, bornée aux extrémités
const ligneY = (pts: [number, number][], sx: number) => {
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1]
		const [bx, by] = pts[i]
		if (sx <= bx || i === pts.length - 1) {
			const t = Math.min(1, Math.max(0, (sx - ax) / (bx - ax)))
			return ay + (by - ay) * t
		}
	}
	return 0
}

const croise = (a: Box, b: Box) =>
	a[0] < b[2] + MARGE &&
	a[2] > b[0] - MARGE &&
	a[1] < b[3] + MARGE &&
	a[3] > b[1] - MARGE

/** Emprise ⊂ coupe du niveau : sous le plafond, au-dessus du bord avant du sol. */
export function dansNiveau(P: P3, zs: number, c: NiveauCtx, b: Box) {
	const haut: [number, number][] = [
		P(0, c.ny, c.haut),
		P(0, 0, c.haut),
		P(c.nx, 0, c.haut),
	]
	const bas: [number, number][] = [
		P(0, c.ny, zs),
		P(c.nx, c.ny, zs),
		P(c.nx, 0, zs),
	]
	const [gauche] = bas[0]
	const [droite] = bas[2]
	return (
		b[0] >= gauche &&
		b[2] <= droite &&
		b[1] >= Math.max(ligneY(haut, b[0]), ligneY(haut, b[2])) &&
		b[3] <= Math.min(ligneY(bas, b[0]), ligneY(bas, b[2]))
	)
}

/**
 * 1 à 3 props (sans doublon) sur le sol d'un niveau.
 * `x0` : x du 1er poste ; emplacements = x0 + DECALAGES. Rendu identique
 * pour (slug, zs) donnés.
 */
export function propsNiveau(
	slug: string,
	P: P3,
	x0: number,
	zs: number,
	taille: number,
	ctx: NiveauCtx,
) {
	const h = hashSlug(`${slug}@${zs.toFixed(2)}`)
	const r = rng(h)
	const n = 1 + (h % 3)
	const s = taille * ECHELLE
	const emplacements = melanger(
		DECALAGES.map((d) => x0 + d),
		r,
	)
	const poses: Box[] = []
	let svg = ""
	for (const fn of melanger(liste(), r)) {
		if (poses.length >= n) break
		const d = fn(0, 0)
		const cx = (d.box[0] + d.box[2]) / 2
		const pied = d.box[3] - 4 // centre de l'ombre
		for (const x of emplacements) {
			const [tx, ty] = P(x, PROFONDEUR, zs)
			const b: Box = [
				tx + (d.box[0] - cx) * s,
				ty + (d.box[1] - pied) * s,
				tx + (d.box[2] - cx) * s,
				ty + (d.box[3] - pied) * s,
			]
			if (
				!dansNiveau(P, zs, ctx, b) ||
				[...ctx.occupes, ...poses].some((o) => croise(b, o))
			)
				continue
			poses.push(b)
			svg += `<g class="tour-prop" transform="translate(${(tx - cx * s).toFixed(1)},${(ty - pied * s).toFixed(1)}) scale(${s.toFixed(3)})">${d.svg}</g>`
			break
		}
	}
	return { svg, boxes: poses }
}

type PropSalle = { p: [number, number]; svg: string; box: Box }

// emplacements (fractions de NX 12 × NY 9) : le long des murs x=0 et y=0 tous les 0,09, 2e rangée
// (x 0,9 / y 1,1), bord avant y=NY et bord droit x=NX, 2 emplacements centraux entre rangées de bureaux ; seuls les libres servent
const PAS_MUR = 0.09
const MUR = Array.from({ length: 11 }, (_, i) => 0.05 + i * PAS_MUR)
const EMPL_SALLE: [number, number][] = [
	...MUR.map((f): [number, number] => [0.025, f]),
	...MUR.map((f): [number, number] => [f, 0.045]),
	...[1.8, 3.4, 5.0, 6.6].map((y): [number, number] => [0.9 / 12, y / 9]),
	...[2.5, 4.5, 6.5, 8.5].map((x): [number, number] => [x / 12, 1.1 / 9]),
	[3.4 / 12, 3.3 / 9],
	[7.9 / 12, 3.3 / 9],
	...MUR.slice(2).map((f): [number, number] => [f, 8.4 / 9]),
	...MUR.slice(1).map((f): [number, number] => [11.4 / 12, f]),
]

/**
 * 4 à 8 props distincts sur les murs et coins libres d'une salle (échelle 1).
 * `postes` : emprises des bureaux + fantômes (n = 4-5 si ≤ 6, 6-8 sinon) ;
 * `objets` : autres obstacles (chef, vault, fusée, poubelle, lampe, arcs).
 * Déterministe pour (slug, obstacles) donnés.
 */
export function propsSalle(
	slug: string,
	postes: Box[],
	objets: Box[],
	nx: number,
	ny: number,
): PropSalle[] {
	const h = hashSlug(slug)
	const r = rng(h)
	const n = postes.length <= 6 ? 4 + (h % 2) : 6 + (h % 3)
	const poses: PropSalle[] = []
	let restants = melanger(liste(), r)
	// moitié d'emplacements (1 sur 2) propre au slug, l'autre en renfort : 2 étages ≠ mêmes places
	const moitie = (k: number) => EMPL_SALLE.filter((_, i) => i % 2 === k)
	const ordre = [
		...melanger(moitie(h % 2), r),
		...melanger(moitie(1 - (h % 2)), r),
	]
	for (const [fx, fy] of ordre) {
		if (poses.length >= n) break
		const p: [number, number] = [fx * nx, fy * ny]
		const libre = (b: Box) =>
			![...postes, ...objets, ...poses.map((o) => o.box)].some((o) =>
				croise(b, o),
			)
		const fn = restants.find((f) => libre(f(...p).box))
		if (!fn) continue
		restants = restants.filter((f) => f !== fn)
		const d = fn(...p)
		poses.push({ p, svg: d.svg, box: d.box })
	}
	return poses
}

/** emprise écran d'un emplacement de poste : bureau + zone du fantôme (obstacle des props, agent ou non) */
export function bureauBox(P: P3, x: number, zs: number, taille: number): Box {
	const hDesk = (9 * taille) / (ZH * T_S)
	const [mx, my] = P(x - 0.12, 0.5, zs)
	return union(
		boxT(P, [
			[x - 0.2, 0.06, zs],
			[x + 0.2, 0.26, zs + hDesk],
		]),
		mascotteBox(mx, my + 2 * taille, taille),
	)
}

const MEUBLEE = { taille: 0.95, x0: 2.2, pas: 2.2 }

/** emplacement de poste : `c` = couleur de l'agent assis, `fantome(mx, my)` dessine le fantôme ; absent = bureau vide */
export type Poste = { c: string; fantome: (mx: number, my: number) => string }

type OptsNiveau = {
	hz: number
	nx: number
	taille: number
	xs: number[]
	postes: (Poste | undefined)[]
	ecran: boolean
	/** dessin ajouté après les postes (ex. `+N`) */
	apres?: string
}

/** un niveau meublé, partagé vignette et immeuble : props, bureaux fixes (`xs`), fantômes assis */
export function niveauPostes(
	P: P3,
	slug: string,
	z0: number,
	lum: Lum,
	o: OptsNiveau,
) {
	const { taille, xs } = o
	const zs = z0 + TS
	const occupes = xs.map((x) => bureauBox(P, x, zs, taille))
	const postes = xs
		.map((x, i) => {
			const p = o.postes[i]
			const [mx, my] = P(x - 0.12, 0.5, zs)
			return `<g class="tour-poste${p ? " occupe" : ""}">${posteTour(P, x, zs, taille, p?.c ?? "#262d40", !!p, o.ecran)}${p ? p.fantome(mx, my + 2 * taille) : ""}</g>`
		})
		.join("")
	const props = propsNiveau(slug, P, xs[0] ?? MEUBLEE.x0, zs, taille, {
		occupes,
		haut: z0 + o.hz,
		nx: o.nx,
		ny: T_NY,
	})
	return {
		svg: coqueTour(
			P,
			z0,
			o.hz,
			TS,
			lum,
			props.svg + postes + (o.apres ?? ""),
			o.nx,
		),
		occupes,
		boxes: props.boxes,
		zs,
	}
}

/** vignette : `agents` = couleurs, 1 fantôme par bureau */
function niveauMeuble(
	P: P3,
	slug: string,
	z0: number,
	lum: Lum,
	xs: number[],
	agents: string[],
) {
	const { taille } = MEUBLEE
	return niveauPostes(P, slug, z0, lum, {
		hz: HZ,
		nx: T_NX,
		taille,
		xs,
		ecran: true,
		postes: agents.map((c) => ({
			c,
			fantome: (mx, my) => mascotte(mx, my, c, taille),
		})),
	})
}

/**
 * Tour meublée : sous-sol, 3 étages, chef en haut (coupe iso v1).
 * Props déterministes par slug ; cabine, plaque et gyro hors de la coupe.
 */
export function tourMeublee(slug: string) {
	const P: P3 = (x, y, z = 0) => isoT(x, y, z, 30, 80, T_S)
	const { x0, pas } = MEUBLEE
	const couleurs = ROLE_COLORS.map(([, c]) => c)
	const niveaux = [
		{ lum: "vide" as Lum, xs: [], ag: [] },
		...[1, 2, 3].map((k) => ({
			lum: "allume" as Lum,
			xs: [x0, x0 + pas],
			ag: [couleurs[k], couleurs[k + 2]],
		})),
		{ lum: "allume" as Lum, xs: [T_NX * 0.45], ag: [couleurs[0]] },
	]
	const rendus = niveaux.map((n, i) =>
		niveauMeuble(P, slug, i * HZ, n.lum, n.xs, n.ag),
	)
	const n = niveaux.length
	const svg = `${rendus.map((r) => r.svg).join("")}${boiteT(P, 0, 0, n * HZ, T_NX, T_NY, COUV_H, "#232a3c")}`
	return {
		svg,
		box: boxT(P, [
			[0, T_NY, 0],
			[T_NX, 0, 0],
			[T_NX, T_NY, 0],
			[0, 0, n * HZ + COUV_H],
		]),
		niveaux: rendus,
		P,
	}
}
