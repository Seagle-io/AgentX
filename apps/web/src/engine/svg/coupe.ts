// Port 1:1 de la tour v1 : coque, poste, direction (toit), cabine, plaque
// d'étage (3 étages, hF = 56) ; + toit (T130).
import { mascotte } from "@/engine/svg/fantome"
import {
	type Box,
	COLOR_BLOCKED,
	esc,
	ombrer,
	TH,
	TW,
	union,
	ZH,
} from "@/engine/svg/iso"

export type P3 = (x: number, y: number, z?: number) => [number, number]
export type Pt = [number, number, number]

// v1
export const T_NX = 7
export const T_NY = 0.7
export const T_S = 0.9
export const T_LX = 380
export const T_LW = 310
export const isoT = (
	x: number,
	y: number,
	z: number,
	ox: number,
	oy: number,
	s: number,
): [number, number] => [
	ox + (x - y) * TW * s,
	oy + (x + y) * TH * s - z * ZH * s,
]
export const polyT = (P: P3, arr: Pt[]) =>
	arr
		.map((p) =>
			P(...p)
				.map((n) => n.toFixed(1))
				.join(","),
		)
		.join(" ")
export const boxT = (P: P3, arr: Pt[]): Box => {
	const c = arr.map((p) => P(...p))
	return [
		Math.min(...c.map((p) => p[0])),
		Math.min(...c.map((p) => p[1])),
		Math.max(...c.map((p) => p[0])),
		Math.max(...c.map((p) => p[1])),
	]
}

// v1 pour n = 3
export const U = ZH * T_S
export const HZ = 56 / U
export const TS = 0.22
export const COUV_H = 0.3

/** v1 */
export function boiteT(
	P: P3,
	x: number,
	y: number,
	z: number,
	w: number,
	d: number,
	h: number,
	couleur: string,
) {
	const t = `stroke="#07090f" stroke-width=".6" stroke-linejoin="round"`
	return `<polygon points="${polyT(P, [
		[x, y + d, z],
		[x + w, y + d, z],
		[x + w, y + d, z + h],
		[x, y + d, z + h],
	])}" fill="${ombrer(couleur, 0.6)}" ${t}/>
    <polygon points="${polyT(P, [
			[x + w, y, z],
			[x + w, y + d, z],
			[x + w, y + d, z + h],
			[x + w, y, z + h],
		])}" fill="${ombrer(couleur, 0.42)}" ${t}/>
    <polygon points="${polyT(P, [
			[x, y, z + h],
			[x + w, y, z + h],
			[x + w, y + d, z + h],
			[x, y + d, z + h],
		])}" fill="${couleur}" ${t}/>`
}

export type Lum = "allume" | "vide" | "eteint"
const LUMIERE: Record<Lum, [string, string]> = {
	allume: ["#242d42", "#1a2131"],
	vide: ["#11151f", "#0e1119"],
	eteint: ["#0b0d13", "#090b10"],
}

/** v1 un poste : bureau ; `ecran` false = immeuble v2 (0 écran, humain) */
export function posteTour(
	P: P3,
	x: number,
	zs: number,
	taille: number,
	c: string,
	occupe: boolean,
	ecran = true,
) {
	const u = P(0, 0, 0)[1] - P(0, 0, 1)[1] // px par unité z, selon l'échelle de `P`
	const hDesk = (9 * taille) / u
	const [ex, ey] = P(x, 0.14, zs + hDesk)
	const [lx, ly] = P(x - 0.12, 0.5, zs)
	const w = 14 * taille
	const h = 9 * taille
	return (
		(occupe
			? `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(13 * taille).toFixed(1)}" ry="${(4.5 * taille).toFixed(1)}" fill="${c}" opacity=".3"/>`
			: "") +
		boiteT(
			P,
			x - 0.2,
			0.06,
			zs,
			0.4,
			0.2,
			hDesk,
			occupe ? "#3a4460" : "#262d40",
		) +
		(ecran
			? `<rect x="${(ex - w / 2).toFixed(1)}" y="${(ey - h - 1).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1"
            fill="#080b12" stroke="${occupe ? ombrer(c, 0.75) : "#1c2233"}" stroke-width=".8"/>`
			: "")
	)
}

/** v1 coque d'un niveau */
export function coqueTour(
	P: P3,
	z0: number,
	hz: number,
	ts: number,
	lum: Lum,
	dedans: string,
	nx = T_NX,
) {
	const [sol, mur] = LUMIERE[lum]
	const zs = z0 + ts
	const haut = z0 + hz
	const facade = `<polygon points="${polyT(P, [
		[nx, 0, zs],
		[nx, T_NY, zs],
		[nx, T_NY, haut],
		[nx, 0, haut],
	])}"
      fill="#2de2e6" fill-opacity="${lum === "allume" ? 0.07 : lum === "vide" ? 0.03 : 0}" stroke="#1c2233" stroke-width=".8"/>`
	const piliers =
		boiteT(P, 0, T_NY - 0.1, zs, 0.1, 0.1, hz - ts, "#232a3c") +
		boiteT(P, nx - 0.1, T_NY - 0.1, zs, 0.1, 0.1, hz - ts, "#232a3c")
	return `${boiteT(P, 0, 0, z0, nx, T_NY, ts, "#3a4460")}
    <polygon points="${polyT(P, [
			[0, 0, zs],
			[nx, 0, zs],
			[nx, T_NY, zs],
			[0, T_NY, zs],
		])}" fill="${sol}"/>
    <polyline class="tour-coupe" points="${polyT(P, [
			[0, T_NY, zs],
			[nx, T_NY, zs],
			[nx, 0, zs],
		])}"/>
    <polygon points="${polyT(P, [
			[0, 0, zs],
			[nx, 0, zs],
			[nx, 0, haut],
			[0, 0, haut],
		])}" fill="${mur}"/>
    <polygon points="${polyT(P, [
			[0, 0, zs],
			[0, T_NY, zs],
			[0, T_NY, haut],
			[0, 0, haut],
		])}" fill="${ombrer(mur, 0.8)}"/>
    ${dedans}${facade}${piliers}
    ${
			lum === "allume"
				? `<polyline class="tour-led" points="${polyT(P, [
						[0, T_NY, haut - 0.05],
						[nx, T_NY, haut - 0.05],
						[nx, 0, haut - 0.05],
					])}"/>`
				: ""
		}`
}

export type ChefState = "ok" | "off" | "ko"

const ACIER = "#5d6880"
const VERT = "#22e07a"
const RAIL = 0.28
/** LED du toit : allumée = couleur pleine, éteinte = α .22 ; 0 animation */
const led = (P: P3, x: number, z: number, c: string, allume: boolean) => {
	const [cx, cy] = P(x, T_NY / 2, z)
	return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="${c}" fill-opacity="${allume ? 1 : 0.22}" stroke="${ACIER}" stroke-width=".5"/>`
}

const trait = (P: P3, a: Pt, b: Pt, w: number) =>
	`<polyline points="${polyT(P, [a, b])}" fill="none" stroke="${ACIER}" stroke-width="${w}" stroke-linecap="round"/>`

/** toit posé sur la couverture (z = dessus) : terrasse, garde-corps 1 px, antenne + 2 LED (vert = chef en session, rouge = absent) */
export function coiffe(P: P3, z: number, nx: number, k: ChefState) {
	const zr = z + RAIL
	const bords: [number, number][] = [
		...Array.from({ length: 6 }, (_, i): [number, number] => [
			(i * nx) / 5,
			T_NY,
		]),
		[nx, 0],
		[0, 0],
	]
	const poteaux = bords
		.map(([x, y]) => `M${polyT(P, [[x, y, z]])}L${polyT(P, [[x, y, zr]])}`)
		.join("")
	const rail = `M${polyT(P, [
		[0, 0, zr],
		[nx, 0, zr],
		[nx, T_NY, zr],
		[0, T_NY, zr],
	])}Z`
	const ax = nx - 1
	const ay = T_NY / 2
	return `<g class="tour-toit" aria-hidden="true">
    <path d="${rail}${poteaux}" fill="none" stroke="${ACIER}" stroke-width="1" stroke-linejoin="round"/>
    ${trait(P, [ax, ay, z], [ax, ay, z + 1.45], 1.2)}${trait(P, [ax - 0.35, ay, z + 0.7], [ax + 0.35, ay, z + 0.7], 1)}
    ${led(P, ax, z + 1.1, COLOR_BLOCKED, k === "off")}${led(P, ax, z + 1.45, VERT, k === "ok")}
  </g>`
}

/** v1 direction (chef) + couverture */
export function toit(k: ChefState, chef: string) {
	const P: P3 = (x, y, z = 0) => isoT(x, y, z, 30, 80, T_S)
	const lum: Lum = k === "ok" ? "allume" : k === "off" ? "eteint" : "vide"
	const c = k === "ko" ? "#5d6880" : chef
	const zs = TS
	const x = T_NX * 0.45
	const taille = Math.min(0.95, (HZ * ZH * T_S - 8) / 34)
	const [mx, my] = P(x - 0.12, 0.5, zs)
	const svg = `<g class="tour-niv-direction tn-${lum}" style="--c:${c}">
    ${coqueTour(P, 0, HZ, TS, lum, `${posteTour(P, x, zs, taille, c, k === "ok")}<g class="tour-chef ${k}">${mascotte(mx, my + 2 * taille, c, taille)}</g>`)}
  </g>${boiteT(P, 0, 0, HZ, T_NX, T_NY, COUV_H, "#232a3c")}`
	return {
		svg,
		box: boxT(P, [
			[0, T_NY, 0],
			[T_NX, 0, 0],
			[T_NX, T_NY, 0],
			[0, 0, HZ + COUV_H],
		]),
	}
}

/** v1 gyrophare d'alerte d'un niveau (bloque : rouge) */
export const gyro = (gx: number, gy: number, c: string) =>
	`<g class="tour-gyro" transform="translate(${(gx + 8).toFixed(1)},${gy.toFixed(1)})">
      <circle class="tour-gyro-halo" r="6" fill="${c}" opacity=".25"/>
      <g class="tour-faisceau"><path d="M0 0 L12 -3 L12 3 Z" fill="${c}" opacity=".55"/></g>
      <circle r="2.4" fill="${c}"/></g>`

// v1 gaine d'ascenseur
export const XS = [-0.72, -0.08]
export const YS = [T_NY + 0.05, T_NY + 0.69]

/** v1 gaine (3 étages) + cabine ; `anime` = va-et-vient */
export function cabine(anime: boolean) {
	const P: P3 = (x, y, z = 0) => isoT(x, y, z, 40, 190, T_S)
	const zh = 3 * HZ + COUV_H + 0.4
	const avant = [
		[XS[1], YS[1]],
		[XS[0], YS[1]],
		[XS[1], YS[0]],
	]
		.map(
			([x, y]) =>
				`<polyline points="${polyT(P, [
					[x, y, 0],
					[x, y, zh],
				])}" fill="none" stroke="#2a3042" stroke-width="1"/>`,
		)
		.join("")
	const reperes = [0, HZ, 2 * HZ]
		.map(
			(z) => `<polyline points="${polyT(P, [
				[XS[0], YS[1], z + TS],
				[XS[1], YS[1], z + TS],
				[XS[1], YS[0], z + TS],
			])}"
        fill="none" stroke="#1c2233" stroke-width=".8"/>`,
		)
		.join("")
	const hc = Math.min(HZ - TS - 0.1, 1.5)
	const cab =
		boiteT(P, XS[0] + 0.06, YS[0] + 0.06, 0, 0.52, 0.52, hc, "#2b3448") +
		`<polygon points="${polyT(P, [
			[XS[0] + 0.14, YS[1] - 0.06, 0.12],
			[XS[1] - 0.1, YS[1] - 0.06, 0.12],
			[XS[1] - 0.1, YS[1] - 0.06, hc - 0.12],
			[XS[0] + 0.14, YS[1] - 0.06, hc - 0.12],
		])}"
        fill="#2de2e6" fill-opacity=".55"/>`
	const svg = `${avant}${reperes}<g class="tour-cabine${anime ? " v1-cabine-anim" : ""}" style="transform:translateY(${(-TS * U).toFixed(1)}px)"><g>${cab}</g></g>`
	return {
		svg,
		box: boxT(P, [
			[XS[0], YS[0], 0],
			[XS[1], YS[1], 0],
			[XS[0], YS[1], 0],
			[XS[1], YS[0], zh],
		]),
	}
}

/** v1 plaque d'un étage, cadre de la bande */
export function plaqueEtage(sonne: boolean) {
	const P: P3 = (x, y, z = 0) => isoT(x, y, z, 150, 120, T_S)
	const zb0 = 0
	const zt = HZ
	const [gx, y] = P(T_NX, T_NY / 2, zb0 + HZ / 2)
	const bande = polyT(P, [
		[0, T_NY, zb0],
		[T_NX, T_NY, zb0],
		[T_NX, 0, zb0],
		[T_NX, 0, zt],
		[T_NX, T_NY, zt],
		[0, T_NY, zt],
	])
	const hp = 18
	const c: Record<string, number> = { "en-cours": 2, revue: 1, bloque: 0 }
	const cpt = (
		[
			["en-cours", "en"],
			["revue", "rv"],
			["bloque", "bl"],
		] as const
	)
		.map(([cle, cl], j) => {
			const x = T_LX + T_LW - 6 - (3 - j) * 24
			return `<g class="tour-c ${cl}${c[cle] ? "" : " nul"}"><rect x="${x}" y="${(y - hp / 2 + 3).toFixed(1)}" width="22" height="12" rx="2"/>
        <text x="${x + 11}" y="${(y - hp / 2 + 12).toFixed(1)}" text-anchor="middle">${c[cle]}</text></g>`
		})
		.join("")
	const svg = `${coqueTour(P, zb0, HZ, TS, "allume", "")}
    <g class="tour-etage${sonne ? " sonne v1-boucle" : ""}" style="--c:">
      <polygon class="tour-cadre" points="${bande}"/>
      <polyline class="tour-renvoi" points="${(gx + 14).toFixed(1)},${y.toFixed(1)} ${T_LX - 10},${y.toFixed(1)} ${T_LX},${y.toFixed(1)}" fill="none"/>
      <rect class="tour-plaque" x="${T_LX}" y="${(y - hp / 2).toFixed(1)}" width="${T_LW}" height="${hp}" rx="2"/>
      <text class="tour-lbl" x="${T_LX + 8}" y="${(y - hp / 2 + 12.5).toFixed(1)}"><tspan class="tour-num">É1</tspan> · ${esc("salle-v2")}</text>
      ${cpt}
    </g>`
	return {
		svg,
		box: union(
			boxT(P, [
				[0, T_NY, 0],
				[T_NX, 0, 0],
				[0, 0, HZ],
			]),
			[T_LX, y - hp / 2, T_LX + T_LW, y + hp / 2],
		),
	}
}
