// Scénario T027 : critique ciblée T023 — 390 rail replié/ouvert, grille 1 col, titres 10 px ; 1440 rail, contraste « Ne plus proposer », bulle « ? » gauche/droite
// usage : node ../../banc.mjs --dist <dist> --api vague2-critique-api.mjs --chemin /exercises --out orthoworkspace-v2/T027/c --scenario vague3-critique.mjs
import { api } from './vague2-critique-api.mjs'
const H = '/home/sylvain/Documents/AgentX/outils-test/banc-impression'
const bb = async l => { const b = await l.boundingBox().catch(() => null); return b && Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10])) }
const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round((x + 0.05) / (y + 0.05) * 100) / 100 }
const zoom = async (p, path, sels, pad = 12) => { const r = await p.evaluate(([ss, pad]) => { const bs = ss.flatMap(s => [...document.querySelectorAll(s.css)].filter(e => !s.txt || e.textContent.trim() === s.txt).slice(0, 1)).map(e => e.getBoundingClientRect()); if (!bs.length) return null; const x = Math.max(0, Math.min(...bs.map(b => b.x)) - pad), y = Math.max(0, Math.min(...bs.map(b => b.y)) - pad); return { x, y, width: Math.min(innerWidth, Math.max(...bs.map(b => b.right)) + pad) - x, height: Math.min(innerHeight, Math.max(...bs.map(b => b.bottom)) + pad) - y } }, [sels, pad]); if (r) await p.screenshot({ path, clip: r }); return r }
const inter = (a, b) => a && b ? Math.round(Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))) : null
export default async ({ page: p, out, log, origine }) => {
	await p.route('http://localhost:3000/**', r => { const rep = api(new URL(r.request().url()).pathname) ?? { status: 404, json: {} }; return r.fulfill(rep.path ? { ...rep, path: `${H}/${rep.path}` } : rep) })
	await p.addInitScript(() => localStorage.setItem('auth_token', 'banc'))
	const aside = p.locator('aside').first()
	const railInfo = () => p.evaluate(() => { const a = document.querySelector('aside'); if (!a) return null; const s = getComputedStyle(a), r = a.getBoundingClientRect(), w = a.parentElement, wr = w.getBoundingClientRect(); return { cls: (a.className + '').slice(0, 160), pos: s.position, z: s.zIndex, shadow: s.boxShadow.slice(0, 80), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), wrap: (w.className + '').slice(0, 100), wrapW: Math.round(wr.width), dataTour: a.getAttribute('data-tour') ?? a.closest('[data-tour]')?.getAttribute('data-tour') } })
	const grille = () => p.evaluate(() => { const g = document.querySelector('[data-tour=exo-grid] .grid'); if (!g) return null; const r = g.getBoundingClientRect(), t = getComputedStyle(g).gridTemplateColumns; return { gtc: t, ncol: t.split(' ').filter(Boolean).length, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } })
	const titres = () => p.evaluate(() => [...document.querySelectorAll('aside *')].filter(e => e.children.length === 0 && /text-\[10px\]|text-\[8px\]/.test(e.className + '')).slice(0, 8).map(e => { const r = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 14), getComputedStyle(e).fontSize, Math.round(r.x), Math.round(r.right), Math.round(r.width)] }))
	const sw = () => p.evaluate(() => document.documentElement.scrollWidth)
	// ---------- 390 ----------
	await p.setViewportSize({ width: 390, height: 844 })
	await p.goto(origine + '/exercises'); await p.waitForTimeout(3000)
	await p.screenshot({ path: `${out}-01-m-replie.png` })
	const btn = p.locator("button[aria-label='Afficher les filtres']")
	log('M01 rail', JSON.stringify(await railInfo()))
	log('M01 btn', await btn.count(), 'visible', await btn.first().isVisible().catch(() => false), JSON.stringify(await bb(btn.first())), 'aria-expanded', await btn.first().getAttribute('aria-expanded').catch(() => '?'))
	log('M01 titres', JSON.stringify(await titres()))
	const g1 = await grille()
	log('M01 grille', JSON.stringify(g1), 'sw', await sw())
	log('M01 cartes', JSON.stringify(await p.locator('article').evaluateAll(as => as.slice(0, 3).map(a => { const r = a.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.right)] }))))
	await btn.first().click(); await p.waitForTimeout(600)
	await p.screenshot({ path: `${out}-02-m-ouvert.png` })
	log('M02 rail', JSON.stringify(await railInfo()))
	const g2 = await grille()
	log('M02 grille', JSON.stringify(g2), 'Δ', g1 && g2 && JSON.stringify({ dx: g2.x - g1.x, dy: g2.y - g1.y, dw: g2.w - g1.w }), 'sw', await sw())
	log('M02 titres', JSON.stringify(await titres()))
	await p.mouse.move(370, 600); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(600)
	await p.screenshot({ path: `${out}-02b-m-referme.png` })
	log('M02b rail', JSON.stringify(await railInfo()), 'grille', JSON.stringify(await grille()), 'LS', await p.evaluate(() => localStorage.getItem('exercises_filters_collapsed')))
	// ---------- 1440 ----------
	await p.setViewportSize({ width: 1440, height: 900 })
	await p.evaluate(() => localStorage.removeItem('exercises_filters_collapsed'))
	await p.reload(); await p.waitForTimeout(3000)
	await p.screenshot({ path: `${out}-03-d-rail.png` })
	log('D03 rail', JSON.stringify(await railInfo()), 'btn Afficher', await p.locator("button[aria-label='Afficher les filtres']").count())
	log('D03 aside btns', JSON.stringify(await aside.locator('button').evaluateAll(bs => bs.slice(0, 3).map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), (b.className + '').slice(0, 60), Math.round(r.width), Math.round(r.height)] }))))
	log('D03 grille', JSON.stringify(await grille()))
	const rb = aside.locator('button').first()
	await rb.click(); await p.waitForTimeout(600)
	await p.screenshot({ path: `${out}-03b-d-replie.png` })
	log('D03b rail', JSON.stringify(await railInfo()), 'grille', JSON.stringify(await grille()), 'LS', await p.evaluate(() => localStorage.getItem('exercises_filters_collapsed')))
	await aside.locator('button').first().click(); await p.waitForTimeout(600)
	log('D03c rail rouvert', JSON.stringify(await railInfo()))
	// ---------- 04 bulle contraste ----------
	const npp = await p.evaluate(() => { const l = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Ne plus proposer'); if (!l) return null; const s = getComputedStyle(l), pan = l.closest('.bg-bg-panel'); let e = l, bg = 'rgba(0, 0, 0, 0)'; while (e && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(e).backgroundColor; e = e.parentElement } return { tag: l.tagName, color: s.color, fs: s.fontSize, fw: s.fontWeight, panel: pan && getComputedStyle(pan).backgroundColor, bgEff: bg } })
	log('D04 NPP', JSON.stringify(npp), 'ratio panel', npp?.panel && cr(npp.color, npp.panel), 'ratio bgEff', npp && cr(npp.color, npp.bgEff))
	log('D04 zoom', JSON.stringify(await zoom(p, `${out}-04-bulle.png`, [{ css: '[aria-label="Visite guidée de ce module"]' }, { css: 'button', txt: 'Montrez-moi' }, { css: 'span', txt: 'Ne plus proposer' }, { css: 'button', txt: 'Non merci' }], 24)))
	// ---------- 05/06 « ? » ----------
	const cols = await p.locator('article').evaluateAll(as => as.map((a, i) => { const r = a.getBoundingClientRect(); return { i, x: Math.round(r.x), y: Math.round(r.y), t: a.innerText.split('\n')[0] } }))
	const xs = [...new Set(cols.map(c => c.x))].sort((a, b) => a - b)
	log('COLS x', JSON.stringify(xs))
	const pick = x => cols.filter(c => c.x === x).sort((a, b) => a.y - b.y)[0]
	for (const [tag, x, f] of [['05-q-gauche', xs[0], 'G'], ['06-q-droite', xs.at(-1), 'D']]) {
		const c = pick(x), art = p.locator('article').nth(c.i), q = art.locator('button[aria-label="Aperçu de l\'exercice"]')
		await p.mouse.move(5, 5); await p.waitForTimeout(400)
		await q.hover(); await p.waitForTimeout(900)
		await p.screenshot({ path: `${out}-${tag}.png` })
		const tt = await bb(p.locator('[role=tooltip]').first()), ab = await bb(art)
		log(f, 'carte', c.t, 'Q', JSON.stringify(await bb(q)), 'article', JSON.stringify(ab), 'tooltip', JSON.stringify(tt), 'n tooltip', await p.locator('[role=tooltip]').count(), 'inter px2', inter(tt, ab), 'dans fenêtre', tt && tt.x >= 0 && tt.y >= 0 && tt.x + tt.width <= 1440 && tt.y + tt.height <= 900)
	}
	await p.mouse.move(5, 5)
}
