// Salle d'un étage reconstruite avec la
// galerie : bureaux sans écran ni chaise, 1 fantôme par agent, objets v1,
// lampe d'alerte à la place du radar, props déterministes, arcs de relais.
import { arcsRelais, type FluxVue, type Poste } from "@/engine/svg/arcs"
import {
	equipe,
	GLOW_DEFS,
	meubleBureau,
	type VarianteSalle,
} from "@/engine/svg/fantome"
import { type Box, esc, etiquette, iso, isoBox, union } from "@/engine/svg/iso"
import { propsSalle } from "@/engine/svg/meuble"
import {
	fusee,
	etiquette as libelle,
	type Objet,
	poubelle,
	rack,
} from "@/engine/svg/objets"
import { lampeAlerte } from "@/engine/svg/props"

type Pt = [number, number]
export type AgentVue = { tid: string; bloque: boolean; rendu?: boolean }
export type DeskVue = {
	cle: string
	nom: string
	couleur: string
	agents: AgentVue[]
}
export type SalleVue = {
	desks: DeskVue[]
	flux: FluxVue[]
	pipeline: {
		bloque: number
		enCours: number
		faits: number
		/** un fait de plus depuis le rendu précédent : éclair du vault */
		flash?: boolean
		/** `state.pipeline` brut ; absent ⇒ tableau mural sur les 3 compteurs */
		parStatut?: { k: string; n: number }[]
	}
	/** tâches abandonnées : compteur de la poubelle */
	abandonnees: number
	props: { slug: string }
	hovered: string | null
}

const NX = 12
const NY = 9
const MUR = 5
// v1, radar → lampe d'alerte
const OBJETS = {
	vault: [11.1, 4.3] as Pt,
	fusee: [10.7, 6.4] as Pt,
	lampe: [9.8, 0] as Pt,
	poubelle: [0.3, 8.5] as Pt,
}
const pts = (arr: [number, number, number?][]) =>
	arr
		.map((p) =>
			iso(p[0], p[1], p[2])
				.map((n) => n.toFixed(1))
				.join(","),
		)
		.join(" ")

/** v1 chef fixe au fond, autres bureaux ligne par ligne dans l'ordre */
export function postesSalle(desks: DeskVue[]): { d: DeskVue; p: Pt }[] {
	const aff = desks.filter((d) => d.cle !== "chef")
	const n = aff.length
	const COLS = n <= 6 ? 3 : 4
	const [X0, PAS_X, Y0] = [1.2, 2.25, 2.0]
	const rows = Math.ceil(n / COLS)
	const PAS_Y = rows > 1 ? Math.min(2.2, 4.4 / (rows - 1)) : 0
	const chef = desks.filter((d) => d.cle === "chef")
	return [
		...chef.map((d) => ({ d, p: [9.9, 0.7] as Pt })),
		...aff.map((d, i) => ({
			d,
			p: [X0 + (i % COLS) * PAS_X, Y0 + Math.floor(i / COLS) * PAS_Y] as Pt,
		})),
	]
}

/** v1 sans écran ni chaise : pieds + plateau + équipe ; ring si survolé.
 *  `plaque` à poser en dernier, rattachée au bureau par `data-desk`. */
function bureau(
	d: DeskVue,
	[gx, gy]: Pt,
	hovered: boolean,
	variante: VarianteSalle,
) {
	const c = esc(d.couleur)
	const [cx, cy] = iso(gx + 0.75, gy + 0.5, 0)
	const [mx, my] = iso(gx + 0.75, gy + 1.5, 0)
	// bloqués en tête : jamais cachés derrière le +N ; rendus en queue
	const rang = (a: AgentVue) => (a.bloque ? 0 : a.rendu ? 2 : 1)
	const agents = [...d.agents].sort((a, b) => rang(a) - rang(b))
	const bloques = agents.flatMap((a, k) => (a.bloque ? [k] : []))
	const rendus = agents.flatMap((a, k) => (a.rendu && !a.bloque ? [k] : []))
	const eq = equipe(mx, my, c, agents.length, bloques, rendus)
	const [lx, ly] = iso(gx + 0.75, gy + 0.9, 1.09)
	const titre = agents.length > 1 ? `${d.nom} ×${agents.length}` : d.nom
	const plaque = etiquette({ x: lx, y: ly, t: titre, c, w: titre.length * 5.1 })
	const actif = hovered || agents.length > 0
	const ring = hovered
		? `<ellipse class="desk-ring" cx="${cx.toFixed(1)}" cy="${(cy + 16).toFixed(1)}" rx="50" ry="25"
             fill="none" stroke="${c}" stroke-width="1.6"/>`
		: ""
	const svg = `<g class="desk${actif ? " actif" : ""}" data-desk="${esc(d.cle)}">
    ${ring}
    ${meubleBureau(gx, gy, variante)}
    ${eq.svg}
  </g>`
	const poste: Poste = {
		gx,
		gy,
		couleur: c,
		box: union(isoBox(gx, gy, 0, 1.5, 0.9, 1.09), eq.box, plaque.box),
		cotes: [
			[eq.gauche - 20, my - 3],
			[eq.droite + 20, my - 3],
		],
	}
	return {
		svg,
		poste,
		plaque: `<g data-desk="${esc(d.cle)}">${plaque.svg}</g>`,
	}
}

/** gyrophare mural L1 (T100) posé sur le mur y = 0, étiquette d’état comme le radar v1 */
function lampeSalle([gx, gy]: Pt, alerte: boolean): Objet {
	const l = lampeAlerte(gx, gy, alerte)
	// libellé sur le mur au-dessus du dôme : le sol sous la lampe est le bureau du chef
	const [x, y] = iso(gx + 0.25, gy, 1.1)
	const e = libelle(x, y - 40, [
		{
			t: alerte ? "BLOCAGE DÉTECTÉ" : "AUCUN BLOCAGE",
			c: alerte ? "#ff3b5c" : "#7c8aa6",
			fs: 9,
		},
	])
	const corps = l.svg
	return {
		corps,
		label: e.svg,
		svg: corps + e.svg,
		box: union(l.box, e.box),
	}
}

// murs x = 0 et y = 0 entre z0 et z1
const murX = (z0: number, z1: number, fill: string) =>
	`<polygon points="${pts([
		[0, 0, z0],
		[0, NY, z0],
		[0, NY, z1],
		[0, 0, z1],
	])}" fill="${fill}"/>`
const murY = (z0: number, z1: number, fill: string) =>
	`<polygon points="${pts([
		[0, 0, z0],
		[NX, 0, z0],
		[NX, 0, z1],
		[0, 0, z1],
	])}" fill="${fill}"/>`
// arêtes au niveau z des 2 murs (coin compris)
const filet = (z: number, extra: string) =>
	`<polyline points="${pts([
		[0, NY, z],
		[0, 0, z],
		[NX, 0, z],
	])}" fill="none" ${extra}/>`
const PLINTHE = 0.6

/** T128 : S1 plinthe + grille α .18 (carreau clair /3), S2 murs unis + LED + grille en points */
export function solEtMurs(variante: VarianteSalle = "S1") {
	let sol = `<polygon points="${pts([
		[0, 0],
		[NX, 0],
		[NX, NY],
		[0, NY],
	])}" fill="#0b0e15"/>`
	const ligne = (a: Pt, b: Pt, c: string) =>
		`<line x1="${iso(...a)[0].toFixed(1)}" y1="${iso(...a)[1].toFixed(1)}" x2="${iso(...b)[0].toFixed(1)}" y2="${iso(...b)[1].toFixed(1)}" stroke="${c}" stroke-opacity=".18" stroke-width=".9"/>`
	const ton = (i: number) => (i % 3 === 0 ? "#a9b8d6" : "#5b6a8a")
	if (variante === "S2")
		for (let i = 0; i <= NX; i++)
			for (let j = 0; j <= NY; j++) {
				const [x, y] = iso(i, j)
				sol += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".6" fill="#8b98b5" opacity=".45"/>`
			}
	else {
		for (let i = 0; i <= NX; i++) sol += ligne([i, 0], [i, NY], ton(i))
		for (let i = 0; i <= NY; i++) sol += ligne([0, i], [NX, i], ton(i))
	}
	const coin = `<polyline points="${pts([
		[0, 0, 0],
		[0, 0, MUR],
	])}" fill="none" stroke="#2a3247" stroke-width=".8"/>`
	const haut = filet(MUR, `stroke="#2a3247" stroke-width="1.2"`)
	if (variante === "S2")
		return `${sol}${murX(0, MUR, "#151a26")}${murY(0, MUR, "#1b2131")}${coin}${haut}
    ${filet(0.05, `stroke="#3b82f6" stroke-opacity=".5" stroke-width="1"`)}`
	return `${sol}${murX(0, PLINTHE, "#0f121b")}${murX(PLINTHE, MUR, "#151a26")}${murY(0, PLINTHE, "#12161f")}${murY(PLINTHE, MUR, "#1b2131")}${coin}${haut}
    ${filet(PLINTHE, `stroke="#262c3e" stroke-width=".8"`)}`
}

// 6 statuts de `state.pipeline` ; couleurs .tour-c (style.ts) + --cyan, --green
const STATUTS: [k: string, libelle: string, couleur: string][] = [
	["a-faire", "TODO", "#7c8aa6"],
	["pret", "PRÊT", "#2de2e6"],
	["en-cours", "COURS", "#3b82f6"],
	["revue", "REVUE", "#a855f7"],
	["bloque", "BLOQ.", "#ff3b5c"],
	["fait", "FAIT", "#22e07a"],
]
// plan du tableau (u le long du mur, z) : cadre, base des barres, hauteur max
const TAB = { u0: 0.5, y0x: 6.6, marge: 0.2, case: 0.74, bas: 2.3, haut: 4.6 }
const BARRE = { base: 2.78, max: 1.0, l: 0.4, libelle: 2.45, titre: 4.3 }
const texte = (
	[x, y]: [number, number],
	pente: number,
	t: string,
	c: string,
	ancre = "middle",
) =>
	`<text transform="matrix(1 ${pente} 0 1 ${x.toFixed(1)} ${y.toFixed(1)})" text-anchor="${ancre}" font-family="ui-monospace,monospace" font-size="7" fill="${c}">${t}</text>`

/** T128 : tableau pipeline mural plan (0 animation), barres ∝ n / max ; vide ⇒ 0 texte */
export function tableauPipeline(
	mur: "y0" | "x0",
	pipeline: SalleVue["pipeline"],
) {
	const P = (u: number, z: number) =>
		mur === "y0" ? iso(TAB.u0 + u, 0.02, z) : iso(0.02, TAB.y0x - u, z)
	const pente = mur === "y0" ? 0.5 : -0.5
	const brut = pipeline.parStatut ?? [
		{ k: "en-cours", n: pipeline.enCours },
		{ k: "bloque", n: pipeline.bloque },
		{ k: "fait", n: pipeline.faits },
	]
	const n = (k: string) => brut.find((s) => s.k === k)?.n ?? 0
	const barres = STATUTS.filter(([k]) => brut.some((s) => s.k === k))
	const max = Math.max(1, ...barres.map(([k]) => n(k)))
	const vide = barres.every(([k]) => n(k) === 0)
	const W = 2 * TAB.marge + barres.length * TAB.case
	const quad = (u0: number, u1: number, z0: number, z1: number) =>
		[P(u0, z0), P(u1, z0), P(u1, z1), P(u0, z1)]
			.map((p) => p.map((v) => v.toFixed(1)).join(","))
			.join(" ")
	let svg = `<polygon points="${quad(0, W, TAB.bas, TAB.haut)}" fill="#070a10" stroke="#262c3e" stroke-width=".8"/>
    <polyline points="${[P(TAB.marge, BARRE.base), P(W - TAB.marge, BARRE.base)].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="#262c3e" stroke-width=".8"/>`
	if (!vide)
		svg += texte(
			P(TAB.marge, BARRE.titre),
			pente,
			"PIPELINE",
			"#7c8aa6",
			"start",
		)
	const boxes: Box[] = []
	barres.forEach(([k, libelle, c], i) => {
		const u = TAB.marge + i * TAB.case
		const m = u + TAB.case / 2
		const h = (BARRE.max * n(k)) / max
		if (h > 0)
			svg += `<polygon points="${quad(m - BARRE.l / 2, m + BARRE.l / 2, BARRE.base, BARRE.base + h)}" fill="${c}"/>`
		if (!vide)
			svg +=
				texte(P(m, BARRE.base + h + 0.12), pente, String(n(k)), "#c9d2e2") +
				texte(P(m, BARRE.libelle), pente, libelle, "#7c8aa6")
		// emprise par case (cadre compris aux bouts) : obstacle serré des props
		const a = i === 0 ? 0 : u
		const b = i === barres.length - 1 ? W : u + TAB.case
		const coins = [P(a, TAB.bas), P(b, TAB.bas), P(a, TAB.haut), P(b, TAB.haut)]
		boxes.push([
			Math.min(...coins.map((p) => p[0])),
			Math.min(...coins.map((p) => p[1])),
			Math.max(...coins.map((p) => p[0])),
			Math.max(...coins.map((p) => p[1])),
		])
	})
	return { svg: `<g class="v1-tableau">${svg}</g>`, boxes }
}

/** v1 SVG complet de la salle ; `anim` faux (mouvement réduit) ⇒ 0 colis mobile ;
 *  T128 : `variante` S1 (tableau mur y = 0) | S2 (tableau mur x = 0) */
export function salleEtage(
	vue: SalleVue,
	anim = true,
	variante: VarianteSalle = "S1",
): string {
	const bureaux = postesSalle(vue.desks).map(({ d, p }) => ({
		cle: d.cle,
		p,
		...bureau(d, p, vue.hovered === d.cle, variante),
	}))
	const tableau = tableauPipeline(variante === "S1" ? "y0" : "x0", vue.pipeline)
	const { bloque, enCours, faits, flash } = vue.pipeline
	const fixes = [
		{
			p: OBJETS.vault,
			...rack(...OBJETS.vault, Math.min(8, Math.max(1, faits + 1)), flash),
		},
		{ p: OBJETS.poubelle, ...poubelle(...OBJETS.poubelle, vue.abandonnees) },
		{ p: OBJETS.fusee, ...fusee(...OBJETS.fusee, enCours > 0) },
		{ p: OBJETS.lampe, ...lampeSalle(OBJETS.lampe, bloque > 0) },
	]
	const relais = arcsRelais(
		vue.flux,
		new Map(bureaux.map((b) => [b.cle, b.poste])),
		OBJETS.vault,
		anim,
	)
	const props = propsSalle(
		vue.props.slug,
		bureaux.filter((b) => b.cle !== "chef").map((b) => b.poste.box),
		[
			...bureaux.filter((b) => b.cle === "chef").map((b) => b.poste.box),
			...fixes.map((o) => o.box),
			...relais.boxes,
			...tableau.boxes,
		],
		NX,
		NY,
	)
	// T110 : libellés des objets au-dessus de tout, jamais masqués par un voisin
	const objets = [
		...bureaux,
		...props,
		...fixes.map((o) => ({ ...o, svg: o.corps })),
	].sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]))
	return `<svg class="v1-scene" viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="halo" cx="46%" cy="34%" r="66%">
        <stop offset="0%" stop-color="#1c2538" stop-opacity=".9"/>
        <stop offset="100%" stop-color="#04050a" stop-opacity="0"/>
      </radialGradient>
      ${GLOW_DEFS}
    </defs>
    <rect x="0" y="0" width="700" height="480" fill="url(#halo)"/>
    ${solEtMurs(variante)}${tableau.svg}${objets.map((o) => o.svg).join("")}${relais.chemins}${fixes.map((o) => o.label).join("")}${bureaux.map((b) => b.plaque).join("")}
  </svg>`
}
