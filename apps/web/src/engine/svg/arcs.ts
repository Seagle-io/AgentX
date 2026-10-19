// Arcs de relais de la salle v1 : une courbe par
// couple de rôles qui se passent le travail, contournant les bureaux tiers.
import { pastille } from "@/engine/svg/glyphes"
import { type Box, iso } from "@/engine/svg/iso"

type Pt = [number, number]
export type EtatFlux = "attente" | "livre" | "actif" | "bloque"
export type FluxVue = {
	de: string
	vers: string
	etat: EtatFlux
	objet: string
}
/** emprise et accroches d'un bureau, tels que dessinés */
export type Poste = {
	gx: number
	gy: number
	couleur: string
	box: Box
	cotes: [Pt, Pt]
}

const RANG_ETAT: Record<EtatFlux, number> = {
	attente: 0,
	livre: 1,
	actif: 2,
	bloque: 3,
}
const COULEUR_ETAT: Record<EtatFlux, string> = {
	attente: "#39415a",
	livre: "#2de2e6",
	actif: "#22e07a",
	bloque: "#ff3b5c",
}
const COULEUR_VAULT = "#7c8aa6"
const f1 = (n: number) => n.toFixed(1)
// T118 : 0 flèche ni colis, le mouvement porte le sens ; transform/opacity sur leur
// couche ou stroke-dashoffset, 0 SMIL ; classes `.v1-arc-*` dans style.ts
type Mode = "bloque" | "anime" | "fixe"
const PAS = Array.from({ length: 25 }, (_, i) => i / 24) // emprise du tracé
const N = 60
const quad = (a: Pt, m: Pt, b: Pt, t: number): Pt => {
	const u = 1 - t
	return [
		u * u * a[0] + 2 * u * t * m[0] + t * t * b[0],
		u * u * a[1] + 2 * u * t * m[1] + t * t * b[1],
	]
}
// abscisse curviligne sur 60 pas (getTotalLength impossible côté chaîne)
type Longueurs = { pts: Pt[]; cum: number[] }
function longueurs(a: Pt, m: Pt, b: Pt): Longueurs {
	const pts = Array.from({ length: N + 1 }, (_, i) => quad(a, m, b, i / N))
	const cum = [0]
	for (let i = 1; i <= N; i++)
		cum.push(cum[i - 1] + Math.hypot(...sub(pts[i], pts[i - 1])))
	return { pts, cum }
}
const sub = (p: Pt, q: Pt): Pt => [p[0] - q[0], p[1] - q[1]]
function aDistance({ pts, cum }: Longueurs, s: number): Pt {
	let i = 1
	while (i < N && cum[i] < s) i++
	const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
	const [dx, dy] = sub(pts[i], pts[i - 1])
	return [pts[i - 1][0] + k * dx, pts[i - 1][1] + k * dy]
}
type Arc = { d: string; b: Pt; c: string; l: Longueurs }
const trait = (d: string, c: string, w: number, o: number, att = "") =>
	`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round"${att}/>`
const rond = ([x, y]: Pt, r: number, att: string) =>
	`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" ${att}/>`
// mouvement réduit : point fixe aux ¾ (affiché par style.ts seulement)
const repos = (l: Longueurs, c: string) =>
	rond(aDistance(l, 0.75 * l.cum[N]), 1.6, `class="v1-arc-rm" fill="${c}"`)
/** trait dessiné source → cible puis éteint à .15, glyphe 8 px à l'arrivée ; bloqué : rembobine, clignote 2× */
function impulsion({ d, b, c, l }: Arc, mode: Mode, objet: string) {
	const L = f1(l.cum[N])
	const dessin = (cl: string) =>
		trait(d, c, 1.4, 1, `${cl} stroke-dasharray="${L} ${L}" style="--l:${L}px"`)
	if (mode === "bloque") return `<g class="v1-arc-bloque-b">${dessin("")}</g>`
	if (mode === "fixe")
		return `<g class="v1-arc-impulsion">${trait(d, c, 1.4, 0.55)}</g>`
	return `<g class="v1-arc-impulsion">${trait(d, c, 1.2, 0.15)}${dessin(` class="v1-arc-dessin"`)}<g class="v1-arc-glyphe" transform="translate(${f1(b[0])},${f1(b[1])})">${pastille(objet, c, 0.42)}</g>${repos(l, c)}</g>`
}
// nombre de points de la quadratique tombant dans un bureau tiers
function traverse(f: FluxVue, postes: Map<string, Poste>, a: Pt, m: Pt, b: Pt) {
	let n = 0
	for (const [r, { box }] of postes) {
		if (r === f.de || r === f.vers) continue
		const [x1, y1, x2, y2] = box
		for (let i = 0; i <= 100; i++) {
			const [x, y] = quad(a, m, b, i / 100)
			if (x > x1 && x < x2 && y > y1 && y < y2) n++
		}
	}
	return n
}
// 1 flux par couple de>vers, état le plus fort ; vault vers tout rôle ; tout relais vers le scribe part du vault
function plusForts(flux: FluxVue[], postes: Map<string, Poste>) {
	const fort = new Map<string, FluxVue>()
	for (const f0 of flux) {
		// rôle inconnu, boucle sur soi : rien
		if (
			!(postes.has(f0.de) || f0.de === "vault") ||
			!postes.has(f0.vers) ||
			f0.de === f0.vers
		)
			continue
		const f = f0.vers === "scribe" ? { ...f0, de: "vault" } : f0
		const k = `${f.de}>${f.vers}`
		const avant = fort.get(k)
		if (!avant || RANG_ETAT[f.etat] > RANG_ETAT[avant.etat]) fort.set(k, f)
	}
	return [...fort.values()]
}
/** v1 ; `vault` = case du rack ; `anim` faux ⇒ trait seul, 0 mouvement */
export function arcsRelais(
	flux: FluxVue[],
	postes: Map<string, Poste>,
	vault: Pt,
	anim: boolean,
) {
	const V = iso(vault[0] + 0.45, vault[1] + 0.9, 0)
	const poste = (r: string) => postes.get(r) as Poste
	const centre = (r: string) =>
		r === "vault" ? V : iso(poste(r).gx + 0.75, poste(r).gy + 1.5, 0)
	// accroche du côté de l'autre bout (à gauche si à l'aplomb)
	const ancre = (r: string, autre: string): Pt =>
		r === "vault" ? V : poste(r).cotes[centre(autre)[0] > centre(r)[0] ? 1 : 0]
	const couleur = (r: string) =>
		r === "vault" ? COULEUR_VAULT : poste(r).couleur
	// seuls actif et bloque sont dessinés : livre et attente ne disent rien de présent
	const traces = plusForts(flux, postes)
		.filter((f) => f.etat === "actif" || f.etat === "bloque")
		.map((f) => {
			const a = ancre(f.de, f.vers)
			const b = ancre(f.vers, f.de)
			// bombé vers le haut par défaut ; sinon le premier tracé qui contourne
			// tous les bureaux tiers (droit, vers le bas, latéral, plus ample)
			const cx = (a[0] + b[0]) / 2
			const cy = (a[1] + b[1]) / 2
			const h = 42 + Math.abs(b[0] - a[0]) * 0.14
			const essais = [
				[0, -h],
				[0, 0],
				[0, h],
				[h, 0],
				[-h, 0],
				[0, -2 * h],
				[0, 2 * h],
				[2 * h, 0],
				[-2 * h, 0],
			].map(([dx, dy]): Pt => [cx + dx, cy + dy])
			const n = essais.map((m) => traverse(f, postes, a, m, b))
			const [mx, my] = essais[n.indexOf(Math.min(...n))]
			const d = `M${f1(a[0])},${f1(a[1])} Q${f1(mx)},${f1(my)} ${f1(b[0])},${f1(b[1])}`
			const bloque = f.etat === "bloque"
			const c = bloque ? COULEUR_ETAT.bloque : couleur(f.de)
			const arc = { d, b, c, l: longueurs(a, [mx, my], b) }
			const mode = bloque ? "bloque" : anim ? "anime" : "fixe"
			// emprise du tracé ±6 px (obstacle des props)
			const pts = PAS.map((t) => quad(a, [mx, my], b, t))
			const [xs, ys] = [pts.map(([x]) => x), pts.map(([, y]) => y)]
			const box: Box = [
				Math.min(...xs) - 6,
				Math.min(...ys) - 6,
				Math.max(...xs) + 6,
				Math.max(...ys) + 6,
			]
			const svg = impulsion(arc, mode, f.objet)
			return { svg, box }
		})
	return {
		chemins: traces.map((t) => t.svg).join(""),
		boxes: traces.map((t) => t.box),
	}
}
