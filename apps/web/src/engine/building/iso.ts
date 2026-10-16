// Projection isométrique et primitives de dessin (sans DOM : ctx reçu en paramètre)

export const TW = 32
export const TH = 16
export const ZH = 20
export const OX = 300
export const OY = 120
// repère logique
export const LW = 700
export const LH = 480

export type Pt = [number, number]
export type Proj = (x: number, y: number, z: number) => Pt

export function iso(x: number, y: number, z = 0): Pt {
	return [OX + (x - y) * TW, OY + (x + y) * TH - z * ZH]
}

// échelle `meet` centrée du repère logique dans w×h px CSS
export function meet(
	w: number,
	h: number,
): { s: number; ox: number; oy: number } {
	const s = Math.min(w / LW, h / LH)
	return { s, ox: (w - LW * s) / 2, oy: (h - LH * s) / 2 }
}

function canaux(couleur: string): [number, number, number] | null {
	const c = couleur.trim()
	if (c.startsWith("#")) {
		const hex = c.slice(1)
		const parts =
			hex.length === 3
				? hex.split("").map((ch) => ch + ch)
				: [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
		const n = parts.map((p) => Number.parseInt(p, 16))
		return n.some(Number.isNaN) ? null : [n[0], n[1], n[2]]
	}
	const m = /^rgba?\(([^)]+)\)$/.exec(c)
	if (!m) return null
	const n = m[1]
		.split(/[\s,/]+/)
		.slice(0, 3)
		.map(Number)
	return n.length === 3 && !n.some(Number.isNaN) ? [n[0], n[1], n[2]] : null
}

// f=.60 face gauche, .42 face droite, 1 dessus ; couleur inconnue ⇒ inchangée
export function ombrer(couleur: string, f: number): string {
	const c = canaux(couleur)
	if (!c || f === 1) return couleur
	const v = c.map((n) => Math.round(Math.min(255, n * f)))
	return `rgb(${v[0]} ${v[1]} ${v[2]})`
}

export function polygone(
	ctx: CanvasRenderingContext2D,
	pts: Pt[],
	fill?: string,
	stroke?: string,
) {
	ctx.beginPath()
	ctx.moveTo(pts[0][0], pts[0][1])
	for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
	ctx.closePath()
	if (fill) {
		ctx.fillStyle = fill
		ctx.fill()
	}
	if (stroke) {
		ctx.strokeStyle = stroke
		ctx.stroke()
	}
}

// contour hexagonal d'une boîte (sert au hit-test et au surlignage)
export function contourBoite(
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
	proj: Proj = iso,
): Pt[] {
	return [
		proj(x, y, z + h),
		proj(x + w, y, z + h),
		proj(x + w, y, z),
		proj(x + w, y + d, z),
		proj(x, y + d, z),
		proj(x, y + d, z + h),
	]
}

export function facesBoite(
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
	proj: Proj = iso,
): { dessus: Pt[]; gauche: Pt[]; droite: Pt[] } {
	return {
		dessus: [
			proj(x, y, z + h),
			proj(x + w, y, z + h),
			proj(x + w, y + d, z + h),
			proj(x, y + d, z + h),
		],
		gauche: [
			proj(x, y + d, z + h),
			proj(x + w, y + d, z + h),
			proj(x + w, y + d, z),
			proj(x, y + d, z),
		],
		droite: [
			proj(x + w, y, z + h),
			proj(x + w, y + d, z + h),
			proj(x + w, y + d, z),
			proj(x + w, y, z),
		],
	}
}

// boîte = 3 faces (gauche, droite, dessus)
export function boite(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
	couleur: string,
	proj: Proj = iso,
) {
	const f = facesBoite(x, y, z, w, d, h, proj)
	polygone(ctx, f.gauche, ombrer(couleur, 0.6))
	polygone(ctx, f.droite, ombrer(couleur, 0.42))
	polygone(ctx, f.dessus, ombrer(couleur, 1))
}

export function texte(
	ctx: CanvasRenderingContext2D,
	s: string,
	x: number,
	y: number,
	couleur: string,
	taille: number,
	align: CanvasTextAlign = "center",
	gras = false,
) {
	ctx.font = `${gras ? "600 " : ""}${taille}px system-ui, sans-serif`
	ctx.textAlign = align
	ctx.textBaseline = "middle"
	ctx.fillStyle = couleur
	ctx.fillText(s, x, y)
}

// mascotte : billboard 23×25 px × t, pieds en (sx, sy)
export function mascotte(
	ctx: CanvasRenderingContext2D,
	sx: number,
	sy: number,
	couleur: string,
	t: number,
	oeil: string,
) {
	const w = 23 * t
	const corpsH = 12.5 * t
	const rayon = 6.9 * t
	const cy = sy - corpsH - rayon
	ctx.fillStyle = couleur
	ctx.beginPath()
	ctx.roundRect(sx - w / 2, sy - corpsH, w, corpsH, 4 * t)
	ctx.fill()
	ctx.beginPath()
	ctx.arc(sx, cy, rayon, 0, Math.PI * 2)
	ctx.fill()
	ctx.fillStyle = oeil
	ctx.beginPath()
	ctx.arc(sx - 2.6 * t, cy - 0.5 * t, 1.3 * t, 0, Math.PI * 2)
	ctx.arc(sx + 2.6 * t, cy - 0.5 * t, 1.3 * t, 0, Math.PI * 2)
	ctx.fill()
}
