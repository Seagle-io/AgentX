// Immeuble « à plat » : coupe frontale, un niveau par rangée. Mêmes fantômes
// (mascotte v1, bob/clignement/frange, yeux rouges si bloqué) et mêmes états de
// lumière que la tour iso ; dessin plat pour remplir une colonne.
// Les gabarits SVG sont hors formatage (biome-ignore) : lignes denses, une par élément.
import { GLOW_DEFS, mascotte } from "@/engine/svg/fantome"
import { COLOR_BLOCKED, esc } from "@/engine/svg/iso"
import { CHEF } from "@/engine/svg/plaque"
import { type Fantome, fantomes, type TourAgent } from "@/engine/svg/tour"

export type NiveauLum = "allume" | "vide" | "eteint"
export type ChefEtat = "ok" | "off" | "ko" // vivant true|false|null
export type ServeurPlat = {
	nom: string
	etat: "ok" | "warn" | "ko"
	latence_ms: number | null
}
export type Clos = { titre: string; statut: string; maj: string }
type Cadre = { x: number; y: number; w: number; h: number }
// biome-ignore format: tables denses
export type NiveauPlatOpts = {
	agents?: TourAgent[]; lum?: NiveauLum; W?: number; H?: number; postes?: number
	chef?: ChefEtat | null; selection?: boolean; id?: string; taille?: number | null; serveurs?: ServeurPlat[]
	cadre?: Cadre // interne : <svg> imbriqué dans immeubleGrand
}
// biome-ignore format: tables denses
export type EtageGrand = {
	slug: string; num: number; court: string; agents: TourAgent[]; lum: NiveauLum; selection: boolean
	logo: string; logoCouleur: string; branche: string; enCours: number; revue: number; bloque: number
	alerte: boolean; alerteCouleur: string; serveurs: ServeurPlat[]
}
// contexte "" ⇒ non affiché
export type ToitGrand = {
	todo: number
	urgent: number
	chefsN: number
	contexte: string
}

const f1 = (n: number) => n.toFixed(1)
// biome-ignore format: tables denses
const MUR: Record<NiveauLum, string[]> = {
	allume: ["#1b2336", "#0f1420", "#242e45"],
	vide: ["#121724", "#0b0e16", "#171d2c"],
	eteint: ["#0b0e15", "#07090e", "#0f1219"],
}
const LED = { ok: "#22e07a", warn: "#ffcc33", ko: "#ff3b5c" }
const TERRE = `<pattern id="ig-terre" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#262c3e" stroke-width="1.2"/></pattern>`

export const PF_CSS = `
.pf-scene text{font-family:var(--font-mono,ui-monospace,monospace)}
.pf-scene .tour-agent .mascotte{animation:v1-bob 2.8s ease-in-out infinite}
.pf-scene .tour-agent .eye,.pf-scene .tour-chef.ok .eye{animation:v1-blink 5.2s infinite}
.pf-scene .tour-agent .v1-frange,.pf-scene .tour-chef.ok .v1-frange{animation:v1-frange 1.2s ease-in-out infinite}
.pf-scene .tour-chef.ok .mascotte{animation:v1-bob 2.8s ease-in-out infinite}
.pf-scene .pf-led{animation:v1-led 2.4s linear infinite}
`

// Balise <svg> : autonome (100 %) ou imbriquée dans `cadre` (étirée, sans style)
// biome-ignore format: gabarit SVG dense
function ouvrir(W: number, H: number, ratio: string, cls: string, cadre?: Cadre) {
	const vb = `viewBox="0 0 ${W} ${H}"`
	if (cadre) return `<svg class="${cls}" x="${f1(cadre.x)}" y="${f1(cadre.y)}" width="${f1(cadre.w)}" height="${f1(cadre.h)}" ${vb} preserveAspectRatio="none" aria-hidden="true">`
	return `<svg class="${cls}" ${vb} preserveAspectRatio="${ratio}" style="display:block;width:100%;height:100%" aria-hidden="true">`
}

// biome-ignore format: gabarit SVG dense
function bureau(x: number, y: number, s: number, c: string, occupe: boolean) {
	const w = 46 * s
	const h = 5 * s
	return `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="1.5" fill="${occupe ? "#3a4460" : "#262d40"}" stroke="#07090f" stroke-width=".6"/>
  <rect x="${f1(x - w / 2 + 3)}" y="${f1(y + h)}" width="${f1(3 * s)}" height="${f1(14 * s)}" fill="#1f2638"/>
  <rect x="${f1(x + w / 2 - 3 - 3 * s)}" y="${f1(y + h)}" width="${f1(3 * s)}" height="${f1(14 * s)}" fill="#1f2638"/>
  ${occupe ? `<rect x="${f1(x - 8 * s)}" y="${f1(y - 11 * s)}" width="${f1(16 * s)}" height="${f1(10 * s)}" rx="1" fill="#080b12" stroke="${c}" stroke-opacity=".8" stroke-width=".8"/><rect x="${f1(x - 6 * s)}" y="${f1(y - 9 * s)}" width="${f1(12 * s)}" height="${f1(6 * s)}" fill="${c}" opacity=".18"/>` : ""}`
}

// biome-ignore format: gabarit SVG dense
function fantome(mx: number, my: number, f: Fantome, s: number, k: number) {
	const m = mascotte(mx, my, f.couleur, s, k * 0.37, f.bloque ? COLOR_BLOCKED : undefined)
	const corps = f.bloque ? `<g class="v1-bloque">${m}</g>` : !f.travail && f.rendu ? `<g class="v1-rendu">${m}</g>` : m
	return `<g${f.travail ? ` class="tour-agent"` : ""} data-role="${esc(f.role)}">${corps}</g>`
}

// baie serveurs : 1 LED par serveur (vert ok, jaune warn, rouge ko), à gauche de la fenêtre
// biome-ignore format: gabarit SVG dense
function baie(serveurs: ServeurPlat[], rx: number, ySol: number, H: number) {
	if (!serveurs.length) return ""
	const rackH = Math.min(H - 30, 18 + serveurs.length * 12 + 6)
	const ry = ySol - rackH
	const titre = serveurs.map((v) => `${v.nom} · ${v.etat}${v.latence_ms != null ? ` · ${v.latence_ms} ms` : ""}`).join(" / ")
	const classe = (e: ServeurPlat["etat"]) => (e === "ko" ? ' class="tour-gyro-halo"' : e === "ok" ? ' class="pf-led"' : "")
	const unites = serveurs.map((v, k) => `<rect x="${rx + 3}" y="${f1(ry + 6 + k * 12)}" width="16" height="8" rx="1" fill="#0b0e15"/><circle cx="${rx + 16}" cy="${f1(ry + 10 + k * 12)}" r="1.7" fill="${LED[v.etat]}"${classe(v.etat)}/><rect x="${rx + 5}" y="${f1(ry + 9 + k * 12)}" width="6" height="1.5" fill="#2a3042"/>`).join("")
	return `<g><title>${esc(titre)}</title>
    <rect x="${rx}" y="${f1(ry)}" width="22" height="${f1(rackH)}" rx="1.5" fill="#141a28" stroke="#07090f" stroke-width=".7"/>
    ${unites}
  </g>`
}

// biome-ignore format: gabarit SVG dense
function fenetreSvg(W: number, H: number, id: string, allume: boolean, fw: number, fh: number) {
	return `<rect x="${W - fw - 16}" y="14" width="${fw}" height="${fh}" rx="2" fill="url(#pf-fen${id})" stroke="rgba(45,226,230,${allume ? ".35" : ".15"})" stroke-width=".8"/><line x1="${W - 16 - fw / 2}" y1="16" x2="${W - 16 - fw / 2}" y2="${H - 30}" stroke="#0a0d14" stroke-width="1.2"/><line x1="${W - fw - 14}" y1="${14 + fh / 2}" x2="${W - 18}" y2="${14 + fh / 2}" stroke="#0a0d14" stroke-width="1.2"/>`
}

// biome-ignore format: gabarit SVG dense
const defsNiveau = (id: string) => `<defs>${GLOW_DEFS}
    <linearGradient id="pf-fen${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ef0f4" stop-opacity=".18"/><stop offset="1" stop-color="#2de2e6" stop-opacity=".05"/></linearGradient>
    <linearGradient id="pf-cone${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a" stop-opacity=".16"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient>
    <linearGradient id="pf-mur${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>`

// Postes : cône de lumière + bureau + fantôme (ou chef) par emplacement
// biome-ignore format: gabarit SVG dense
function postesPlat(xs: number[], montres: Fantome[], chef: ChefEtat | null, s: number, ySol: number, yDesk: number, allume: boolean, id: string) {
	const cones = allume ? xs.map((x, k) => (montres[k] ? `<path d="M${f1(x - 5 * s)} 6 L${f1(x - 24 * s)} ${f1(ySol)} L${f1(x + 24 * s)} ${f1(ySol)} L${f1(x + 5 * s)} 6Z" fill="url(#pf-cone${id})"/>` : "")).join("") : ""
	const postes = xs.map((x, k) => {
		const f = montres[k]
		const corps = chef ? `<g class="tour-chef ${chef}">${mascotte(x, yDesk + 6 * s, montres[0].couleur, s)}</g>` : f ? fantome(x, yDesk + 6 * s, f, s, k) : ""
		return `${bureau(x, yDesk, s * 0.9, f?.couleur ?? "#262d40", !!f)}${corps}`
	}).join("")
	return { cones, postes }
}

/**
 * Un niveau à plat. `agents` = TourAgent[] ; `lum` allume|vide|eteint ;
 * `W`,`H` = viewBox ; `postes` = bureaux fixes ; `chef` = état du chef (ok|off|ko) à la place des agents.
 */
// biome-ignore format: gabarit SVG dense
export function niveauPlat(o: NiveauPlatOpts): string {
	const { agents = [], lum = "vide", W = 360, H = 120, postes = 3, chef = null } = o
	const { selection = false, id = "", taille = null, serveurs = [], cadre } = o
	const [mur, sol, plinthe] = MUR[lum]
	const s = taille ?? Math.min(2.2, Math.max(1.2, (H - 34) / 34))
	const ySol = H - 12
	const yDesk = ySol - 17 * s
	const cf: Fantome = { role: "chef", couleur: chef === "ko" ? "#5d6880" : CHEF, travail: chef === "ok", bloque: false, rendu: false }
	const tous = chef ? [cf] : fantomes(agents)
	const n = chef ? 1 : postes
	const pas = Math.min(60 * s, (W - 90) / Math.max(1, n))
	const x0 = chef ? W * 0.45 : 30 + pas / 2
	const xs = Array.from({ length: n }, (_, k) => x0 + k * pas)
	const allume = lum === "allume"
	const { cones, postes: bureaux } = postesPlat(xs, tous.slice(0, n), chef, s, ySol, yDesk, allume, id)
	const plus = tous.length > n ? `<text x="${f1(xs[n - 1] + 34 * s)}" y="${f1(yDesk - 18 * s)}" font-size="${f1(7 * s)}" fill="#8f9ab8">+${tous.length - n}</text>` : ""
	const fw = Math.min(44, W * 0.16)
	const led = allume
		? `<line class="pf-led" x1="8" y1="5" x2="${W - 8}" y2="5" stroke="#2de2e6" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>`
		: `<line x1="8" y1="5" x2="${W - 8}" y2="5" stroke="#1c2233" stroke-width="1.2" stroke-linecap="round"/>`
	return `${ouvrir(W, H, "xMidYMax meet", `v1-scene v1-tour pf-scene${selection ? " sel" : ""}`, cadre)}
  ${defsNiveau(id)}
  <rect width="${W}" height="${H}" fill="${mur}"/>
  <rect width="${W}" height="${H}" fill="url(#pf-mur${id})"/>
  <rect y="${ySol}" width="${W}" height="12" fill="${sol}"/>
  <line x1="0" y1="${ySol}" x2="${W}" y2="${ySol}" stroke="${plinthe}" stroke-width="1.4"/>
  ${cones}
  ${fenetreSvg(W, H, id, allume, fw, Math.max(20, H - 42))}
  ${led}
  ${baie(serveurs, W - fw - 16 - 30, ySol, H)}${bureaux}${plus}
</svg>`
}

// Géométrie de l'immeuble : calculée une fois, partagée par toit, plaques et rangées
// biome-ignore format: table dense
function geo(W: number, H: number, n: number) {
	const X0 = 96
	const X1 = W - 60
	const ySol = H - 96
	const yPent = 74
	const hPent = 104
	const yEt0 = yPent + hPent
	const PL = 186
	const xInt = X0 + PL + 18
	return { W, H, X0, X1, LW: X1 - X0, ySol, yToit: 34, yPent, hPent, yEt0, hEt: (ySol - yEt0) / Math.max(1, n), SH: 6, PL, xInt, wInt: X1 - xInt - 8 }
}
type Geo = ReturnType<typeof geo>

// biome-ignore format: gabarit SVG dense
function toitSvg(g: Geo) {
	const { X0, X1, LW, W, yPent, yToit } = g
	return `<path d="M${X0 - 12} ${yPent} L${X0 + 26} ${yToit} H${X1 - 26} L${X1 + 12} ${yPent}Z" fill="#111a2e" stroke="#243052" stroke-width="1.2"/>
  <rect x="${X0 - 12}" y="${yPent - 3}" width="${LW + 24}" height="6" rx="1" fill="#1f2a4a"/>
  <line x1="${W / 2}" y1="${yToit}" x2="${W / 2}" y2="${yToit - 26}" stroke="#3a4460" stroke-width="2"/>
  <circle cx="${W / 2}" cy="${yToit - 28}" r="3" fill="#ff3b5c" class="pf-led"/><circle cx="${W / 2}" cy="${yToit - 28}" r="7" fill="#ff3b5c" opacity=".2" class="pf-led"/>
  <text x="${W / 2 + 12}" y="${yToit - 24}" font-size="9" fill="#5e6a8c" letter-spacing="1.5">AGENTX · HQ</text>`
}

type PlaqueD = {
	c: string
	etiquette: string
	court: string
	logo: string
	compteurs: string
	selection: boolean
}

// biome-ignore format: gabarit SVG dense
function plaqueSvg(g: Geo, y: number, h: number, d: PlaqueD) {
	const { X0, PL } = g
	return `<rect x="${X0 + 6}" y="${f1(y + 6)}" width="${PL}" height="${f1(h - 12)}" rx="6" fill="#0c1222" stroke="${d.selection ? "rgba(45,226,230,.55)" : "#1b2440"}"/>
    <text x="${X0 + 14}" y="${f1(y + 31)}" font-size="13" font-weight="700" fill="${d.c}">${d.etiquette}</text>${d.logo}
    <text x="${X0 + 14}" y="${f1(y + 52)}" font-size="10.5" font-weight="600" fill="#e8ecf7">${esc(d.court)}</text>${d.compteurs}`
}

// biome-ignore format: gabarit SVG dense
function logoSvg(g: Geo, y: number, e: EtageGrand) {
	const c = e.logoCouleur
	return `<rect x="${g.X0 + 50}" y="${f1(y + 14)}" width="24" height="24" rx="6" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-opacity=".45"/><text x="${g.X0 + 62}" y="${f1(y + 30)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${c}">${esc(e.logo)}</text>`
}

// biome-ignore format: gabarit SVG dense
function compteursEtage(g: Geo, y: number, h: number, e: EtageGrand) {
	const { X0, PL } = g
	const br = e.branche.length > 16 ? `${e.branche.slice(0, 15)}…` : e.branche
	const alerte = e.alerte ? `<circle cx="${X0 + PL - 14}" cy="${f1(y + 26)}" r="4" fill="${e.alerteCouleur}" class="tour-gyro-halo"/><circle cx="${X0 + PL - 14}" cy="${f1(y + 26)}" r="8" fill="${e.alerteCouleur}" opacity=".18" class="pf-led"/>` : ""
	const leds = e.serveurs.map((v, k) => `<g><title>${esc(v.nom)} · ${esc(v.etat)}${v.latence_ms != null ? ` · ${v.latence_ms} ms` : ""}</title><circle cx="${X0 + 18 + k * 12}" cy="${f1(y + h - 11)}" r="3" fill="${LED[v.etat]}"/></g>`).join("")
	return `<text x="${X0 + 14}" y="${f1(y + h - 40)}" font-size="8.5" font-weight="700"><tspan fill="${e.enCours ? "#7aaaff" : "#5e6a8c"}">${e.enCours}</tspan><tspan fill="#5e6a8c" font-weight="400"> en cours · </tspan><tspan fill="${e.revue ? "#c084fc" : "#5e6a8c"}">${e.revue}</tspan><tspan fill="#5e6a8c" font-weight="400"> revue · </tspan><tspan fill="${e.bloque ? "#ff3b5c" : "#5e6a8c"}">${e.bloque}</tspan><tspan fill="#5e6a8c" font-weight="400"> bloq.</tspan></text>
         <text x="${X0 + 14}" y="${f1(y + h - 24)}" font-size="9.5" fill="#5e6a8c">${e.agents.length} agent${e.agents.length > 1 ? "s" : ""} · ⎇ ${esc(br)}</text>
         ${alerte}
         ${leds}`
}

// biome-ignore format: gabarit SVG dense
function compteursChef(g: Geo, y: number, t: ToitGrand) {
	const suite = t.contexte ? ` · ${esc(t.contexte)}` : ""
	return `<text x="${g.X0 + 14}" y="${f1(y + 70)}" font-size="9.5" fill="#8f9ab8">todo <tspan fill="#e8ecf7" font-weight="700">${t.todo}</tspan> · <tspan fill="#ff3b5c" font-weight="700">${t.urgent}</tspan> urgent</text><text x="${g.X0 + 14}" y="${f1(y + 86)}" font-size="9.5" fill="#5e6a8c">${t.chefsN} chefs${suite}</text>`
}

// biome-ignore format: gabarit SVG dense
function penthouseSvg(g: Geo, toit: ToitGrand, chef: ChefEtat) {
	const { X0, LW, yPent, hPent, yEt0, SH, xInt, wInt } = g
	const court = chef === "ok" ? "● en session" : chef === "off" ? "hors session" : "injoignable"
	const plaque = plaqueSvg(g, yPent, hPent, { c: "#7aaaff", etiquette: "CHEF", court, logo: "", compteurs: compteursChef(g, yPent, toit), selection: false })
	const interieur = niveauPlat({ lum: chef === "ok" ? "allume" : "eteint", W: wInt, H: hPent - 10, chef, taille: 2.2, id: "-ig-chef", cadre: { x: xInt, y: yPent + 5, w: wInt, h: hPent - 10 } })
	return `<g data-etage="chef"><rect x="${X0}" y="${yPent}" width="${LW}" height="${hPent}" fill="#0f1527"/>
    ${plaque}
    ${interieur}
    <rect x="${X0 - 4}" y="${f1(yEt0 - SH)}" width="${LW + 8}" height="${SH}" fill="#1f2a4a"/></g>`
}

// biome-ignore format: gabarit SVG dense
function rangeeSvg(g: Geo, e: EtageGrand, i: number) {
	const { X0, LW, PL, SH, xInt, wInt, hEt } = g
	const y = g.yEt0 + i * hEt
	const hi = hEt - SH
	const n = Math.max(2, fantomes(e.agents).length)
	const s = Math.max(1.5, Math.min(2.9, (wInt - 90) / (n * 52), (hi - 34) / 34))
	const interieur = niveauPlat({ agents: e.agents, lum: e.lum, W: wInt, H: hi - 8, postes: n, taille: s, selection: e.selection, id: `-ig-${i}`, serveurs: e.serveurs, cadre: { x: xInt, y: y + 4, w: wInt, h: hi - 8 } })
	const plaque = plaqueSvg(g, y, hi, { c: e.selection ? "#2de2e6" : "#8f9ab8", etiquette: `É${e.num}`, court: e.court, logo: logoSvg(g, y, e), compteurs: compteursEtage(g, y, hi, e), selection: e.selection })
	return `<g data-etage="${esc(e.slug)}" style="cursor:pointer">
      <rect x="${X0}" y="${f1(y)}" width="${LW}" height="${f1(hi)}" fill="${e.selection ? "#101a33" : "#0f1527"}"/>
      ${e.selection ? `<rect x="${X0 + 1}" y="${f1(y + 1)}" width="${LW - 2}" height="${f1(hi - 2)}" fill="none" stroke="#2de2e6" stroke-opacity=".6" stroke-width="1.2"/>` : ""}
      ${plaque}
      ${interieur}
      <rect x="${X0 - 4}" y="${f1(y + hi)}" width="${LW + 8}" height="${SH}" fill="#1f2a4a"/>
      ${e.selection ? `<rect x="${X0 + PL + 8}" y="${f1(y + hi / 2 - 12)}" width="8" height="24" rx="1.5" fill="#2b3448" stroke="#2de2e6" stroke-width=".8"><title>cabine</title></rect>` : ""}
    </g>`
}

// biome-ignore format: gabarit SVG dense
function sousSolGrand(g: Geo, clos: Clos[]) {
	const { X0, LW, PL, ySol, H, xInt, wInt } = g
	return `<g data-etage="sous-sol" style="cursor:pointer">
    <rect x="${X0 - 4}" y="${ySol}" width="${LW + 8}" height="${H - ySol}" fill="#0b0e15"/>
    <rect x="${X0 - 4}" y="${ySol}" width="${LW + 8}" height="${H - ySol}" fill="url(#ig-terre)" opacity=".35"/>
    <rect x="${X0 + 6}" y="${ySol + 10}" width="${PL}" height="${H - ySol - 24}" rx="6" fill="#0c1222" stroke="#1b2440"/>
    <text x="${X0 + 14}" y="${ySol + 34}" font-size="12" font-weight="700" fill="#5e6a8c">SS</text>
    <text x="${X0 + 14}" y="${ySol + 52}" font-size="10" fill="#8f9ab8">Sous-sol · ${clos.length} archives</text>
    <text x="${X0 + 14}" y="${ySol + 67}" font-size="9.5" fill="#5e6a8c">projets clos</text>
    ${sousSolSvg(clos, wInt, H - ySol - 20, { x: xInt, y: ySol + 8, w: wInt, h: H - ySol - 20 })}
  </g>`
}

// biome-ignore format: gabarit SVG dense
function ciel(g: Geo, nuit: boolean) {
	const { W, ySol } = g
	const etoiles = nuit ? Array.from({ length: 26 }, (_, k) => `<circle cx="${(k * 97) % W}" cy="${(k * 53) % (ySol - 40)}" r="${(k % 3) * 0.3 + 0.5}" fill="#dfe8ff" opacity="${0.25 + (k % 4) * 0.15}"/>`).join("") : ""
	return `<rect width="${W}" height="${g.H}" fill="url(#ig-ciel)"/>
  ${etoiles}
  <circle cx="${W - 70}" cy="60" r="110" fill="url(#ig-lune)"/>`
}

/**
 * Immeuble entier en coupe : toit + penthouse du chef, un étage par rangée avec TOUS
 * les agents à leur bureau, sous-sol enterré.
 */
// biome-ignore format: gabarit SVG dense
export function immeubleGrand(o: { etages: EtageGrand[]; toit: ToitGrand; chef: ChefEtat; clos: Clos[]; W?: number; H?: number; nuit?: boolean }): string {
	const { etages, toit, chef, clos, W = 720, H = 820, nuit = true } = o
	const g = geo(W, H, etages.length)
	const { X0, LW, PL, ySol, yEt0, yPent } = g
	const cage = `<rect x="${X0 + PL + 7}" y="${yEt0}" width="10" height="${f1(ySol - yEt0)}" fill="#0a0f1c" stroke="#1b2440" stroke-width=".6"/>`
	return `${ouvrir(W, H, "xMidYMid meet", "v1-scene v1-tour pf-scene")}
  <defs>${GLOW_DEFS}
    <linearGradient id="ig-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a16"/><stop offset="1" stop-color="#0d1426"/></linearGradient>
    <radialGradient id="ig-lune"><stop offset="0" stop-color="#7aaaff" stop-opacity=".22"/><stop offset="1" stop-color="#7aaaff" stop-opacity="0"/></radialGradient>
    ${TERRE}
  </defs>
  ${ciel(g, nuit)}
  <rect y="${ySol}" width="${W}" height="${H - ySol}" fill="#07090e"/>
  <rect y="${ySol}" width="${W}" height="${H - ySol}" fill="url(#ig-terre)" opacity=".6"/>
  <line x1="0" y1="${ySol}" x2="${W}" y2="${ySol}" stroke="#2a3042" stroke-width="2"/>
  <rect x="${X0 - 8}" y="${yPent}" width="${LW + 16}" height="${ySol - yPent}" fill="#0c1222" stroke="#243052" stroke-width="1.4"/>
  ${toitSvg(g)}${penthouseSvg(g, toit, chef)}${cage}${etages.map((e, i) => rangeeSvg(g, e, i)).join("")}${sousSolGrand(g, clos)}
</svg>`
}

// biome-ignore format: gabarit SVG dense
function sousSolSvg(clos: Clos[], W: number, H: number, cadre?: Cadre) {
	const boxes = clos.slice(0, 10).map((p, k) => {
		const x = 18 + k * 34
		const y = H - 10 - 22 - (k % 2) * 4
		return `<g><title>${esc(p.titre)}</title><rect x="${x}" y="${y}" width="28" height="22" rx="1" fill="#9a7448" stroke="#07090f" stroke-width=".6"/><rect x="${x + 12}" y="${y}" width="4" height="22" fill="#c9a46a"/></g>`
	}).join("")
	return `${ouvrir(W, H, "xMidYMax meet", "pf-scene", cadre)}
  <defs><pattern id="pf-hachure" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#262c3e" stroke-width="1.2"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="#0b0e15"/>
  <rect width="${W}" height="${H}" fill="url(#pf-hachure)" opacity=".7"/>
  <rect y="${H - 10}" width="${W}" height="10" fill="#07090e"/>
  ${boxes}
</svg>`
}

/** sous-sol : cartons kraft à plat, 1 par projet clos */
export function sousSolPlat(clos: Clos[], W = 360, H = 56): string {
	return sousSolSvg(clos, W, H)
}

// biome-ignore format: gabarit SVG dense
function cartonArchive(p: Clos, x: number, y: number, w: number, h: number) {
	const t = p.titre.split(" : ")[0].split(" (")[0]
	const max = Math.max(1, Math.floor((w - 12) / 5.4))
	const lib = t.length > max ? `${t.slice(0, Math.max(0, max - 1))}…` : t
	return `<g><title>${esc(p.titre)} · ${esc(p.statut)}</title>
        <rect x="${f1(x)}" y="${f1(y - h)}" width="${f1(w)}" height="${h}" rx="1.5" fill="#9a7448" stroke="#07090f" stroke-width=".7"/>
        <rect x="${f1(x + w / 2 - 3)}" y="${f1(y - h)}" width="6" height="${h}" fill="#c9a46a" opacity=".9"/>
        <rect x="${f1(x + 6)}" y="${f1(y - h + 10)}" width="${f1(w - 12)}" height="16" rx="1" fill="#e8e4d6"/>
        <text x="${f1(x + w / 2)}" y="${f1(y - h + 21)}" text-anchor="middle" font-size="9.5" fill="#2a2420" font-weight="600">${esc(lib)}</text>
        <text x="${f1(x + w / 2)}" y="${f1(y - 6)}" text-anchor="middle" font-size="7" fill="#3a2c1c" opacity=".8">${esc(p.maj)}</text></g>`
}

/** salle du sous-sol : archives à plat — rayonnages, 1 carton étiqueté par projet clos, ampoule, murs de terre hachurés */
// biome-ignore format: gabarit SVG dense
export function salleSousSol(clos: Clos[], W = 720, H = 420): string {
	const n = clos.length
	const parRayon = Math.max(4, Math.ceil(n / 3))
	const x0 = 70
	const larg = W - 140
	const pas = larg / parRayon
	const etageres = [H - 60, H - 170, H - 280].map((y, r) => {
		const planche = `<rect x="${x0 - 14}" y="${y}" width="${larg + 28}" height="6" rx="1" fill="#2a3042" stroke="#07090f" stroke-width=".6"/><rect x="${x0 - 14}" y="${y + 6}" width="${larg + 28}" height="3" fill="#1a1e2b"/>`
		const cartons = clos.slice(r * parRayon, (r + 1) * parRayon).map((p, k) => cartonArchive(p, x0 + k * pas + 8, y, Math.min(pas - 16, 110), 56 + (k % 2) * 8)).join("")
		return cartons + planche
	}).join("")
	const montants = [x0 - 14, x0 + larg + 8].map((x) => `<rect x="${x}" y="${H - 330}" width="6" height="${330 - 16}" fill="#1f2638"/>`).join("")
	const ampoule = `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="34" stroke="#3a4460" stroke-width="1.4"/><ellipse cx="${W / 2}" cy="${H / 2 + 30}" rx="${W * 0.42}" ry="${H * 0.42}" fill="url(#ss-lum)"/><path d="M${W / 2 - 14} 34 h28 l-6 10 h-16z" fill="#2a3042"/><circle cx="${W / 2}" cy="48" r="5" fill="#ffd27a"/><circle cx="${W / 2}" cy="48" r="10" fill="#ffd27a" opacity=".18"/>`
	const tuyau = `<path d="M0 22 H${W - 60} q12 0 12 12 V${H - 16}" fill="none" stroke="#2a3042" stroke-width="7" stroke-linecap="round"/><path d="M0 22 H${W - 60} q12 0 12 12 V${H - 16}" fill="none" stroke="#3a4460" stroke-width="2" stroke-dasharray="1 28"/>`
	const escalier = Array.from({ length: 6 }, (_, k) => `<rect x="${8 + k * 9}" y="${60 + k * 22}" width="${50 - k * 9}" height="22" fill="#141a28" stroke="#07090f" stroke-width=".6"/>`).join("")
	return `${ouvrir(W, H, "xMidYMid meet", "pf-scene")}
  <defs>
    <pattern id="ss-terre" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#262c3e" stroke-width="1.2"/></pattern>
    <radialGradient id="ss-lum"><stop offset="0" stop-color="#ffd27a" stop-opacity=".16"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b0e15"/>
  <rect width="${W}" height="${H}" fill="url(#ss-terre)" opacity=".5"/>
  <rect x="40" y="0" width="${W - 80}" height="${H - 16}" fill="#0f1420"/>
  <rect y="${H - 16}" width="${W}" height="16" fill="#07090e"/>
  <line x1="40" y1="${H - 16}" x2="${W - 40}" y2="${H - 16}" stroke="#171d2c" stroke-width="1.4"/>
  ${ampoule}${tuyau}${escalier}${montants}${etageres}
  <text x="${W - 48}" y="${H - 26}" text-anchor="end" font-size="9" fill="#5c6270" letter-spacing="1">ARCHIVES · ${n}</text>
</svg>`
}
