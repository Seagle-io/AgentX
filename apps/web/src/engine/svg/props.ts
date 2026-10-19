// Props de décor proposés pour la salle v1 (T084) : même échelle, même ombre,
// mêmes `iso`/`boite` que `iso.ts`. Décor sans donnée. Couleurs en dur
// tolérées comme dans `iso.ts`. Seul mouvement : vapeur du café.
import {
	type Box,
	boite,
	type Drawn,
	iso,
	isoBox,
	ROLE_COLORS,
	TH,
	TW,
	union,
	ZH,
} from "@/engine/svg/iso"

type P3 = [number, number, number]

const f1 = (n: number) => n.toFixed(1)
const at = (p: P3) =>
	iso(...p)
		.map(f1)
		.join(",")
const STROKE = `stroke="#07090f" stroke-width=".7" stroke-linejoin="round"`

// Ombre v1 : ellipse noire .3 centrée sur l'emprise au sol.
const ombre = (x: number, y: number, rx = 11, ry = 5.5): Drawn => ({
	svg: `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" fill="#000" opacity=".3"/>`,
	box: [x - rx, y - ry, x + rx, y + ry],
})
const ombreSous = (gx: number, gy: number, w: number, d: number) =>
	ombre(...iso(gx + w / 2, gy + d / 2, 0))

// Segment iso (trait sur une face).
const trait = (a: P3, b: P3, c: string, w = 1.2) =>
	`<path d="M${at(a)} L${at(b)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`

// Pot v1 redessiné : rebord, flanc droit ombré, terre. 5 éléments.
const pot = (x: number, y: number) => `
    ${ombre(x, y).svg}
    <path d="M${x - 7} ${y - 2} L${x - 6} ${y - 11} L${x + 6} ${y - 11} L${x + 7} ${y - 2} Q${x} ${y + 1} ${x - 7} ${y - 2}Z" fill="#2a3042"/>
    <path d="M${x + 2} ${y - 11} L${x + 6} ${y - 11} L${x + 7} ${y - 2} Q${x + 5} ${y - 0.6} ${x + 2.5} ${y - 0.4}Z" fill="#1a1e2b"/>
    <rect x="${x - 8}" y="${y - 14}" width="16" height="3" rx="1" fill="#3a4460"/>
    <ellipse cx="${x}" cy="${y - 13.5}" rx="6.5" ry="1.5" fill="#0c1018"/>`
const potBox = (x: number, y: number, haut: number): Box => [
	x - 12,
	y - haut,
	x + 12,
	y + 5.5,
]

/** P1 : pot à rebord + 5 feuilles courbes, 3 verts (11 éléments) */
export function plante1(gx: number, gy: number): Drawn {
	const [x, y] = iso(gx, gy, 0)
	const b = y - 14
	// feuille = lentille base → pointe, deux quadratiques de part et d'autre
	const f = (c1: string, tip: string, c2: string, c: string) =>
		`<path d="M${x} ${b} Q${c1} ${tip} Q${c2} ${x} ${b}Z" fill="${c}"/>`
	const r = (dx: number, dy: number) => `${x + dx} ${b + dy}`
	return {
		svg: `<g>${pot(x, y)}
    ${f(r(-12, -4), r(-11, -16), r(-4, -14), "#1a7a47")}
    ${f(r(11, -5), r(11, -17), r(3, -15), "#1a7a47")}
    ${f(r(-6, -12), r(1, -22), r(6, -12), "#26a862")}
    <path d="M${x} ${b} Q${r(0, -12)} ${r(1, -20)}" fill="none" stroke="#3fc47c" stroke-width=".8"/>
    ${f(r(-9, 0), r(-12, -7), r(-6, -9), "#1f8a52")}
    ${f(r(9, 0), r(12, -8), r(6, -10), "#1f8a52")}
  </g>`,
		box: potBox(x, y, 36),
	}
}

// Feuille de monstera, base en 0,0, pointe vers le haut, 4 encoches.
const MONSTERA =
	"M0 0 L-4 -1 L-6 -4 L-3 -5 L-6.5 -7 L-6 -10 L-3 -9.5 L-4 -12 L0 -13 L4 -12 L3 -9.5 L6 -10 L6.5 -7 L3 -5 L6 -4 L4 -1Z"

/** P2 : monstera, 2 grandes feuilles découpées (10 éléments) */
export function plante2(gx: number, gy: number): Drawn {
	const [x, y] = iso(gx, gy, 0)
	const feuille = (dx: number, dy: number, rot: number, c: string) => `
    <g transform="translate(${x + dx} ${y + dy}) rotate(${rot})">
      <path d="${MONSTERA}" fill="${c}" stroke-linejoin="round"/>
      <path d="M0 0 L0 -11.5" stroke="#1a7a47" stroke-width=".9"/>
    </g>`
	return {
		svg: `<g>${pot(x, y)}
    <path d="M${x} ${y - 14} Q${x - 1} ${y - 19} ${x - 3} ${y - 22} M${x} ${y - 14} Q${x + 1} ${y - 20} ${x + 3} ${y - 24}" fill="none" stroke="#1a7a47" stroke-width="1.4"/>
    ${feuille(-3, -22, -30, "#1f8a52")}
    ${feuille(3, -24, 25, "#26a862")}
  </g>`,
		box: potBox(x, y, 36),
	}
}

/** P3 : cactus en pot, 2 bras, 1 fleur (9 éléments) */
export function plante3(gx: number, gy: number): Drawn {
	const [x, y] = iso(gx, gy, 0)
	return {
		svg: `<g>${pot(x, y)}
    <path d="M${x - 3} ${y - 20} L${x - 8} ${y - 20} L${x - 8} ${y - 27} M${x + 3} ${y - 24} L${x + 7} ${y - 24} L${x + 7} ${y - 30}" fill="none" stroke="#1f8a52" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="${x - 4}" y="${y - 33}" width="8" height="20" rx="4" fill="#26a862"/>
    <path d="M${x - 1.5} ${y - 30} L${x - 1.5} ${y - 15} M${x + 1.5} ${y - 30} L${x + 1.5} ${y - 15}" stroke="#1a7a47" stroke-width=".8"/>
    <circle cx="${x}" cy="${y - 33}" r="2" fill="#e879f9"/>
  </g>`,
		box: potBox(x, y, 36),
	}
}

/** machine à café : vapeur `.v1-vapeur` (opacité 2 s), seul mouvement */
export function cafe(gx: number, gy: number): Drawn {
	const [cx, cy] = iso(gx + 0.2, gy + 0.43, 0.2)
	const o = ombreSous(gx, gy, 0.4, 0.4)
	return {
		svg: `<g>${o.svg}
    ${boite(gx, gy, 0, 0.4, 0.36, 1.15, "#2a3042")}
    ${boite(gx - 0.01, gy - 0.01, 1.15, 0.42, 0.38, 0.08, "#3a4460")}
    ${boite(gx + 0.16, gy + 0.36, 0.62, 0.08, 0.05, 0.08, "#0c1018")}
    ${boite(gx + 0.07, gy + 0.36, 0, 0.26, 0.1, 0.06, "#0c1018")}
    ${boite(gx + 0.15, gy + 0.38, 0.06, 0.1, 0.07, 0.13, "#e8eefc")}
    <circle cx="${f1(iso(gx + 0.33, gy + 0.36, 0.95)[0])}" cy="${f1(iso(gx + 0.33, gy + 0.36, 0.95)[1])}" r="1.6" fill="#ff8a3d"/>
    <path class="v1-vapeur" d="M${f1(cx)} ${f1(cy - 2)} q -3 -4 0 -7 q 3 -3 0 -7" fill="none" stroke="#c9d2e2" stroke-width="1.2" stroke-linecap="round"/>
  </g>`,
		box: union(o.box, isoBox(gx - 0.01, gy - 0.01, 0, 0.42, 0.47, 1.23)),
	}
}

/** lampe sur pied : abat-jour, halo discret (ellipse α .1, rayon 14 px ; T093 : 0 cône) */
export function lampe(gx: number, gy: number): Drawn {
	const [x, y] = iso(gx + 0.2, gy + 0.2, 0)
	const t = y - 40
	const o = ombre(x, y, 7, 3.5)
	return {
		svg: `<g>${o.svg}
    <ellipse cx="${x}" cy="${t + 3}" rx="14" ry="7" fill="#ff8a3d" opacity=".1"/>
    <ellipse cx="${x}" cy="${y}" rx="5" ry="2.5" fill="#2a3042" ${STROKE}/>
    <path d="M${x} ${y} L${x} ${t}" stroke="#3a4460" stroke-width="1.6"/>
    <ellipse cx="${x}" cy="${t + 1}" rx="7" ry="2" fill="#ff8a3d"/>
    <path d="M${x - 4} ${t - 6} L${x + 4} ${t - 6} L${x + 7} ${t + 1} L${x - 7} ${t + 1}Z" fill="#1a1e2b" ${STROKE}/>
  </g>`,
		box: [x - 14, t - 6, x + 14, y + 5.5],
	}
}

/** tableau blanc sur pied : 3 traits, dont 1 bleu (chef) */
export function tableau(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy + 0.12, 0.55, 0.25)
	const p = gy + 0.301
	const face = [
		[gx + 0.04, p, 0.59],
		[gx + 0.51, p, 0.59],
		[gx + 0.51, p, 1.36],
		[gx + 0.04, p, 1.36],
	] as P3[]
	return {
		svg: `<g>${o.svg}
    ${boite(gx, gy + 0.12, 0, 0.12, 0.25, 0.04, "#1a1e2b")}
    ${boite(gx + 0.03, gy + 0.22, 0, 0.06, 0.06, 0.6, "#1a1e2b")}
    ${boite(gx, gy + 0.25, 0.55, 0.55, 0.05, 0.85, "#2a3042")}
    <polygon points="${face.map(at).join(" ")}" fill="#dfe5f2"/>
    ${trait([gx + 0.1, p, 1.22], [gx + 0.42, p, 1.22], "#5d6880")}
    ${trait([gx + 0.1, p, 1.06], [gx + 0.46, p, 1.06], "#5d6880")}
    ${trait([gx + 0.1, p, 0.9], [gx + 0.32, p, 0.9], "#3b82f6")}
    ${boite(gx + 0.43, gy + 0.12, 0, 0.12, 0.25, 0.04, "#1a1e2b")}
    ${boite(gx + 0.46, gy + 0.22, 0, 0.06, 0.06, 0.6, "#1a1e2b")}
  </g>`,
		box: union(o.box, isoBox(gx, gy + 0.12, 0, 0.55, 0.25, 1.4)),
	}
}

/** pile de 3 cartons : kraft, adhésif clair */
export function cartons(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy, 0.45, 0.35)
	const piles: [number, number, number, number, number, number, string][] = [
		[gx, gy, 0, 0.45, 0.35, 0.5, "#9a7448"],
		[gx + 0.03, gy + 0.02, 0.5, 0.38, 0.3, 0.45, "#8a6840"],
		[gx + 0.07, gy + 0.05, 0.95, 0.3, 0.24, 0.38, "#9a7448"],
	]
	const svg = piles
		.map(
			([x, y, z, w, d, h, c]) =>
				boite(x, y, z, w, d, h, c) +
				trait([x + w / 2, y + d, z], [x + w / 2, y + d, z + h], "#c9a46a", 2),
		)
		.join("")
	const [x, y, z, w, d] = piles[2]
	return {
		svg: `<g>${o.svg}${svg}
    ${trait([x + w / 2, y, z + 0.38], [x + w / 2, y + d, z + 0.38], "#c9a46a", 2)}</g>`,
		box: union(o.box, isoBox(gx, gy, 0, 0.45, 0.35, 1.33)),
	}
}

/** 1 carton kraft, adhésif clair (archive d'un projet clos) */
export function carton(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy, 0.45, 0.35)
	const [w, d, h] = [0.45, 0.35, 0.5]
	return {
		svg: `<g>${o.svg}${boite(gx, gy, 0, w, d, h, "#9a7448")}
    ${trait([gx + w / 2, gy + d, 0], [gx + w / 2, gy + d, h], "#c9a46a", 2)}
    ${trait([gx + w / 2, gy, h], [gx + w / 2, gy + d, h], "#c9a46a", 2)}</g>`,
		box: union(o.box, isoBox(gx, gy, 0, w, d, h)),
	}
}

/** étagère 2 niveaux, classeurs aux couleurs de rôle */
export function etagere(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy, 0.55, 0.25)
	const N = "#2a3042"
	const classeurs = (z: number, n: number, k0: number) =>
		Array.from({ length: n }, (_, i) =>
			boite(
				gx + 0.07 + i * 0.11,
				gy + 0.06,
				z,
				0.08,
				0.17,
				0.5 - (i % 2) * 0.07,
				ROLE_COLORS[(k0 + i) % ROLE_COLORS.length][1],
			),
		).join("")
	return {
		svg: `<g>${o.svg}
    ${boite(gx, gy, 0, 0.55, 0.05, 1.41, "#1a1e2b")}
    ${boite(gx, gy, 0, 0.04, 0.25, 1.41, N)}
    ${boite(gx, gy, 0, 0.55, 0.25, 0.06, N)}
    ${classeurs(0.06, 4, 0)}
    ${boite(gx, gy, 0.68, 0.55, 0.25, 0.05, N)}
    ${classeurs(0.73, 3, 4)}
    ${boite(gx, gy, 1.36, 0.55, 0.25, 0.05, N)}
    ${boite(gx + 0.51, gy, 0, 0.04, 0.25, 1.41, N)}
  </g>`,
		box: union(o.box, isoBox(gx, gy, 0, 0.55, 0.25, 1.41)),
	}
}

/** extincteur : corps rouge (blocage), bande claire, flexible */
export function extincteur(gx: number, gy: number): Drawn {
	const [x, y] = iso(gx + 0.2, gy + 0.2, 0)
	const o = ombre(x, y, 7, 3.5)
	return {
		svg: `<g>${o.svg}
    <rect x="${x - 4.5}" y="${y - 22}" width="9" height="22" rx="3" fill="#ff3b5c"/>
    <rect x="${x + 1.5}" y="${y - 21}" width="3" height="20" rx="1.5" fill="#000" opacity=".25"/>
    <rect x="${x - 4.5}" y="${y - 15}" width="9" height="5" fill="#e8eefc"/>
    <rect x="${x - 2}" y="${y - 26}" width="4" height="4" fill="#2a3042"/>
    <path d="M${x - 1} ${y - 26} L${x + 5} ${y - 28}" stroke="#2a3042" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M${x + 2} ${y - 24} q 6 2 5 12" fill="none" stroke="#0c1018" stroke-width="1.4" stroke-linecap="round"/>
  </g>`,
		box: [x - 7, y - 29, x + 8, y + 3.5],
	}
}

/** imprimante sur caisson : feuille, voyant vert (éclaireur) */
export function imprimante(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy, 0.45, 0.36)
	const [lx, ly] = iso(gx + 0.37, gy + 0.34, 0.86)
	return {
		svg: `<g>${o.svg}
    ${boite(gx, gy, 0, 0.45, 0.36, 0.65, "#1a1e2b")}
    ${trait([gx + 0.15, gy + 0.36, 0.5], [gx + 0.3, gy + 0.36, 0.5], "#3a4460", 1.4)}
    ${boite(gx + 0.02, gy + 0.02, 0.65, 0.41, 0.32, 0.32, "#2a3042")}
    ${trait([gx + 0.08, gy + 0.34, 0.76], [gx + 0.3, gy + 0.34, 0.76], "#0c1018", 2)}
    ${boite(gx + 0.1, gy + 0.08, 0.97, 0.24, 0.18, 0.02, "#e8eefc")}
    <circle cx="${f1(lx)}" cy="${f1(ly)}" r="1.3" fill="#22e07a"/>
  </g>`,
		box: union(o.box, isoBox(gx, gy, 0, 0.45, 0.36, 0.99)),
	}
}

// T100 : signal de blocage mural, plan du mur y = gy. Rouge et rythme du gyro
// de tour (#ff3b5c) ; calme = gris mat, 0 animation. Keyframes : style.ts.
const ROUGE = "#ff3b5c"
const GRIS = "#3d465c"
// cercle du plan mural (u le long de x, v le long de z) → écran
const surMur = (x: number, y: number, z: number) =>
	`transform="matrix(${TW} ${TH} 0 ${-ZH} ${iso(x, y, z).map(f1).join(" ")})"`
const LUEUR = `<radialGradient id="v1-lueur"><stop offset="0" stop-color="${ROUGE}"/><stop offset="1" stop-color="${ROUGE}" stop-opacity="0"/></radialGradient>`
const FAISCEAU = `<linearGradient id="v1-faisceau"><stop offset="0" stop-color="${ROUGE}" stop-opacity=".95"/><stop offset="1" stop-color="${ROUGE}" stop-opacity="0"/></linearGradient>`

/** L1 : gyrophare mural — platine, bras, socle, dôme ; alerte = faisceau 2 s + lueur 1,8 s */
export function lampeAlerte(gx: number, gy: number, alerte: boolean): Drawn {
	const [x, y] = iso(gx + 0.25, gy + 0.22, 1.08)
	const [r, h, b] = [7.5, 7, alerte ? 28 : 7.5]
	const v = (c: string) =>
		`<path d="M${f1(x - r)} ${f1(y)} L${f1(x - r)} ${f1(y - h)} A${r} ${r} 0 0 1 ${f1(x + r)} ${f1(y - h)} L${f1(x + r)} ${f1(y)} A${r} 2.5 0 0 1 ${f1(x - r)} ${f1(y)}Z" fill="${c}"/>`
	const ombreDome = `<path d="M${f1(x + 1.5)} ${f1(y + 2.4)} L${f1(x + 1.5)} ${f1(y - h - r + 0.2)} A${r} ${r} 0 0 1 ${f1(x + r)} ${f1(y - h)} L${f1(x + r)} ${f1(y)}Z" fill="#000" opacity=".22"/>`
	const vis = (px: number, pz: number) => {
		const [a, b] = iso(gx + px, gy + 0.03, pz)
		return `<circle cx="${f1(a)}" cy="${f1(b)}" r=".9" fill="#5d6880"/>`
	}
	const alerteSvg = `${LUEUR}${FAISCEAU}
    <ellipse class="v1-lueur" cx="0" cy="0" rx=".55" ry=".85" fill="url(#v1-lueur)" opacity=".25" ${surMur(gx + 0.25, gy, 1.15)}/>`
	const faisceau = `<g transform="translate(${f1(x)} ${f1(y - h + 1)}) scale(1 .5)"><path class="v1-faisceau" d="M0 0 L28 -8 L28 8Z" fill="url(#v1-faisceau)" opacity=".55"/></g>`
	const coeur = `<circle cx="${f1(x - 1)}" cy="${f1(y - h + 1)}" r="2.4" fill="#ffe1e6" filter="url(#v1-glow-oeil)"/>`
	const reflet = `<path d="M${f1(x - 3.8)} ${f1(y - 2)} L${f1(x - 3.8)} ${f1(y - h)} A4 4 0 0 1 ${f1(x - 1.5)} ${f1(y - h - 3.6)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`
	return {
		svg: `<g>${alerte ? alerteSvg : ""}
    ${boite(gx + 0.08, gy, 0.72, 0.34, 0.03, 0.5, "#2a3042")}
    ${vis(0.13, 1.14)}${vis(0.37, 0.78)}
    ${boite(gx + 0.2, gy + 0.03, 0.9, 0.1, 0.14, 0.1, "#1a1e2b")}
    ${boite(gx + 0.13, gy + 0.1, 1, 0.24, 0.24, 0.08, "#1a1e2b")}
    ${alerte ? faisceau : ""}
    ${alerte ? `<g opacity=".88">${v(ROUGE)}</g>` : v(GRIS)}
    ${ombreDome}
    <ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${r}" ry="2.5" fill="#000" opacity=".25"/>
    ${alerte ? `${coeur}${reflet}` : ""}
  </g>`,
		box: union(isoBox(gx + 0.08, gy, 0.72, 0.34, 0.34, 0.5), [
			x - b,
			y - h - r - (alerte ? 14 : 0),
			x + b,
			y + 3,
		]),
	}
}

// T089 : aquarium A1 (verre) et bocal A2. Dégradé `v1-eau`, poisson `v1-nage`, bulles `v1-bulle`.
const VERRE = `stroke="#e8eefc" stroke-opacity=".55" stroke-width=".8" stroke-linejoin="round"`
const EAU = `<linearGradient id="v1-eau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#126480" stop-opacity=".85"/><stop offset="1" stop-color="#06303f" stop-opacity=".95"/></linearGradient>`
const poisson = (x: number, y: number, a: number, p: number) =>
	`<g class="v1-nage" style="--a:${a}px;--p:${p}"><path d="M${f1(x - 3.4)} ${f1(y)} L${f1(x - 7.2)} ${f1(y - 3)} L${f1(x - 5.8)} ${f1(y)} L${f1(x - 7.2)} ${f1(y + 3)}Z" fill="#f59e0b"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="4" ry="2.6" fill="#f59e0b"/><ellipse cx="${f1(x + 0.3)}" cy="${f1(y + 1.1)}" rx="2.8" ry="1.1" fill="#fde68a"/><path d="M${f1(x - 1.5)} ${f1(y - 2.3)} q 1.8 -2.8 4 -0.6Z" fill="#fde68a"/><circle cx="${f1(x + 2.2)}" cy="${f1(y - 0.6)}" r=".7" fill="#06070c"/></g>`
const bulle = (x: number, y: number, d: number, h: number, t: number) =>
	`<circle class="v1-bulle" style="--d:${d}s;--h:-${h}px;animation-delay:-${t}s" cx="${f1(x)}" cy="${f1(y)}" r=".9" fill="#e8eefc"/>`
const meuble = (gx: number, gy: number) =>
	boite(gx, gy, 0, 0.6, 0.4, 0.55, "#1a1e2b")

/** A1 : aquarium sur meuble, couvercle sombre, parois de verre, eau en dégradé, sable, plante, poisson qui nage, 3 bulles */
export function aquarium(gx: number, gy: number): Drawn {
	const [w, d, z0, z1] = [0.6, 0.4, 0.55, 1.15]
	const o = ombreSous(gx, gy, w, d)
	const y = gy + d
	const s = z0 + 0.1
	const poly = (ps: P3[]) => ps.map(at).join(" ")
	const [fx, fy] = iso(gx + 0.33, y, 0.9)
	const [px, py] = iso(gx + 0.1, y, s)
	const [bx, by] = iso(gx + 0.5, y, s + 0.04)
	return {
		svg: `${o.svg}${meuble(gx, gy)}${EAU}
    <polygon points="${poly([
			[gx, y, z0],
			[gx + w, y, z0],
			[gx + w, y, z1],
			[gx, y, z1],
		])}" fill="url(#v1-eau)" ${VERRE}/>
    <polygon points="${poly([
			[gx + w, gy, z0],
			[gx + w, y, z0],
			[gx + w, y, z1],
			[gx + w, gy, z1],
		])}" fill="#06303f" fill-opacity=".8" ${VERRE}/>
    <polygon points="${poly([
			[gx, y, z0],
			[gx + w, y, z0],
			[gx + w, gy, z0],
			[gx + w, gy, s],
			[gx + w, y, s],
			[gx, y, s],
		])}" fill="#d8b878"/>
    <path d="M${f1(px)} ${f1(py)} c -3 -3 3 -5 0 -9 M${f1(px)} ${f1(py)} c 3 -3 5 -3 4 -8 M${f1(px)} ${f1(py)} c -2 -3 -5 -3 -4 -7" fill="none" stroke="#22e07a" stroke-width="1.3" stroke-linecap="round"/>
    ${poisson(fx, fy, 3.5, 0.5)}${bulle(bx, by, 2.5, 8, 0.3)}${bulle(bx + 2, by - 1, 3, 8, 1.4)}${bulle(bx - 2, by + 1, 3.5, 8, 2.6)}
    <path d="M${at([gx + 0.42, y, z1 - 0.04])} L${at([gx + 0.34, y, z0 + 0.2])} M${at([gx + 0.52, y, z1 - 0.04])} L${at([gx + 0.48, y, z1 - 0.3])}" stroke="#fff" stroke-opacity=".45" stroke-width="1.1" stroke-linecap="round"/>
    ${boite(gx - 0.01, gy - 0.01, z1, w + 0.02, d + 0.02, 0.04, "#2a3042")}`,
		box: union(
			o.box,
			isoBox(gx - 0.01, gy - 0.01, 0, w + 0.02, d + 0.02, z1 + 0.04),
		),
	}
}

/** A2 : bocal rond sur le même meuble, même poisson, 1 bulle */
export function bocal(gx: number, gy: number): Drawn {
	const o = ombreSous(gx, gy, 0.6, 0.4)
	const [x, y] = iso(gx + 0.3, gy + 0.2, 0.55)
	const [r, cy] = [9.5, y - 8.5]
	return {
		svg: `${o.svg}${meuble(gx, gy)}${EAU}
    <circle cx="${f1(x)}" cy="${f1(cy)}" r="${r}" fill="url(#v1-eau)" ${VERRE}/>
    <path d="M${f1(x - 6.9)} ${f1(cy + 6.5)} L${f1(x + 6.9)} ${f1(cy + 6.5)} A${r} ${r} 0 0 1 ${f1(x - 6.9)} ${f1(cy + 6.5)}Z" fill="#d8b878"/>
    <ellipse cx="${f1(x)}" cy="${f1(cy - r + 0.8)}" rx="5.5" ry="1.7" fill="none" ${VERRE}/>
    <path d="M${f1(x - 4)} ${f1(cy + 6.5)} c -3 -3 3 -5 0 -9 M${f1(x - 4)} ${f1(cy + 6.5)} c 3 -2 4 -3 3 -7" fill="none" stroke="#22e07a" stroke-width="1.3" stroke-linecap="round"/>
    ${poisson(x, cy, 2.5, 0)}${bulle(x + 4, cy + 5, 3, 9, 0.8)}
    <path d="M${f1(x - 7)} ${f1(cy - 2)} A8 8 0 0 1 ${f1(x - 3)} ${f1(cy - 7.2)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>`,
		box: union(o.box, [x - r - 1, cy - r - 2, x + r + 1, y + 2]),
	}
}
