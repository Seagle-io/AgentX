// Scénario T016 : casser la vague 2 (carte T002, familles T010, mascotte T006, share T008) sur /exercises
// BANC_MODE = '' (complet) | 'C2' (avec BANC_PREFS='{"guide_auto_off":"1"}') | 'C3' (localStorage guide_auto_off=1)
export default async ({ page: p, out, log, origine }) => {
	const MODE = process.env.BANC_MODE ?? ''
	const W = ms => p.waitForTimeout(ms)
	const url = () => p.url().replace(origine, '')
	const menus = async () => p.locator('[role=menu]').count()
	const shot = n => p.screenshot({ path: `${out}-${n}.png` })
	const step = async (nom, fn) => { try { await fn() } catch (e) { log(nom, 'EXC', String(e).split('\n')[0]); await shot(nom + '-exc').catch(() => {}) } }
	const prefBodies = [], favBodies = []
	await p.route('**/api/auth/preferences', r => { const b = r.request().postData(); prefBodies.push(`${r.request().method()} ${b}`); let prefs = {}; try { prefs = JSON.parse(b).preferences } catch {} r.fulfill({ json: prefs }) })
	await p.route('**/api/favorites', r => { if (r.request().method() === 'GET') return r.fallback(); favBodies.push(`${r.request().method()} ${r.request().postData()}`); r.fulfill({ json: { exerciseIds: ['ex-01', 'ex-02', 'ex-03', 'ex-41', 'ex-05'], programmeIds: [] } }) })
	await p.addInitScript(m => { localStorage.setItem('auth_token', 'banc'); if (m === 'C3') localStorage.setItem('guide_auto_off', '1') }, MODE)
	const guide = p.locator('button[aria-label="Visite guidée de ce module"]')
	const never = p.locator('label:has(input[type=checkbox]):has-text("Ne plus proposer")')
	const go = async (path = '/exercises') => { await p.goto(origine + path); }

	if (MODE === 'C2' || MODE === 'C3') {
		await go(); await W(2500)
		log(MODE, 'aria-expanded', await guide.getAttribute('aria-expanded').catch(e => 'EXC ' + e), 'never visible', await never.isVisible())
		log(MODE, 'ls guide_auto_off', await p.evaluate(() => localStorage.getItem('guide_auto_off')))
		await shot(MODE); return
	}
	// ---- C1
	await go(); await W(1500)
	await step('C1', async () => {
		log('C1 1500ms aria-expanded', await guide.getAttribute('aria-expanded'), 'never visible', await never.isVisible())
		log('C1 never checked', await never.locator('input').isChecked())
		await shot('C1-ouverte')
		await never.click(); await W(600)
		log('C1 after check: bodies', JSON.stringify(prefBodies), 'aria-expanded', await guide.getAttribute('aria-expanded'), 'never visible', await never.isVisible())
		await shot('C1-coche')
		if (await never.isVisible()) { await never.click(); await W(600) }
		else log('C1 décocher impossible : bulle fermée')
		log('C1 after uncheck: bodies', JSON.stringify(prefBodies), 'aria-expanded', await guide.getAttribute('aria-expanded'))
		log('C1 ls guide_auto_off', await p.evaluate(() => localStorage.getItem('guide_auto_off')))
		await W(1500); log('C1 +1500ms aria-expanded', await guide.getAttribute('aria-expanded'))
	})
	// remettre la bulle fermée : Non merci si ouverte
	if (await p.getByText('Non merci', { exact: true }).isVisible().catch(() => false)) { await p.getByText('Non merci', { exact: true }).click(); await W(500) }
	// ---- A
	const card = t => p.locator(`article:has-text("${t}")`)
	const back = async () => { if (!url().startsWith('/exercises?') && url() !== '/exercises') { await go(); await W(1500) } }
	await step('A1', async () => {
		await card('Exercice 01').locator('h3').click(); await W(100)
		log('A1 menus@100', await menus())
		await W(300)
		const m = p.locator('[role=menu][aria-label="Actions : Exercice 01"]')
		log('A1 menu@400 visible', await m.isVisible(), 'items', JSON.stringify(await p.locator('[role=menuitem]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')))))
		log('A1 share path', await p.locator('[role=menuitem][aria-label*="Partager"] svg path[d^="M13.1202"]').count())
		await shot('A1'); await p.keyboard.press('Escape'); await W(300); log('A1 menus after Esc', await menus())
		if (await menus()) { await p.mouse.click(1400, 880); await W(300) }
	})
	await step('A2', async () => {
		const seen = []; const t = setInterval(() => {}, 1000)
		p.on('framenavigated', () => {})
		await card('Exercice 02').locator('h3').dblclick(); await W(50)
		log('A2 menus@50', await menus(), 'url', url())
		await W(800); log('A2 url@850', url(), 'menus', await menus()); clearInterval(t)
		await shot('A2'); await back()
	})
	await step('A3', async () => {
		const n = await p.locator('article').count(), play = await p.locator('article button[aria-label="Lancer"]').count()
		log('A3 articles page1', n, 'play', play)
		await card('Exercice 03').locator('button[aria-label="Lancer"]').click(); await W(400)
		log('A3 url', url(), 'menus', await menus()); await back()
	})
	await step('A4', async () => {
		const q = card('Exercice 04').locator('button[aria-label="Aperçu de l\'exercice"]')
		await q.hover(); await W(800)
		await shot('A4-survol')
		const txt = await p.locator('body').innerText()
		log('A4 survol "Aperçu à venir"', /Aperçu à venir/.test(txt), 'imgs alt Aperçu', await p.locator('img[alt^="Aperçu"]').count())
		const u0 = url(); await q.click(); await W(400)
		log('A4 click menus', await menus(), 'url inchangée', url() === u0, url())
		await p.mouse.move(700, 50); await W(200)
	})
	await step('A5', async () => {
		const star = card('Exercice 05').locator('h3 + span button')
		log('A5 star count', await star.count(), 'aria', await star.first().getAttribute('aria-label'))
		await star.first().click(); await W(400)
		log('A5 bodies', JSON.stringify(favBodies), 'menus@400', await menus())
	})
	// Exercice 45 : 2e/3e page (tri titre) → recherche
	await step('A6', async () => {
		await p.locator('input[placeholder="Rechercher dans les exercices…"]').fill('Exercice 45'); await W(500)
		const c = card('Exercice 45'); log('A6 cards', await c.count(), 'play', await c.locator('button[aria-label="Lancer"]').count(), '?', await c.locator('button[aria-label="Aperçu de l\'exercice"]').count())
		const u0 = url(); await c.locator('h3').dblclick(); await W(600)
		log('A6 dbl url inchangée', url() === u0, url(), 'menus', await menus())
		if (await menus()) { await p.keyboard.press('Escape'); await W(300) }
		await c.locator('h3').click(); await W(400)
		log('A6 roue items', JSON.stringify(await p.locator('[role=menuitem]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')))))
		await shot('A6'); await p.keyboard.press('Escape'); await W(300)
		await p.locator('input[placeholder="Rechercher dans les exercices…"]').fill(''); await W(400)
	})
	// ---- B
	const rail = p.locator('[data-tour=exo-filters]')
	const railTxt = async () => (await rail.innerText()).replace(/\n+/g, ' | ')
	const grid = async () => ({ articles: await p.locator('[data-tour=exo-grid] article').count(), titres: (await p.locator('[data-tour=exo-grid] article h3').allInnerTexts()).join(','), pagination: (await p.locator('[data-tour=exo-grid] ~ div').innerText().catch(() => '∅')).replace(/\n+/g, ' ') })
	const item = label => rail.getByText(label, { exact: true }).first()
	await go(); await W(1500)
	if (await p.getByText('Non merci', { exact: true }).isVisible().catch(() => false)) { await p.getByText('Non merci', { exact: true }).click(); await W(300) }
	await step('B1', async () => { log('B1 rail', await railTxt()); log('B1 titres groupes', JSON.stringify(await rail.evaluate(r => [...r.querySelectorAll('h2,h3,h4,[class*=uppercase]')].map(e => e.textContent.trim())))) })
	await step('B2', async () => { await shot('B2'); log('B2 grid', JSON.stringify(await grid())) })
	const visBtn = re => rail.getByRole('button', { name: re }).or(rail.getByRole('radio', { name: re })).or(rail.getByRole('tab', { name: re })).first()
	await step('B3', async () => {
		await visBtn(/^Privé/i).click(); await W(400)
		log('B3 rail', await railTxt()); log('B3 grid', JSON.stringify(await grid())); await shot('B3')
		await visBtn(/^Privé/i).click(); await W(400); log('B3 relâché rail', await railTxt())
	})
	await step('B4', async () => {
		await item('Mes favoris').click(); await W(400)
		log('B4 rail', await railTxt()); log('B4 grid', JSON.stringify(await grid())); await shot('B4')
		await item('Mes favoris').click(); await W(400)
	})
	await step('B5', async () => {
		await item('Langage oral').click(); await W(400)
		log('B5 pl-4', (await rail.locator('div.pl-4').innerText()).replace(/\n+/g, ' | '))
		log('B5 rail', await railTxt()); log('B5 grid', JSON.stringify(await grid())); await shot('B5-a')
		await rail.locator('div.pl-4').getByText('Voix', { exact: true }).click(); await W(300)
		await item('Fonctions exécutives').click(); await W(400)
		log('B5b rail', await railTxt()); log('B5b grid', JSON.stringify(await grid())); await shot('B5-b')
	})
	await step('B6', async () => {
		await item('Langage oral').click(); await W(400)
		log('B6 ls', await p.evaluate(() => localStorage.getItem('exercise-list-filters')))
		log('B6 grid', JSON.stringify(await grid())); log('B6 rail', await railTxt())
		await p.reload(); await W(2000)
		log('B6 reload rail', await railTxt()); log('B6 reload grid', JSON.stringify(await grid()))
		log('B6 ls', await p.evaluate(() => localStorage.getItem('exercise-list-filters')))
	})
	await step('B7', async () => {
		const btns = await rail.locator('button[aria-label], button[title]').evaluateAll(es => es.map(e => (e.getAttribute('aria-label') || '') + '/' + (e.getAttribute('title') || '')))
		log('B7 boutons rail', JSON.stringify(btns))
		await item('Fonctions exécutives').evaluate(() => 0)
		// re-cocher Langage oral pour avoir un pl-4 avant repli
		await item('Langage oral').click(); await W(300); log('B7 pl-4 avant', await rail.locator('div.pl-4').count())
		const repli = rail.locator('button[aria-label*="eplier" i], button[title*="eplier" i], button[aria-label*="Masquer" i]').first()
		await repli.click(); await W(500)
		log('B7 replié ls', await p.evaluate(() => localStorage.getItem('exercises_filters_collapsed')), 'pl-4', await rail.locator('div.pl-4').count(), 'rail', await railTxt())
		log('B7 replié labels', JSON.stringify(await rail.locator('[aria-label], [title]').evaluateAll(es => es.map(e => e.getAttribute('aria-label') || e.getAttribute('title')))))
		await shot('B7')
		await rail.locator('button[aria-label*="éplier" i], button[title*="éplier" i], button[aria-label*="Afficher" i]').first().click(); await W(400)
		log('B7 déplié pl-4', await rail.locator('div.pl-4').count(), 'ls', await p.evaluate(() => localStorage.getItem('exercises_filters_collapsed')))
		await item('Langage oral').click(); await W(300); await item('Fonctions exécutives').click(); await W(300)
	})
	// ---- D
	await step('D1', async () => {
		await p.getByText('Liste', { exact: true }).click(); await W(500)
		const row = p.locator('[data-tour=exo-grid] .grid').filter({ hasText: 'Exercice 06' }).first()
		await row.getByRole('button', { name: 'Plus d’actions' }).click(); await W(400)
		const it = p.locator('[role=menuitem]').filter({ hasText: 'Partager sur le forum' })
		log('D1 liste items', JSON.stringify(await p.locator('[role=menuitem]').allInnerTexts()), 'share', await it.count(), 'path', await it.locator('svg path[d^="M13.1202"]').count())
		await shot('D1-liste'); await p.keyboard.press('Escape'); await W(300)
		await p.getByText('Grille', { exact: true }).click(); await W(500)
		await card('Exercice 06').locator('h3').click(); await W(400)
		const r = p.locator('[role=menuitem][aria-label="Partager sur le forum"]')
		log('D1 roue share', await r.count(), 'path', await r.locator('svg path[d^="M13.1202"]').count())
		await shot('D1-roue'); await p.keyboard.press('Escape'); await W(300)
	})
	await step('D2', async () => {
		for (const [path, n] of [['/forum', 'forum'], ['/forum/exercices', 'forum-exercices']]) {
			await go(path); await W(2000); await shot(n)
			log('D2', path, 'url', url(), 'texte', (await p.locator('body').innerText()).slice(0, 200).replace(/\n+/g, ' | '))
		}
	})
}
