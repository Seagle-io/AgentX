// Immeuble v2 hors des étages : plaques (étage, chef), gaine + cabine.
// Colonne de plaques à droite du dessin. Géométrie v1 pour n étages.
import {
	boiteT,
	type ChefState,
	COUV_H,
	gyro,
	type P3,
	polyT,
	T_NX,
	T_NY,
	TS,
	XS,
	YS,
} from "@/engine/svg/coupe"
import { COLOR_BLOCKED, esc, ROLE_COLORS } from "@/engine/svg/iso"

export type Compteurs = { enCours: number; revue: number; bloque: number }
export type Alerte = { niveau: string; texte: string }

const f1 = (n: number) => n.toFixed(1)
export const CHEF = ROLE_COLORS[0][1]
const JAUNE = "#ffcc33"
// Libellés de plaque : constantes engine tolérées (règle 8, cf. T066).
const ETAT: Record<ChefState, string> = {
	ok: "● en session",
	off: "○ hors session",
	ko: "○ état inconnu",
}
// Profondeur du sous-sol, terre autour (unités z).
export const SS = 1.6
export const TERRE = SS + TS + 0.4

// Plaques (T130) : texte 11 px ; colonne x 398-648 (viewBox 648).
export const PLAQUE_X = 398
export const PLAQUE_W = 250
const PAD = 8
const CAR = 6.6 // largeur d'un caractère mono 11 px
const TXT = `style="font-size:11px"`
const H_BASE = 37
const H_ALERTE = 46

const court = (t: string, n: number) =>
	t.length > n ? `${t.slice(0, n - 1)}…` : t
const nCar = Math.floor((PLAQUE_W - 2 * PAD) / CAR)
/** px de viewBox d'un étage (échelle de `P`) */
const pas = (P: P3, hz: number) => P(0, 0, 0)[1] - P(0, 0, hz)[1]

/** milieu de la façade d'un niveau : départ du renvoi vers la plaque */
const ancre = (P: P3, z0: number, hz: number, nx: number) =>
	P(nx, T_NY / 2, z0 + hz / 2)

const renvoi = (gx: number, y: number) =>
	`<polyline class="tour-renvoi" points="${f1(gx + 14)},${f1(y)} ${PLAQUE_X - 10},${f1(y)} ${PLAQUE_X},${f1(y)}" fill="none"/>`

/** pose une plaque de hauteur `h` : colonne droite + renvoi */
function pose(
	P: P3,
	z0: number,
	hz: number,
	h: number,
	corps: (x: number, y: number) => string,
) {
	const [gx, y] = ancre(P, z0, hz, T_NX)
	return `${renvoi(gx, y)}${corps(PLAQUE_X, y - h / 2)}`
}

const fond = (x: number, y: number, h: number) =>
	`<rect class="tour-plaque" x="${f1(x)}" y="${f1(y)}" width="${PLAQUE_W}" height="${h}" rx="2"/>`

/** gyro rouge si bloqué ou choix en attente (ou blocage compté sans alerte), jaune sinon */
const couleurAlerte = (a: Alerte, c: Compteurs) =>
	a.niveau === "bloque" ||
	a.niveau === "choix" ||
	(a.niveau === "" && c.bloque > 0)
		? COLOR_BLOCKED
		: JAUNE

export type PlaqueEtage = {
	slug: string
	titre: string
	num: number
	compteurs: Compteurs
	alerte: Alerte
	selection: boolean
}

/** plaque d'un étage : É n · titre, 3 compteurs, ligne d'alerte (3 rangées) */
function carteEtage(e: PlaqueEtage, h: number, ligne: boolean) {
	const c = e.compteurs
	return (x: number, y: number) => {
		const chips = (
			[
				["enCours", "en"],
				["revue", "rv"],
				["bloque", "bl"],
			] as const
		)
			.map(([cle, cl], j) => {
				const cx = x + PAD + j * 26
				return `<g class="tour-c ${cl}${c[cle] ? "" : " nul"}"><rect x="${f1(cx)}" y="${f1(y + 19)}" width="22" height="12" rx="2"/>
        <text x="${f1(cx + 11)}" y="${f1(y + 28)}" text-anchor="middle">${c[cle]}</text></g>`
			})
			.join("")
		return `${fond(x, y, h)}
      <text class="tour-lbl" ${TXT} x="${f1(x + PAD)}" y="${f1(y + 14)}"><tspan class="tour-num">É${e.num}</tspan> · ${esc(court(e.titre.split(" : ")[0], nCar - 5))}</text>
      ${chips}
      ${ligne ? `<text class="tour-al ${esc(e.alerte.niveau)}" ${TXT} x="${f1(x + PAD)}" y="${f1(y + h - 6)}">${esc(court(e.alerte.texte, nCar))}</text>` : ""}`
	}
}

/** v1 plaque d'un étage : É n · titre, 3 compteurs, alerte + gyro */
export function plaqueEtage(P: P3, z0: number, hz: number, e: PlaqueEtage) {
	const nx = T_NX
	const c = e.compteurs
	const alerte = e.alerte.niveau !== "" || c.bloque > 0
	const ligne = e.alerte.texte !== ""
	const h = ligne ? Math.min(H_ALERTE, pas(P, hz) - 3) : H_BASE
	const bande = polyT(P, [
		[0, T_NY, z0],
		[nx, T_NY, z0],
		[nx, 0, z0],
		[nx, 0, z0 + hz],
		[nx, T_NY, z0 + hz],
		[0, T_NY, z0 + hz],
	])
	const label = `Étage ${e.num}, ${e.titre}, ${c.enCours} en cours, ${c.bloque} bloqués`
	const [ax, ay] = P(nx, T_NY * 0.1, z0 + hz * 0.75)
	return `<g class="tour-etage${e.selection ? " sel" : ""}" data-slug="${esc(e.slug)}" tabindex="0" role="button" aria-label="${esc(label)}"${e.selection ? ` aria-current="page"` : ""}>
      <title>${esc(e.titre)}</title>
      <polygon class="tour-cadre" points="${bande}"/>
      ${pose(P, z0, hz, h, carteEtage(e, h, ligne))}
      ${alerte ? gyro(ax - 8, ay, couleurAlerte(e.alerte, c)) : ""}
    </g>`
}

/** v1 plaque du niveau chef : état de session, todo, urgent */
export function plaqueChef(
	P: P3,
	z0: number,
	hz: number,
	num: number,
	k: ChefState,
	todo: number,
	urgent: number,
) {
	const label = `Dernier étage, chef de projet, ${ETAT[k].slice(2)}, todo ${todo}, ${urgent} urgent`
	const h = H_BASE
	const dim = `todo ${todo} · ${urgent} urgent`
	const etat = `<tspan class="tour-etat ${k}"`
	const lignes = (x: number, y: number) =>
		`<text class="tour-lbl" ${TXT} x="${f1(x + PAD)}" y="${f1(y + 14)}"><tspan fill="${CHEF}">É${num} · CHEF</tspan>${etat} dx="10">${ETAT[k]}</tspan></text>
      <text class="tour-lbl tour-dim" ${TXT} x="${f1(x + PAD)}" y="${f1(y + 29)}">${dim}</text>`
	return `<g class="tour-direction" style="--c:${CHEF}" role="img" aria-label="${label}">
      ${pose(P, z0, hz, h, (x, y) => `${fond(x, y, h)}${lignes(x, y)}`)}
    </g>`
}

/** v1 gaine (n niveaux + chef) + cabine posée au niveau `cible` */
export function gaine(P: P3, niveaux: number, hz: number, cible: number) {
	const u = pas(P, 1) // px par unité z (échelle de `P`)
	const zh = niveaux * hz + COUV_H + 0.4
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
	const reperes = Array.from({ length: niveaux }, (_, k) => k * hz)
		.map(
			(z) =>
				`<polyline points="${polyT(P, [
					[XS[0], YS[1], z + TS],
					[XS[1], YS[1], z + TS],
					[XS[1], YS[0], z + TS],
				])}" fill="none" stroke="#1c2233" stroke-width=".8"/>`,
		)
		.join("")
	const hc = Math.min(hz - TS - 0.1, 1.5)
	const cab =
		boiteT(P, XS[0] + 0.06, YS[0] + 0.06, 0, 0.52, 0.52, hc, "#2b3448") +
		`<polygon points="${polyT(P, [
			[XS[0] + 0.14, YS[1] - 0.06, 0.12],
			[XS[1] - 0.1, YS[1] - 0.06, 0.12],
			[XS[1] - 0.1, YS[1] - 0.06, hc - 0.12],
			[XS[0] + 0.14, YS[1] - 0.06, hc - 0.12],
		])}" fill="#2de2e6" fill-opacity=".55"/>`
	const dy = -(cible * hz + TS) * u
	return `<g class="tour-cabine" aria-hidden="true" style="transform:translateY(${f1(dy)}px)"><g>${cab}</g></g><g aria-hidden="true">${avant}${reperes}</g>`
}
