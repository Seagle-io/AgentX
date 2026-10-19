import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, openSync, statSync, readFileSync, writeFileSync, rmSync, rmdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute } from 'node:path'
// usage : node shot.mjs --out <dir> [--projet <slug>] [--fixture <json>] (CODE... | --all-print) — --port accepté, ignoré (serveur partagé, port du projet)
import { H, chargerProjet } from './projet.mjs'
const USAGE = 'usage : node shot.mjs --out <dir> [--projet <slug>] [--fixture <json>] (CODE... | --all-print)'
const args = process.argv.slice(2)
const pjIdx = args.indexOf('--projet')
if (pjIdx >= 0 && !args[pjIdx + 1]) { console.error(USAGE); process.exit(2) }
const P = chargerProjet(pjIdx < 0 ? undefined : args[pjIdx + 1])

// Serveur Vite partagé entre tous les shot.mjs : 1 superviseur détaché (ce fichier, env BANC_SUPERVISEUR)
// lance Vite sur PORT et le tue quand plus aucun client vivant (fichiers clients/<pid>, pid mort ignoré) depuis 5 s.
const PORT = P.port
const D = `${H}/.banc-${PORT}`, CLIENTS = D + '/clients', VERROU = D + '/verrou', SUP = D + '/superviseur'
const vivant = pid => { try { process.kill(pid, 0); return pid > 0 } catch (e) { return e.code === 'EPERM' } }
const pidDe = f => { try { return Number(readFileSync(f, 'utf8')) } catch { return 0 } }
// Verrou = mkdir atomique ; verrou de plus de 30 s = détenteur mort.
const prendre = () => {
	for (;;) {
		try { return mkdirSync(VERROU) } catch (e) { if (e.code !== 'EEXIST') throw e }
		try { if (Date.now() - statSync(VERROU).mtimeMs > 30000) rmdirSync(VERROU) } catch { /* rendu entre-temps */ }
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
	}
}
const rendre = () => rmdirSync(VERROU)
mkdirSync(CLIENTS, { recursive: true })

if (process.env.BANC_SUPERVISEUR) {
	const log = openSync(H + '/vite.log', 'a')
	const vite = spawn(process.execPath, [H + '/node_modules/vite/bin/vite.js', '--config', H + '/vite.config.mjs'], { cwd: H, stdio: ['ignore', log, log], env: { ...process.env, BANC_PROJET: P.slug, BANC_PORT: String(PORT) } })
	vite.on('exit', () => process.exit(1))
	let vides = 0
	const tic = setInterval(() => {
		prendre()
		const clients = readdirSync(CLIENTS).filter(f => vivant(Number(f)) || rmSync(`${CLIENTS}/${f}`, { force: true }))
		vides = clients.length ? 0 : vides + 1
		if (vides < 5) return rendre()
		// Verrou gardé jusqu'à la mort de Vite : un client arrivant attend puis relance un serveur neuf.
		clearInterval(tic)
		rmSync(SUP, { force: true })
		vite.removeAllListeners('exit')
		vite.on('exit', () => { rendre(); process.exit(0) })
		vite.kill()
	}, 1000)
	await new Promise(() => { /* vit jusqu'à process.exit */ })
}

const { chromium } = await import(H + '/node_modules/playwright/index.mjs')
const outIdx = args.indexOf('--out')
if (outIdx < 0 || !args[outIdx + 1]) { console.error(USAGE); process.exit(2) }
// --out relatif → <tmp>/banc-sorties/<dir> (sorties volatiles)
const out = isAbsolute(args[outIdx + 1]) ? args[outIdx + 1] : `${tmpdir()}/banc-sorties/${args[outIdx + 1]}`
const portIdx = args.indexOf('--port')
if (portIdx >= 0) console.error(`--port ignoré : serveur partagé ${PORT}`)
// --url <url> (préchauffage d'environnement.json) : accepté, ignoré — URL = port du projet
const urlIdx = args.indexOf('--url')
const URL_BANC = `http://127.0.0.1:${PORT}/`
// --fixture : { CODE: { items, metadata?, params?, title?, instructions?, link? } } → window.__bancFixture (exercises-shim)
const fxIdx = args.indexOf('--fixture')
if (fxIdx >= 0 && !args[fxIdx + 1]) { console.error(USAGE); process.exit(2) }
// chemin absent → fixtures/<projet>/<CODE>/<nom>(.json) du banc
const fxChemin = f => [f, `${H}/fixtures/${P.slug}/${f}`, `${H}/fixtures/${P.slug}/${f}.json`].find(c => existsSync(c)) ?? f
const fixture = fxIdx < 0 ? null : JSON.parse(readFileSync(fxChemin(args[fxIdx + 1]), 'utf8'))
const allPrint = args.includes('--all-print')
const opts = new Set([outIdx, outIdx + 1, ...(pjIdx < 0 ? [] : [pjIdx, pjIdx + 1]), ...(portIdx < 0 ? [] : [portIdx, portIdx + 1]), ...(urlIdx < 0 ? [] : [urlIdx, urlIdx + 1]), ...(fxIdx < 0 ? [] : [fxIdx, fxIdx + 1])])
const asked = args.filter((a, i) => !opts.has(i) && a !== '--all-print')
mkdirSync(out, { recursive: true })

// Client : s'inscrit (clients/<pid>, effacé en sortie) et lance le superviseur s'il n'en vit aucun.
const moi = `${CLIENTS}/${process.pid}`
prendre()
writeFileSync(moi, '')
if (!vivant(pidDe(SUP))) {
	const sup = spawn(process.execPath, [import.meta.filename], { cwd: H, detached: true, stdio: 'ignore', env: { ...process.env, BANC_PROJET: P.slug, BANC_SUPERVISEUR: '1' } })
	sup.unref()
	writeFileSync(SUP, String(sup.pid))
}
rendre()
process.on('exit', () => rmSync(moi, { force: true }))
for (let i = 0; ; i++) {
	try { if ((await fetch(URL_BANC)).ok) break } catch { /* pas encore prêt */ }
	if (!vivant(pidDe(SUP))) { console.error('vite arrêté — voir ' + H + '/vite.log'); process.exit(1) }
	if (i > 150) { console.error('vite injoignable sur ' + PORT); process.exit(1) }
	await new Promise(r => setTimeout(r, 200))
}

const browser = await chromium.launch()

const nouvellePage = async (width, errs) => {
	const page = await browser.newPage({ viewport: { width, height: 900 } })
	page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)))
	page.on('console', m => {
		// 404 attendus : API du projet (P.api) volontairement refusée
		if (m.type() === 'error' && !/Failed to load resource: .*404/.test(m.text())) errs.push(m.text().slice(0, 160))
	})
	page.on('request', r => { if (new RegExp(P.interdit).test(r.url())) errs.push('requete interdite: ' + r.url()) })
	await page.route(URL_BANC + P.api, r => r.fulfill({ status: 404, body: '' }))
	await page.route(P.images, r => r.fulfill({ path: H + '/ferme.webp', contentType: 'image/webp' }))
	if (fixture) await page.addInitScript(fx => { window.__bancFixture = fx }, fixture)
	return page
}

// Contenu imprimé = enveloppe déclarée par le projet (barre d'outils exclue).
const CONTENU = P.contenu

// Liste des formats lue du registre au runtime.
const listePage = await browser.newPage()
await listePage.goto(URL_BANC + '?list')
await listePage.waitForFunction(() => window.__codes)
const registre = await listePage.evaluate(() => window.__codes)
const parCode = new Map(registre.map(f => [f.code, f]))
const codes = allPrint ? registre.filter(f => f.print).map(f => f.code) : asked

// Préchauffage : 1 page rendue → Vite finit d'optimiser les deps (cache neuf = rechargement) avant les captures.
const premier = codes.find(c => parCode.get(c)?.print)
if (premier) {
	await listePage.goto(`${URL_BANC}?code=${encodeURIComponent(premier)}`)
	await listePage.locator(CONTENU).first().waitFor({ timeout: 30000 }).catch(() => console.error('préchauffage : contenu absent'))
	await listePage.waitForTimeout(2000)
}
await listePage.close()

// PDF A4 → PNG par page ; rend le nombre de pages.
const imprimer = async (page, base) => {
	await page.emulateMedia({ media: 'print' })
	await page.pdf({ path: `${out}/${base}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true })
	await page.emulateMedia({ media: 'screen' })
	execFileSync('pdftoppm', ['-r', '110', '-png', `${out}/${base}.pdf`, `${out}/${base}-p`])
	const pages = readdirSync(out).filter(f => f.startsWith(`${base}-p-`) && f.endsWith('.png'))
	for (const f of pages) renameSync(`${out}/${f}`, `${out}/${base}-p${Number(f.slice(base.length + 3, -4))}.png`)
	return pages.length
}

// Rendu blanc : PDF < 2 Ko ou page 1 à > 99,5 % de pixels blancs (pdftoppm -gray → PGM brut).
const blanc = pdf => {
	if (statSync(pdf).size < 2048) return true
	const b = execFileSync('pdftoppm', ['-r', '40', '-gray', '-f', '1', '-l', '1', pdf])
	const [, w, h] = b.toString('latin1', 0, 40).split(/\s+/).map(Number)
	let encre = 0
	for (let i = b.length - w * h; i < b.length; i++) if (b[i] < 250) encre++
	return encre / (w * h) < 0.005
}

// Un essai complet d'un code ; rendu blanc, page rechargée par Vite ou err → relance (boucle ci-dessous).
const essai = async (code, f) => {
	const errs = []
	const page = await nouvellePage(1440, errs)
	let navs = 0
	page.on('framenavigated', fr => { if (fr === page.mainFrame()) navs++ })
	await page.goto(`${URL_BANC}?code=${encodeURIComponent(code)}`)
	await page.locator(CONTENU).first().waitFor({ timeout: 15000 }).catch(() => errs.push('timeout contenu imprimé'))
	await page.waitForTimeout(1500)
	const ecran = await page.locator('#root').innerText()
	if (new RegExp(P.ecran_erreur).test(ecran)) errs.push('ecran erreur: ' + ecran.slice(0, 120).replace(/\s+/g, ' '))
	await page.screenshot({ path: `${out}/${code}-ecran-1440.png`, fullPage: true })
	const pages = await imprimer(page, `${code}-enonce`)
	let blancs = blanc(`${out}/${code}-enonce.pdf`)
	if (f.correction) {
		const caseCorrige = page.getByLabel(P.corrige)
		await caseCorrige.waitFor({ timeout: 5000 }).catch(() => { /* compté juste après */ })
		if (await caseCorrige.count()) {
			await caseCorrige.check()
			await page.waitForTimeout(500)
			await imprimer(page, `${code}-corrige`)
			blancs ||= blanc(`${out}/${code}-corrige.pdf`)
		} else errs.push('case corrige absente')
	}
	await page.close()
	return { pages, errs, blancs, recharge: navs > 1 }
}

for (const code of codes) {
	const f = parCode.get(code)
	if (!f) { console.log(`${code} SKIP inconnu`); continue }
	if (!f.print) { console.log(`${code} SKIP no-print`); continue }
	if (!f.demo && !f.noMaterial && !fixture?.[code]) { console.log(`${code} SKIP no-demo`); continue }
	let r = await essai(code, f)
	if (r.blancs || r.recharge || r.errs.length) {
		console.error(`${code} relance — ${r.blancs ? 'rendu blanc' : r.recharge ? 'rechargement vite' : r.errs[0]}`)
		r = await essai(code, f)
		if (r.blancs) r.errs.push('rendu blanc')
		if (r.recharge) r.errs.push('rechargement vite')
	}
	console.log(`${code} pages=${r.pages} errs=${JSON.stringify([...new Set(r.errs)])}`)
}

await browser.close()
