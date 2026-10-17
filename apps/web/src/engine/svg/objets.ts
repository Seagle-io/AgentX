// Objets au sol de la salle v1 : rack,
// fusée F1 (T110), poubelle, avec leur étiquette d'état.
import { boite, type Drawn, esc, iso, isoBox, union } from "@/engine/svg/iso"

/** ligne d'étiquette : 8 px muted, 9 px état, 11 px gras compteur */
export type Ligne = { t: string; c: string; fs: 8 | 9 | 11; gras?: boolean }
/** objet de salle : `corps` trié par profondeur, `label` posé au-dessus de tout */
export type Objet = Drawn & { corps: string; label: string }

const VB_W = 700 // viewBox de la salle (salle.ts)
const VB_H = 480
const MARGE = 3
const INTER = 2 // interligne
const ESP = 0.5 // letter-spacing
const FOND = "#05070c" // plaque v1 (`.tour-plaque`)

/** T110 : étiquette centrée sous (x, y), 1-2 lignes sur fond α .85, gardée dans le viewBox */
export function etiquette(x: number, y: number, lignes: Ligne[]): Drawn {
	// monospace : 1 car. ≈ 0,6 em
	const w = Math.max(...lignes.map((l) => l.t.length * (0.6 * l.fs + ESP)))
	const h = lignes.reduce((s, l) => s + l.fs, 0) + INTER * (lignes.length - 1)
	const [W, H] = [w + 2 * MARGE, h + 2 * MARGE]
	const x0 = Math.min(Math.max(x - W / 2, 0), VB_W - W)
	const y0 = Math.min(Math.max(y, 0), VB_H - H)
	const cx = x0 + W / 2
	let base = y0 + MARGE
	const textes = lignes
		.map((l) => {
			const ty = base + l.fs * 0.82
			base += l.fs + INTER
			return `<text x="${cx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="${l.fs}" letter-spacing="${ESP}"${l.gras ? ` font-weight="700"` : ""} fill="${l.c}">${esc(l.t)}</text>`
		})
		.join("")
	return {
		svg: `<g class="v1-etiquette"><title>${esc(lignes.map((l) => l.t).join(" "))}</title><rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}" rx="2" fill="${FOND}" fill-opacity=".85"/>${textes}</g>`,
		box: [x0, y0, x0 + W, y0 + H],
	}
}

const objet = (corps: string, l: Drawn, box: Drawn["box"]): Objet => ({
	corps,
	label: l.svg,
	svg: corps + l.svg,
	box: union(box, l.box),
})

/** v1 */
export function rack(gx: number, gy: number, n: number, flash = false): Objet {
	const [x, y] = iso(gx + 0.45, gy + 0.9, 0)
	const leds = Array.from(
		{ length: 8 },
		(_, i) => `
    <rect class="led" x="${(x - 15).toFixed(1)}" y="${(y - 88 + i * 10).toFixed(1)}" width="26" height="5" rx="1"
          fill="${i < n ? "#22e07a" : "#1c2030"}" style="animation-delay:${(i * 0.3).toFixed(1)}s"/>`,
	).join("")
	const l = etiquette(x, y + 9, [{ t: "VAULT", c: "#7c8aa6", fs: 9 }])
	return objet(
		`<g${flash ? ` class="vault-flash"` : ""}>${boite(gx, gy, 0, 0.9, 0.9, 4.6, "#171b27")}${leds}</g>`,
		l,
		isoBox(gx, gy, 0, 0.9, 0.9, 4.6),
	)
}

// pas de tir de la fusée : dalle 0,6 × 0,6 case, ombre v1 ; centre arrondi au px
function pasDeTir(gx: number, gy: number) {
	const [cx, cy] = iso(gx + 0.5, gy + 0.5, 0)
	const [x, y] = [Math.round(cx), Math.round(cy)]
	const svg = `<ellipse cx="${x}" cy="${y + 1}" rx="15" ry="7.5" fill="#000" opacity=".3"/>${boite(gx + 0.2, gy + 0.2, 0, 0.6, 0.6, 0.15, "#2a3042")}`
	return { x, y, b: y - 3, svg }
}

const libelleVague = (x: number, y: number, actif: boolean) =>
	etiquette(x, y + 12, [
		{
			t: actif ? "VAGUE EN COURS" : "AUCUNE VAGUE",
			c: actif ? "#ff8a3d" : "#7c8aa6",
			fs: 9,
		},
	])

/** T110 F1 : fusée verticale sur pas de tir ; active = flamme 0,4 s + tremblement 2 px */
export function fusee(gx: number, gy: number, actif: boolean): Objet {
	const { x, y, b, svg } = pasDeTir(gx, gy)
	const G = "#3d465c"
	const flamme = actif
		? `<g class="v1-flamme"><path d="M-3 0h6l-3 9z" fill="#ff8a3d"/><path d="M-1.5 0h3l-1.5 5z" fill="#ffcc33"/></g>`
		: ""
	const corps = `<g>${svg}
    <g transform="translate(${x},${b})">
      <rect x="-11" y="-22" width="2" height="22" fill="${G}"/><rect x="-9" y="-17" width="4" height="1" fill="${G}"/><rect x="-9" y="-9" width="4" height="1" fill="${G}"/>
      <g${actif ? ` class="v1-tremble"` : ""}>${flamme}
        <path d="M-4 -9 L-8 -3 L-8 0 L-4 -3Z" fill="#ff3b5c"/><path d="M4 -9 L8 -3 L8 0 L4 -3Z" fill="#b82a44"/>
        <rect x="-3" y="-3" width="6" height="3" fill="${G}"/>
        <rect x="-4" y="-19" width="4" height="16" fill="#e8eefc"/><rect x="0" y="-19" width="4" height="16" fill="#aab4cc"/>
        <path d="M-4 -19 L0 -27 L0 -19Z" fill="#ff3b5c"/><path d="M0 -27 L4 -19 L0 -19Z" fill="#b82a44"/>
        <rect x="-4" y="-7" width="8" height="1" fill="${G}"/>
        <rect x="-3" y="-16" width="6" height="6" fill="${G}"/><rect x="-2" y="-15" width="4" height="4" fill="#2de2e6"/>
        <rect x="-1" y="-6" width="2" height="6" fill="#ff3b5c"/>
      </g>
    </g></g>`
	return objet(corps, libelleVague(x, y, actif), [
		x - 20,
		y - 31,
		x + 20,
		y + 10,
	])
}

type Rond = [number, number, number]

/** boule de papier froissé : ombre 1 px, disque blanc cassé, 3 plis */
const boule = ([cx, cy, r]: Rond) =>
	`<circle cx="${cx + 1}" cy="${cy + 1}" r="${r}" fill="#6d6a5e" opacity=".6"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ece8dc"/><path d="M${cx - 0.6 * r} ${cy - 0.1 * r}L${cx - 0.1 * r} ${cy + 0.3 * r}L${cx + 0.4 * r} ${cy - 0.4 * r}M${cx + 0.1 * r} ${cy + 0.5 * r}L${cx + 0.3 * r} ${cy + 0.1 * r}" stroke="#a9a493" stroke-width=".5" fill="none"/>`

const BOULES: Rond[] = [
	[-5.5, -27.5, 4.2],
	[5, -27.5, 4.5],
	[0, -31, 4],
]
const BOULES_PLEINE: Rond[] = [[-9.5, -25.5, 3.5], [10, -25, 3.5], ...BOULES]
const BOULE_SOL: Rond = [-12.5, -1.5, 3]
const MAILLE = [-1, -0.6, -0.2, 0.2, 0.6]

/** P1 : corbeille de bureau grillagée (cône, 2 familles de mailles α .6), boules de papier ; origine = pied */
function corbeilleGrillee(n: number): string {
	const [haut, bas, rh, rb] = [-22, -1, 12, 8]
	const y = (v: number, base: number, ry: number) =>
		(base + ry * Math.sqrt(1 - v * v)).toFixed(1)
	const trait = (a: number, b: number) =>
		`M${(rh * a).toFixed(1)} ${y(a, haut, 3.5)}L${(rb * b).toFixed(1)} ${y(b, bas, 2.5)}`
	const mailles = (sens: 1 | -1) =>
		MAILLE.map((s) => trait(sens * s, sens * (s + 0.4))).join("")
	const boules = n <= 0 ? [] : n >= 20 ? BOULES_PLEINE : BOULES
	return `<g>
    <ellipse cx="0" cy=".5" rx="14" ry="6.5" fill="#000" opacity=".3"/>
    <path d="M-12 ${haut}L-8 ${bas}A8 2.5 0 0 0 8 ${bas}L12 ${haut}Z" fill="#232a3c" stroke="#07090f" stroke-width=".7" stroke-linejoin="round"/>
    <ellipse cx="0" cy="${haut}" rx="12" ry="3.5" fill="#0d1018" stroke="#07090f" stroke-width=".7"/>
    ${boules.map(boule).join("")}
    <path d="${mailles(1)}${mailles(-1)}" stroke="#b8c3da" stroke-width=".5" stroke-opacity=".6" fill="none"/>
    <path d="M-12 ${haut}A12 3.5 0 0 0 12 ${haut}" stroke="#c3cde0" stroke-width="1" fill="none"/>
    <path d="M-8 ${bas}A8 2.5 0 0 0 8 ${bas}" stroke="#7c8aa6" stroke-width=".8" fill="none"/>
    <path d="M-4.5 -19V-4" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>
    ${n >= 20 ? boule(BOULE_SOL) : ""}</g>`
}

/** corbeille « ABANDONNÉES n » : P1 grillagée ; T110 : libellé 2 lignes sous l'objet */
export function poubelle(gx: number, gy: number, n: number): Objet {
	const [x, y] = iso(gx + 0.4, gy + 0.8, 0)
	const l = etiquette(x, y + 9, [
		{ t: "ABANDONNÉES", c: "#7c8aa6", fs: 8 },
		{ t: String(n), c: "#c9d2e2", fs: 11, gras: true },
	])
	const corps = `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${corbeilleGrillee(n)}</g>`
	return objet(corps, l, [x - 16, y - 36, x + 15, y + 7])
}
