// Banc d'invariants visuels de la salle (T093). Lancer : `make invariants` (depuis la racine).
// Salle vivante requise (7777) ; 0 serveur lancé ; 0 écriture hors .sorties/invariants/.
// Ajouter un invariant = 1 fonction `iN` dans INVARIANTS + 1 ligne dans LISEZMOI.md.
import { mkdirSync } from "node:fs"
import { statSync, readdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const { chromium } = await import(pathToFileURL(resolve(RACINE, "apps/web/node_modules/playwright/index.mjs")).href)
const BASE = "http://127.0.0.1:7777/"
const T0 = Date.now()
const WIDTHS = [1440, 390]

// ── prérequis
let state
try {
	const r = await fetch(`${BASE}state.json`)
	if (r.status !== 200) throw new Error(String(r.status))
	state = await r.json()
} catch (e) {
	console.log(`salle injoignable (${e.message})`)
	process.exit(2)
}
try {
	const d = resolve(RACINE, "apps/web/dist/assets")
	const t = Math.max(...readdirSync(d).map((f) => statSync(resolve(d, f)).mtimeMs))
	console.log(`prérequis : state.json 200 · dist/assets ${new Date(t).toISOString()}`)
} catch {
	console.log("prérequis : state.json 200 · dist/assets ∅")
}
const slug = state.immeuble?.etages?.[0]?.slug ?? state.immeuble?.selection?.slug ?? state.projet
const choixTodo = (state.todo ?? []).filter((t) => t.etiquette === "VOTRE CHOIX")
const OUT = resolve(RACINE, ".sorties/invariants", new Date().toISOString().replace(/[:.]/g, "-"))

// ── harnais
const res = [] // { id, nom, ok, detail }
const noter = (id, nom, ok, detail = "") => res.push({ id, nom, ok, detail })
let termIn = 0, termInIntercepte = 0
const browser = await chromium.launch()

async function ouvrir(w) {
	const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
	const page = await ctx.newPage()
	const handler = async (route) => {
		const p = new URL(route.request().url()).pathname
		if (p.endsWith("/api/term/in")) termInIntercepte++
		let body = { ok: true }
		if (p.endsWith("/api/term/etat")) body = { vivant: false, code: null }
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
	}
	await page.route("**/api/term/**", handler)
	await page.route("**/api/run**", handler)
	await page.route("**/api/voix/**", handler)
	await page.routeWebSocket(/.*/, () => {})
	page.on("request", (r) => { if (new URL(r.url()).pathname.endsWith("/api/term/in")) termIn++ })
	return { ctx, page }
}
async function aller(page, hash, attendre) {
	await page.goto(`${BASE}#${hash}`)
	await page.waitForLoadState("load")
	if (attendre) await page.locator(attendre).first().waitFor({ timeout: 15000 }).catch(() => {})
	await page.waitForTimeout(1200)
}
async function capture(page, nom) {
	mkdirSync(OUT, { recursive: true })
	await page.screenshot({ path: resolve(OUT, `${nom}.png`) }).catch(() => {})
}

// ── invariants (chacun : nom, mesure, attendu, obtenu)
const INVARIANTS = {
	// I1 dialogs fermés display none (T079 N1)
	async i1(page, w, vue) {
		const bad = await page.evaluate(() => [...document.querySelectorAll("dialog:not([open])")]
			.map((d) => getComputedStyle(d).display).filter((x) => x !== "none"))
		noter("I1", `dialogs fermés display none ${w} ${vue}`, bad.length === 0, `display ≠ none : ${JSON.stringify(bad)}`)
		return bad.length === 0
	},
	// I2 dialog ouvert : pas de défilement propre, dans le viewport (T075 D2/D3)
	async i2(page, w, vue) {
		const voir = page.locator("[data-testid=choix-voir]").first()
		if (!(await voir.count())) return noter("I2", `dialog ouvert ${w} ${vue}`, true, "∅ choix-voir (non applicable)")
		await voir.evaluate((b) => b.click())
		const dlg = page.locator("dialog[open]").first()
		await dlg.waitFor({ timeout: 5000 }).catch(() => {})
		await page.waitForTimeout(600)
		if (!(await dlg.count())) return noter("I2", `dialog ouvert ${w} ${vue}`, false, "aucun dialog[open] après clic")
		const m = await dlg.evaluate((d) => ({ sh: d.scrollHeight, ch: d.clientHeight, x: Math.round(d.getBoundingClientRect().x) }))
		const ok = m.sh <= m.ch + 1 && (w > 400 || m.x >= 16)
		noter("I2", `dialog ouvert ${w} ${vue}`, ok, `scrollHeight ${m.sh} > clientHeight ${m.ch} + 1 ou x ${m.x} < 16`)
		if (!ok) await capture(page, `I2-${w}-${vue}`)
		await page.keyboard.press("Escape")
		await page.waitForTimeout(300)
	},
	// I3 pas de débordement horizontal de page
	async i3(page, w, vue) {
		const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }))
		noter("I3", `${w} ${vue}`, m.sw <= m.iw, `scrollWidth ${m.sw} > ${m.iw}`)
		if (m.sw > m.iw) await capture(page, `I3-${w}-${vue}`)
	},
	// I4 étage : carte VOTRE CHOIX avec zone de réponse visible sans défiler (T066/T067)
	async i4(page, w) {
		if (!choixTodo.length) return noter("I4", `carte VOTRE CHOIX ${w}`, true, "∅ VOTRE CHOIX dans state.todo (non applicable)")
		const cards = page.locator("[data-testid=todo-choix]")
		const n = await cards.count()
		if (!n) return noter("I4", `carte VOTRE CHOIX ${w}`, false, `todo-choix 0 < 1 (${choixTodo.length} VOTRE CHOIX dans state)`)
		const m = await cards.first().evaluate((c) => {
			const ta = c.querySelector("[data-testid=choix-reponse]"), env = c.querySelector("[data-testid=choix-envoyer]")
			if (!ta || !env) return { manque: true }
			const vis = (e) => {
				const r = e.getBoundingClientRect(), s = getComputedStyle(e)
				if (s.display === "none" || s.visibility === "hidden" || !r.width || !r.height) return false
				for (let p = e.parentElement; p; p = p.parentElement) {
					if (!/auto|scroll|hidden/.test(getComputedStyle(p).overflowY)) continue
					const pr = p.getBoundingClientRect()
					if (r.top < pr.top - 1 || r.bottom > pr.bottom + 1) return false
				}
				return true
			}
			return { ta: vis(ta), env: vis(env) }
		})
		const ok = !m.manque && m.ta && m.env
		noter("I4", `carte VOTRE CHOIX ${w}`, ok, m.manque ? "choix-reponse/choix-envoyer absent" : `visible sans défiler : reponse ${m.ta}, envoyer ${m.env} ≠ true`)
		if (!ok) await capture(page, `I4-${w}`)
	},
	// I5 voix-panel : espacement des lignes ≥ 12 px
	async i5(page, w) {
		const ol = page.locator("[data-testid=voix-panel] ol").first()
		if (!(await ol.count())) return noter("I5", `voix-panel rowGap ${w}`, true, "∅ voix-panel (non applicable)")
		const g = await ol.evaluate((e) => parseFloat(getComputedStyle(e).rowGap) || 0)
		noter("I5", `voix-panel rowGap ${w}`, g >= 12, `rowGap ${g} < 12`)
	},
	// I6 xterm-viewport défile (T043 D1)
	async i6(page, w) {
		const vp = page.locator(".xterm-viewport").first()
		if (!(await vp.count())) return noter("I6", `xterm-viewport ${w}`, true, "∅ terminal non atteignable (non applicable)")
		const o = await vp.evaluate((e) => getComputedStyle(e).overflowY)
		noter("I6", `xterm-viewport overflowY ${w}`, o === "auto", `overflowY "${o}" ≠ "auto"`)
	},
	// I8 immeuble : pas de panneau choix (T063)
	async i8(page, w) {
		const n = await page.locator("[data-testid=choix-panel]").count()
		noter("I8", `immeuble sans choix-panel ${w}`, n === 0, `choix-panel ${n} ≠ 0`)
		if (n) await capture(page, `I8-${w}`)
	},
}

for (const w of WIDTHS) {
	const { ctx, page } = await ouvrir(w)
	// immeuble
	await aller(page, "/")
	await INVARIANTS.i1(page, w, "immeuble")
	await INVARIANTS.i3(page, w, "immeuble")
	await INVARIANTS.i8(page, w)
	// étage
	await aller(page, `/floor/${slug}`, choixTodo.length ? "[data-testid=todo-choix]" : undefined)
	await INVARIANTS.i1(page, w, "étage")
	await INVARIANTS.i3(page, w, "étage")
	await INVARIANTS.i4(page, w)
	await INVARIANTS.i5(page, w)
	await INVARIANTS.i6(page, w)
	await INVARIANTS.i2(page, w, "étage")
	await INVARIANTS.i1(page, w, "étage après Voir")
	await ctx.close()
}
// I7 aucune requête réelle non interceptée vers /api/term/in
noter("I7", "term/in : toutes interceptées", termIn === termInIntercepte, `${termIn - termInIntercepte} non interceptée(s) sur ${termIn}`)
await browser.close()

// ── sortie : une ligne par invariant (agrégée par id+nom), résumé, rc
const dedup = new Map()
for (const r of res) {
	const k = `${r.id} ${r.nom}`
	const prev = dedup.get(k)
	dedup.set(k, { ...r, ok: (prev ? prev.ok : true) && r.ok })
}
let ko = 0
for (const [k, r] of dedup) {
	if (r.ok) console.log(`OK ${k}${r.detail.includes("non applicable") ? " [" + r.detail + "]" : ""}`)
	else { ko++; console.log(`KO ${r.id} ${r.nom} : ${r.detail}`) }
}
const ok = dedup.size - ko
console.log(`${ok} OK / ${ko} KO · ${((Date.now() - T0) / 1000).toFixed(1)} s${ko ? ` · captures ${OUT}` : ""}`)
process.exit(ko)
