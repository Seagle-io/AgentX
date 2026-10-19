// Port 1:1 du SVG de la salle v1 : mêmes chaînes,
// mêmes nombres. Couleurs v1 en dur tolérées dans `engine/svg` et nulle part
// ailleurs. Rendu par `dangerouslySetInnerHTML` : tout texte venu des
// données passe par `esc`.

export type Box = [number, number, number, number]
export type Label = { x: number; y: number; t: string; c: string; w: number }
export type Drawn = { svg: string; box: Box }

// Couleurs de rôle relevées sur `roles.json` (7777 state.json, 2026-10-16).
export const ROLE_COLORS: [string, string][] = [
	["chef", "#3b82f6"],
	["eclaireur", "#22e07a"],
	["architecte", "#a855f7"],
	["designer", "#e879f9"],
	["implementeur", "#ff8a3d"],
	["testeur", "#818cf8"],
]
// v1
export const COLOR_BLOCKED = "#ff3b5c"

// v1
export const TW = 32
export const TH = 16
export const ZH = 20
const OX = 300
const OY = 120
export const iso = (x: number, y: number, z = 0): [number, number] => [
	OX + (x - y) * TW,
	OY + (x + y) * TH - z * ZH,
]
const pts = (arr: [number, number, number][]) =>
	arr
		.map((p) =>
			iso(...p)
				.map((n) => n.toFixed(1))
				.join(","),
		)
		.join(" ")
export const ombrer = (hex: string, f: number) => {
	const n = Number.parseInt(hex.slice(1), 16)
	const r = Math.round(((n >> 16) & 255) * f)
	const g = Math.round(((n >> 8) & 255) * f)
	const b = Math.round((n & 255) * f)
	return `rgb(${r},${g},${b})`
}
const ENTITES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
}
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITES[c])

// Emprise d'un ensemble de points ; sert au viewBox des vignettes.
export const union = (...boxes: Box[]): Box => [
	Math.min(...boxes.map((b) => b[0])),
	Math.min(...boxes.map((b) => b[1])),
	Math.max(...boxes.map((b) => b[2])),
	Math.max(...boxes.map((b) => b[3])),
]
export const isoBox = (
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
): Box => {
	const c = [x, x + w].flatMap((a) =>
		[y, y + d].flatMap((b) => [z, z + h].map((e) => iso(a, b, e))),
	)
	return [
		Math.min(...c.map((p) => p[0])),
		Math.min(...c.map((p) => p[1])),
		Math.max(...c.map((p) => p[0])),
		Math.max(...c.map((p) => p[1])),
	]
}

/** v1 boîte isométrique : face du dessus + deux faces visibles */
export function boite(
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
	couleur: string,
	extra = "",
) {
	const t = `stroke="#07090f" stroke-width=".7" stroke-linejoin="round"`
	return `
    <polygon points="${pts([
			[x, y + d, z],
			[x + w, y + d, z],
			[x + w, y + d, z + h],
			[x, y + d, z + h],
		])}" fill="${ombrer(couleur, 0.6)}" ${t} ${extra}/>
    <polygon points="${pts([
			[x + w, y, z],
			[x + w, y + d, z],
			[x + w, y + d, z + h],
			[x + w, y, z + h],
		])}" fill="${ombrer(couleur, 0.42)}" ${t} ${extra}/>
    <polygon points="${pts([
			[x, y, z + h],
			[x + w, y, z + h],
			[x + w, y + d, z + h],
			[x, y + d, z + h],
		])}" fill="${couleur}" ${t} ${extra}/>`
}

/** v1 étiquette sur fond plein */
export const etiquette = (l: Label): Drawn => ({
	svg: `
    <g>
      <rect x="${(l.x - l.w / 2 - 5).toFixed(1)}" y="${(l.y - 8).toFixed(1)}"
            width="${(l.w + 10).toFixed(1)}" height="11" rx="2" fill="#05070c"/>
      <text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="middle"
            font-family="ui-monospace,monospace" font-size="7.5" letter-spacing="1"
            fill="${l.c}">${esc(l.t)}</text>
    </g>`,
	box: [l.x - l.w / 2 - 5, l.y - 8, l.x + l.w / 2 + 5, l.y + 3],
})
