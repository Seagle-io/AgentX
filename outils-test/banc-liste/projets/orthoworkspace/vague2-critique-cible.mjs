// Scénario T021 : critique ciblée T018 — bulle mascotte, carte flottante « ? », menu Publier forum ; + bulle mobile
// usage : node ../../banc.mjs --dist <dist> --api vague2-critique-api.mjs --chemin /exercises --out orthoworkspace-v2/T021/c --scenario vague2-critique-cible.mjs
import { api } from './vague2-critique-api.mjs'
const H = '/home/sylvain/Documents/AgentX/outils-test/banc-impression'
const bb = async l => { const b = await l.boundingBox().catch(() => null); return b && Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10])) }
const zoom = async (p, path, sels, pad = 12) => { const r = await p.evaluate(([ss, pad]) => { const bs = ss.flatMap(s => [...document.querySelectorAll(s.css)].filter(e => !s.txt || e.textContent.trim() === s.txt).slice(0, 1)).map(e => e.getBoundingClientRect()); if (!bs.length) return null; const x = Math.max(0, Math.min(...bs.map(b => b.x)) - pad), y = Math.max(0, Math.min(...bs.map(b => b.y)) - pad); return { x, y, width: Math.min(innerWidth, Math.max(...bs.map(b => b.right)) + pad) - x, height: Math.min(innerHeight, Math.max(...bs.map(b => b.bottom)) + pad) - y } }, [sels, pad]); if (r) await p.screenshot({ path, clip: r }); return r }
const leaf = (p, txt) => p.evaluate(txt => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === txt).map(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { tag: e.tagName, fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, color: s.color, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) } }), txt)
export default async ({ page: p, out, log, origine }) => {
	await p.route('http://localhost:3000/**', r => { const rep = api(new URL(r.request().url()).pathname) ?? { status: 404, json: {} }; return r.fulfill(rep.path ? { ...rep, path: `${H}/${rep.path}` } : rep) })
	await p.addInitScript(() => localStorage.setItem('auth_token', 'banc'))
	await p.goto(origine + '/exercises'); await p.waitForTimeout(3000)
	// 01 bulle
	const bulleMesure = async tag => {
		const mb = p.locator('[aria-label="Visite guidée de ce module"]')
		const panneau = await p.evaluate(() => { let e = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Non merci'); while (e && !e.textContent.includes('Ne plus proposer')) e = e.parentElement; while (e && e.parentElement && e.parentElement.getBoundingClientRect().width === e.getBoundingClientRect().width) e = e.parentElement; const r = e?.getBoundingClientRect(); return r && { cls: (e.className + '').slice(0, 120), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) } })
		log(tag, 'mascotte', JSON.stringify(await bb(mb)), 'panneau', JSON.stringify(panneau))
		for (const t of ['Montrez-moi', 'Non merci', 'Ne plus proposer']) log(tag, t, JSON.stringify(await leaf(p, t)))
		log(tag, 'input', JSON.stringify(await bb(p.locator('label:has(input[type=checkbox])').filter({ hasText: 'Ne plus proposer' }).locator('input'))), 'btn Montrez', JSON.stringify(await bb(p.getByRole('button', { name: /Montrez-moi/ }))))
		log(tag, 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth))
	}
	await bulleMesure('BULLE')
	log('ZOOM bulle', JSON.stringify(await zoom(p, `${out}-01-bulle.png`, [{ css: '[aria-label="Visite guidée de ce module"]' }, { css: 'button', txt: 'Montrez-moi' }, { css: 'span', txt: 'Ne plus proposer' }, { css: 'p,span', txt: 'Je vous montre la bibliothèque en 6 étapes ?' }], 24)))
	// 02 hover ?
	const art = p.locator('article').filter({ hasText: 'Exercice 04' }).first()
	const q = art.locator('button[aria-label="Aperçu de l\'exercice"]')
	await q.hover(); await p.waitForTimeout(800)
	await p.screenshot({ path: `${out}-02-hover-q.png` })
	const fl = await p.evaluate(() => [...document.querySelectorAll('.fixed.z-50, [data-radix-popper-content-wrapper] > *')].map(e => { const r = e.getBoundingClientRect(); return { cls: (e.className + '').slice(0, 90), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom), t: e.innerText.slice(0, 40).replace(/\n/g, ' ') } }).filter(o => o.w > 0 && o.h > 0))
	log('FLOTTANTE', JSON.stringify(fl), 'Q', JSON.stringify(await bb(q)), 'carte', JSON.stringify(await bb(art)), 'grille', JSON.stringify(await bb(p.locator('[data-tour=exo-grid]'))), 'vp', JSON.stringify(p.viewportSize()))
	await p.mouse.move(5, 5); await p.waitForTimeout(400)
	// 04 mobile bulle
	await p.setViewportSize({ width: 390, height: 844 }); await p.reload(); await p.waitForTimeout(3000)
	await p.screenshot({ path: `${out}-04-m-bulle.png` })
	await bulleMesure('M-BULLE')
	// 03 forum
	await p.setViewportSize({ width: 1440, height: 900 })
	await p.goto(origine + '/forum'); await p.waitForTimeout(2500)
	await p.getByRole('button', { name: /Publier/ }).first().click(); await p.waitForTimeout(500)
	const items = ['Sujet de discussion', 'Question de comptabilité', 'Annonce de stage', 'Annonce de remplacement', 'Partager un exercice']
	for (const t of items) log('FORUM', t, JSON.stringify(await p.evaluate(t => { const l = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === t); if (!l) return null; let b = l; while (b && !b.querySelector('svg')) b = b.parentElement; const s = b?.querySelector('svg'), r = l.getBoundingClientRect(), sr = s?.getBoundingClientRect(), pa = s?.querySelector('path,circle,line,polyline'); return { tx: Math.round(r.x), ty: Math.round(r.y), fs: getComputedStyle(l).fontSize, svg: sr && [Math.round(sr.x), Math.round(sr.y + sr.height / 2 - r.y - r.height / 2), Math.round(sr.width), Math.round(sr.height)], fill: pa && getComputedStyle(pa).fill, stroke: pa && getComputedStyle(pa).stroke, sw: pa && getComputedStyle(pa).strokeWidth } }, t)))
	log('ZOOM forum', JSON.stringify(await zoom(p, `${out}-03-forum-menu.png`, items.map(t => ({ css: 'button,a,[role=menuitem]', txt: t })), 10)))
}
