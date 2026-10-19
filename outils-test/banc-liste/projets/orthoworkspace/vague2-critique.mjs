// Scénario T017 : critique visuelle vague 2 (/exercises : carte, rail, mascotte, share) 1440 + 390, forum best effort
// usage : node ../../banc.mjs --dist <dist> --api vague2-critique-api.mjs --chemin /exercises --out orthoworkspace-v2/T017/v2 --scenario vague2-critique.mjs
// le dist appelle http://localhost:3000/api (origine ≠ banc) → reroutée ici vers la même API simulée
import { api } from './vague2-critique-api.mjs'
const H = '/home/sylvain/Documents/AgentX/outils-test/banc-impression'
const bb = async l => { const b = await l.boundingBox().catch(() => null); return b && Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10])) }
const st = l => l.evaluate(e => { const s = getComputedStyle(e); return { fs: s.fontSize, lh: s.lineHeight, fw: s.fontWeight, color: s.color, bg: s.backgroundColor, ws: s.whiteSpace } }).catch(e => 'ERR ' + e.message.slice(0, 60))
const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round((x + 0.05) / (y + 0.05) * 100) / 100 }
export default async ({ page: p, out, log, errs, origine }) => {
	await p.route('http://localhost:3000/**', r => { const rep = api(new URL(r.request().url()).pathname) ?? { status: 404, json: {} }; return r.fulfill(rep.path ? { ...rep, path: `${H}/${rep.path}` } : rep) })
	await p.addInitScript(() => localStorage.setItem('auth_token', 'banc'))
	const shot = async (n, l) => { try { await (l ?? p).screenshot({ path: `${out}-${n}.png` }); log('SHOT', n) } catch (e) { log('SHOT KO', n, e.message.slice(0, 120)) } }
	const card = t => p.locator('article').filter({ hasText: t }).first()
	await p.goto(origine + '/exercises'); await p.waitForTimeout(1500); await p.waitForTimeout(1500)
	await shot('01-grille')
	// carte : play / étoile / titre / ?
	const c1 = card('Exercice 01')
	const play = c1.locator('button[aria-label="Lancer"]'), q = c1.locator('button[aria-label="Aperçu de l\'exercice"]')
	const titre = c1.getByText('Exercice 01', { exact: true })
	const star = c1.locator('button').filter({ has: p.locator('svg') }).filter({ hasNot: p.locator('[aria-label="Lancer"]') })
	log('CARTE bb', JSON.stringify({ card: await bb(c1), titre: await bb(titre), play: await bb(play), q: await bb(q) }))
	log('CARTE btns', JSON.stringify(await c1.locator('button').evaluateAll(bs => bs.map(b => { const r = b.getBoundingClientRect(); return { a: b.getAttribute('aria-label') ?? b.getAttribute('title') ?? b.textContent.trim().slice(0, 15), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cy: Math.round(r.y + r.height / 2) } }))))
	log('CARTE titre style', JSON.stringify(await st(titre)), 'titre cy', await titre.evaluate(e => { const r = e.getBoundingClientRect(); return Math.round(r.y + r.height / 2) }))
	const qs = await q.evaluate(e => { const s = getComputedStyle(e), svg = e.querySelector('svg'); return { bg: s.backgroundColor, color: s.color, bf: s.backdropFilter, svgFill: svg && [...svg.querySelectorAll('*')].map(x => getComputedStyle(x).fill + '/' + getComputedStyle(x).stroke).slice(0, 3), w: e.offsetWidth } })
	log('Q style', JSON.stringify(qs))
	// 02 hover ?
	await card('Exercice 04').locator('button[aria-label="Aperçu de l\'exercice"]').hover(); await p.waitForTimeout(700)
	await shot('02-hover-q')
	log('FLOTTANTE', JSON.stringify(await p.locator('[role=tooltip], [data-radix-popper-content-wrapper], .fixed.z-50, [role=dialog]').evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { cls: (e.className + '').slice(0, 80), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), t: e.innerText.slice(0, 60) } }))))
	await p.mouse.move(5, 5); await p.waitForTimeout(400)
	// 03 roue
	await titre.click(); await p.waitForTimeout(400)
	await shot('03-roue')
	const roue = p.locator('[role=menu][aria-label="Actions : Exercice 01"]')
	log('ROUE', await roue.count(), JSON.stringify(await bb(roue)), JSON.stringify(await roue.locator('button, [role=menuitem]').evaluateAll(bs => bs.map(b => { const r = b.getBoundingClientRect(); return { a: b.getAttribute('aria-label') ?? b.innerText.slice(0, 20), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }))))
	await p.keyboard.press('Escape'); await p.mouse.click(1300, 860); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300)
	log('ROUE après Esc', await roue.count())
	// 04 rail famille
	const rail = p.locator('[data-tour=exo-filters]')
	await rail.locator('label').filter({ hasText: /^\s*Langage oral/ }).first().click().catch(async e => { log('famille label KO', e.message.slice(0, 80)); await rail.getByText('Langage oral', { exact: true }).click() })
	await p.waitForTimeout(500)
	await shot('04-rail-famille', rail)
	const doms = rail.locator('div.pl-4')
	log('DOMAINES pl-4', await doms.count())
	log('RAIL items', JSON.stringify(await rail.locator('label, button').evaluateAll(ls => ls.map(l => { const r = l.getBoundingClientRect(), cb = l.querySelector('input,button[role=checkbox],[role=checkbox]'), cr = cb && cb.getBoundingClientRect(); return { t: l.innerText.replace(/\s+/g, ' ').slice(0, 28), x: Math.round(r.x), y: Math.round(r.y), h: Math.round(r.height), cbx: cr && Math.round(cr.x), cbw: cr && Math.round(cr.width), fs: getComputedStyle(l).fontSize } }).filter(o => o.h > 0))))
	log('COMPTEURS', JSON.stringify(await rail.locator('span').evaluateAll(ss => ss.filter(s => /^\d+$/.test(s.innerText.trim()) && s.children.length === 0).slice(0, 6).map(s => { const c = getComputedStyle(s); let e = s, bg = 'rgba(0, 0, 0, 0)'; while (e && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(e).backgroundColor; e = e.parentElement } return { t: s.innerText, fs: c.fontSize, color: c.color, bg, x: Math.round(s.getBoundingClientRect().x) } }))))
	await rail.locator('label').filter({ hasText: /^\s*Langage oral/ }).first().click().catch(() => rail.getByText('Langage oral', { exact: true }).click())
	await p.waitForTimeout(300)
	// 05 favoris
	await rail.getByText('Mes favoris', { exact: true }).click(); await p.waitForTimeout(500)
	await shot('05-rail-favoris')
	await rail.getByText('Mes favoris', { exact: true }).click(); await p.waitForTimeout(300)
	// 06 rail replié
	const rb = rail.locator('button').filter({ has: p.locator('svg') }).first()
	log('REPLI btn', await rb.getAttribute('aria-label').catch(() => '?'), JSON.stringify(await bb(rb)))
	await rb.click(); await p.waitForTimeout(500)
	await shot('06-rail-replie')
	log('RAIL replié bb', JSON.stringify(await bb(p.locator('[data-tour=exo-filters]'))), 'LS', await p.evaluate(() => localStorage.getItem('exercises_filters_collapsed')))
	const rouvre = p.locator('[data-tour=exo-filters] button').first()
	await rouvre.click().catch(e => log('rouvre KO', e.message.slice(0, 60))); await p.waitForTimeout(400)
	// 07 bulle
	const mb = p.locator('[aria-label="Visite guidée de ce module"]')
	const bulle = mb.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " fixed ")][1]')
	await shot('07-bulle', bulle)
	const caseL = p.locator('label:has(input[type=checkbox])').filter({ hasText: 'Ne plus proposer' })
	const nonMerci = p.getByRole('button', { name: 'Non merci' }), montrez = p.getByRole('button', { name: /Montrez-moi/ })
	log('BULLE bb', JSON.stringify({ bulle: await bb(bulle), mascotte: await bb(mb), montrez: await bb(montrez), nonMerci: await bb(nonMerci), case: await bb(caseL), input: await bb(caseL.locator('input')), q: await bb(p.getByText(/Je vous montre/)) }))
	log('BULLE styles', JSON.stringify({ case: await st(caseL), caseTxt: await st(caseL.locator('xpath=.//*[normalize-space(text())="Ne plus proposer"]').first()), nonMerci: await st(nonMerci), montrez: await st(montrez), q: await st(p.getByText(/Je vous montre/).first()) }))
	log('BULLE case html', (await caseL.evaluate(e => e.outerHTML).catch(() => '∅')).slice(0, 600))
	// 09 draft (avant Liste)
	let c45 = card('Exercice 45')
	if (!(await c45.count())) { await p.getByText('Brouillons', { exact: true }).click(); await p.waitForTimeout(800); c45 = card('Exercice 45') }
	log('DRAFT', await c45.count(), 'play', await c45.locator('button[aria-label="Lancer"]').count(), 'q', await c45.locator('button[aria-label="Aperçu de l\'exercice"]').count(), JSON.stringify(await bb(c45)))
	if (await c45.count()) await shot('09-carte-draft', c45)
	await p.getByText('Actifs', { exact: true }).click().catch(() => {}); await p.waitForTimeout(500)
	// 08 liste + menu
	await p.getByText('Liste', { exact: true }).click(); await p.waitForTimeout(600)
	const row = p.locator('[data-tour=exo-grid] .grid').filter({ hasText: 'Exercice 06' }).first()
	await row.getByRole('button', { name: 'Plus d’actions' }).click(); await p.waitForTimeout(400)
	await shot('08-liste-menu')
	log('MENU items', JSON.stringify(await p.locator('[role=menuitem], [role=menu] button').evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(), s = e.querySelector('svg'), sr = s && s.getBoundingClientRect(); return { t: e.innerText.trim().slice(0, 30), h: Math.round(r.height), y: Math.round(r.y), svg: sr ? [Math.round(sr.width), Math.round(sr.height), Math.round(sr.x - r.x)] : null, fs: getComputedStyle(e).fontSize } }))))
	const menuEl = p.locator('[role=menu]').last()
	await shot('08b-menu-zoom', menuEl)
	await p.keyboard.press('Escape'); await p.waitForTimeout(300)
	await p.getByText('Grille', { exact: true }).click(); await p.waitForTimeout(500)
	// thème sombre ?
	log('THEME toggle', await p.locator('[aria-label*="thème" i], [aria-label*="sombre" i], [title*="thème" i]').count(), 'data-theme', await p.evaluate(() => document.documentElement.getAttribute('data-theme')))
	// mobile
	await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1000)
	await shot('10-m-grille')
	log('M scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth), 'body', await p.evaluate(() => document.body.scrollWidth))
	log('M debordants', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > 391 && r.width > 0 && getComputedStyle(e).position !== 'fixed' }).slice(0, 8).map(e => (e.tagName + '.' + (e.className + '').slice(0, 50)) + ' R' + Math.round(e.getBoundingClientRect().right)))))
	log('M carte', JSON.stringify(await bb(card('Exercice 01'))), 'rail', JSON.stringify(await bb(p.locator('[data-tour=exo-filters]'))))
	const mRail = p.getByRole('button', { name: /Filtres/ })
	log('M bouton filtres', await mRail.count())
	if (await mRail.count()) { await mRail.first().click().catch(e => log('M filtres KO', e.message.slice(0, 60))); await p.waitForTimeout(500) }
	await shot('11-m-rail')
	log('M rail ouvert bb', JSON.stringify(await bb(p.locator('[data-tour=exo-filters]'))), 'sw', await p.evaluate(() => document.documentElement.scrollWidth))
	await p.keyboard.press('Escape'); await p.waitForTimeout(300)
	await p.reload(); await p.waitForTimeout(2500)
	await shot('12-m-bulle')
	log('M bulle', JSON.stringify({ bulle: await bb(bulle), case: await bb(caseL), nonMerci: await bb(nonMerci), sw: await p.evaluate(() => document.documentElement.scrollWidth) }))
	// forum
	await p.setViewportSize({ width: 1440, height: 900 })
	const e0 = errs.length
	await p.goto(origine + '/forum'); await p.waitForTimeout(2500)
	log('FORUM txt', (await p.locator('main, body').first().innerText()).replace(/\s+/g, ' ').slice(0, 400))
	const pub = p.getByRole('button', { name: /Publier|Nouveau|Partager|Créer|Nouvelle/ })
	log('FORUM boutons', JSON.stringify(await pub.allInnerTexts()))
	if (await pub.count()) { await pub.first().click().catch(() => {}); await p.waitForTimeout(500) }
	await shot('13-forum-menu')
	log('FORUM menu', JSON.stringify(await p.locator('[role=menuitem], [role=menu] button').evaluateAll(es => es.map(e => { const s = e.querySelector('svg'), r = s && s.getBoundingClientRect(); return e.innerText.trim().slice(0, 30) + (r ? ` svg${Math.round(r.width)}` : ' nosvg') }))))
	await p.goto(origine + '/forum/exercices'); await p.waitForTimeout(2500)
	await shot('14-forum-exercices')
	log('FORUM/EX txt', (await p.locator('body').innerText()).replace(/\s+/g, ' ').replace(/ENVIRONNEMENT DE DÉMO ?/g, '').slice(0, 400))
	log('FORUM errs', JSON.stringify(errs.slice(e0)))
}
