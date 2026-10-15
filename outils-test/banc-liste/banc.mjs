// usage : node banc.mjs --dist <dist> --api <api.mjs> --out <préfixe> [--scenario <scenario.mjs>] [--chemin /exercises] — dist servi par page.route (aucun serveur) ; sans scénario : capture + texte de la page
// <api.mjs> exporte api(pathname) → undefined (fichier du dist) | réponse page.route ({ json } | { status } | { path }) ; <scenario.mjs> exporte default async ({ page, out, log, errs })
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { sortie, purgerSorties } from '../banc-impression/projet.mjs'
const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : process.argv[i + 1] }
const dist = arg('--dist'), apiF = arg('--api'), scen = arg('--scenario'), chemin = arg('--chemin', '/')
if (!dist || !apiF || !arg('--out')) { console.error('usage : node banc.mjs --dist <dist> --api <api.mjs> --out <préfixe> [--scenario <scenario.mjs>] [--chemin /]'); process.exit(2) }
purgerSorties()
// --out relatif → .sorties/<préfixe> (racine AgentX)
const out = sortie(arg('--out'))
mkdirSync(dirname(out), { recursive: true })
const H = process.env.BANC ?? fileURLToPath(new URL('../banc-impression', import.meta.url))
const { chromium } = await import(H + '/node_modules/playwright/index.mjs')
const { api } = await import(pathToFileURL(resolve(apiF)).href)
const ORIGIN = 'http://banc.liste'
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && !/404/.test(m.text()) && errs.push(m.text()))
await page.route('**/*', r => {
	const u = new URL(r.request().url())
	if (u.origin !== ORIGIN) return r.fulfill({ status: 404 })
	const rep = api(u.pathname)
	if (rep) return r.fulfill(rep.path && !isAbsolute(rep.path) ? { ...rep, path: `${H}/${rep.path}` } : rep)
	const f = dist + u.pathname
	if (u.pathname !== '/' && existsSync(f)) return r.fulfill({ path: f })
	return r.fulfill({ contentType: 'text/html', body: readFileSync(dist + '/index.html') })
})
await page.goto(ORIGIN + chemin); await page.waitForTimeout(2500)
if (!scen) {
	await page.screenshot({ path: out + '-probe.png' })
	console.log(errs); console.log((await page.locator('body').innerText()).slice(0, 2500)); await b.close(); process.exit(0)
}
await (await import(pathToFileURL(resolve(scen)).href)).default({ page, out, errs, log: (...a) => console.log(...a), origine: ORIGIN })
console.log('errs', JSON.stringify(errs))
await b.close()
