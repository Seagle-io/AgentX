// Scénario T019 : vérif ciblée T018/T020 — repros R1..R6 (R7 = rg sur le dist)
import { api } from './vague2-api.mjs'
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }
export default async ({ page: p, out, log, origine }) => {
	p.setDefaultTimeout(5000)
	const W = ms => p.waitForTimeout(ms)
	const shot = n => p.screenshot({ path: `${out}-${n}.png` })
	const step = async (nom, fn) => { try { await fn() } catch (e) { log(nom, 'EXC', String(e).split('\n')[0]); await shot(nom + '-exc').catch(() => {}) } }
	const opt = r => r.request().method() === 'OPTIONS' && r.fulfill({ status: 204, headers: CORS })
	await p.route('http://localhost:3000/**', r => opt(r) || r.fulfill({ ...(api(new URL(r.request().url()).pathname) ?? { status: 404, json: {} }), headers: CORS }))
	const prefBodies = [], exReqs = []
	await p.route('**/api/auth/preferences', r => { if (opt(r)) return; const b = r.request().postData(); prefBodies.push(`${r.request().method()} ${b}`); let prefs = {}; try { prefs = JSON.parse(b).preferences } catch {} r.fulfill({ json: prefs, headers: CORS }) })
	await p.route('**/api/exercises/**', r => { if (opt(r)) return; exReqs.push(`${r.request().method()} ${r.request().url()}`); if (r.request().method() === 'GET') return r.fallback(); r.fulfill({ json: {}, headers: CORS }) })
	const MODE = process.env.BANC_MODE ?? ''
	await p.addInitScript(m => {
		localStorage.setItem('auth_token', 'banc')
		if (m === 'R6' && !sessionStorage.getItem('r6')) { sessionStorage.setItem('r6', '1'); localStorage.setItem('exercise-list-filters', JSON.stringify({ visibility: [], families: ['Cognition'], domains: ['inconnu'], tags: [], favoritesOnly: false })) }
	}, MODE)
	const go = async (path = '/exercises') => p.goto(origine + path)
	const box = async l => { const b = await l.boundingBox(); return b && Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10])) }
	const rail = p.locator('[data-tour=exo-filters]')

	if (MODE === 'R6') {
		await go(); await W(2500)
		log('R6 articles', await p.locator('[data-tour=exo-grid] article').count(), 'pagination', (await p.locator('[data-tour=exo-grid] ~ div').innerText().catch(() => '∅')).replace(/\n+/g, ' '), 'checked', await rail.locator('input[type=checkbox]:checked').count(), 'Réinitialiser', await rail.getByText('Réinitialiser', { exact: true }).count())
		log('R6 ls avant clic', await p.evaluate(() => localStorage.getItem('exercise-list-filters')))
		await shot('R6')
		await rail.getByText('Langage oral', { exact: true }).click(); await W(300)
		await rail.getByText('Langage oral', { exact: true }).click(); await W(300)
		log('R6 ls après clic/déclic', await p.evaluate(() => localStorage.getItem('exercise-list-filters')))
		await p.reload(); await W(2000)
		log('R6 reload articles', await p.locator('[data-tour=exo-grid] article').count(), 'ls', await p.evaluate(() => localStorage.getItem('exercise-list-filters')))
		return
	}
	const guide = p.locator('button[aria-label="Visite guidée de ce module"]')
	const never = p.locator('label:has(input[type=checkbox])').filter({ hasText: 'Ne plus proposer' })
	const aria = () => guide.getAttribute('aria-expanded')
	await go(); await W(1500)
	await step('R1', async () => {
		log('R1 @1500 aria', await aria())
		await never.click(); await W(150); const a150 = await aria(); await W(1500)
		log('R1 coché bodies', JSON.stringify(prefBodies), 'aria@150', a150, 'aria@1650', await aria(), 'checked', await never.locator('input').isChecked())
		await shot('R1-coche')
		await never.click(); await W(150); const b150 = await aria(); await W(1500)
		log('R1 décoché bodies', JSON.stringify(prefBodies), 'aria@150', b150, 'aria@1650', await aria(), 'checked', await never.locator('input').isChecked())
	})
	await step('R2', async () => {
		const lb = await box(never), nm = await box(p.getByText('Non merci', { exact: true })), mm = await box(p.getByRole('button', { name: 'Montrez-moi' }))
		const st = await never.locator('span').first().evaluate(e => { const c = getComputedStyle(e); return { text: e.textContent, fontSize: c.fontSize, fontWeight: c.fontWeight } })
		log('R2 label', JSON.stringify(lb), 'nonMerci', JSON.stringify(nm), 'montrez', JSON.stringify(mm), 'span', JSON.stringify(st))
		log('R2 y>nm.y+h', lb.y > nm.y + nm.height, 'Δx', Math.round((lb.x - mm.x) * 10) / 10)
		await shot('R2')
		await p.getByText('Non merci', { exact: true }).click(); await W(400)
	})
	await step('R3', async () => {
		const q = p.locator('article:has-text("Exercice 04") button[aria-label="Aperçu de l\'exercice"]')
		await q.hover(); await W(800)
		const qb = await box(q)
		const fb = await p.evaluate(() => {
			const el = [...document.querySelectorAll('body *')].find(e => !e.closest('article') && e.children.length === 0 && e.textContent.trim() === 'Paires de similitude' && e.getBoundingClientRect().width > 0)
			if (!el) return null
			let c = el; while (c.parentElement && !['fixed', 'absolute'].includes(getComputedStyle(c).position) && !c.hasAttribute('data-radix-popper-content-wrapper')) c = c.parentElement
			const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right, tag: c.tagName, role: c.getAttribute('role') }
		})
		log('R3 bouton', JSON.stringify({ ...qb, bottom: qb.y + qb.height, right: qb.x + qb.width }), 'carte', JSON.stringify(fb))
		if (fb) {
			const ix = Math.max(0, Math.min(qb.x + qb.width, fb.right) - Math.max(qb.x, fb.x)), iy = Math.max(0, Math.min(qb.y + qb.height, fb.bottom) - Math.max(qb.y, fb.y))
			log('R3 top≥bottom-2', fb.y >= qb.y + qb.height - 2, 'right≤right+2', fb.right <= qb.x + qb.width + 2, 'intersection px²', Math.round(ix * iy))
		}
		await shot('R3'); await p.mouse.move(700, 50); await W(300)
	})
	await step('R5', async () => {
		await p.getByText(/^Archivés/).first().click(); await W(1000)
		const c = p.locator('article:has-text("Exercice 01")').first()
		log('R5 url', p.url().replace(origine, ''), 'cartes', await p.locator('[data-tour=exo-grid] article').count(), 'boutons', JSON.stringify(await c.locator('button').allInnerTexts()))
		const n0 = exReqs.length
		await c.getByRole('button', { name: /^(Restaurer|Réafficher)$/ }).click(); await W(400)
		log('R5 requêtes', JSON.stringify(exReqs.slice(n0)), 'menus@400', await p.locator('[role=menu]').count())
		await shot('R5')
	})
	await step('R4', async () => {
		await go('/forum'); await W(2000)
		await p.getByRole('button', { name: /Publier/ }).first().click(); await W(500)
		const items = await p.locator('[role=menuitem]').evaluateAll(es => es.map(e => {
			const svgs = e.querySelectorAll('svg').length
			const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t, x = null
			while ((t = w.nextNode())) if (t.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(t); x = Math.round(r.getBoundingClientRect().x * 10) / 10; break }
			return { label: e.textContent.trim(), svgs, x }
		}))
		log('R4 items', JSON.stringify(items))
		await shot('R4')
	})
}
