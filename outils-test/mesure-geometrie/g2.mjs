// usage : node g2.mjs <port> <fx.json|-> <CODE> [corrige] — Vite du banc-impression (env BANC, BANC_PROJET) sur <port> ; planches (env G2_PLANCHE) et points (env G2_POINT) en mm → stdout JSON
import { spawn } from 'node:child_process'
import { openSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SORTIES, purgerSorties } from '../banc-impression/projet.mjs'
purgerSorties()
const [port, fx, code] = process.argv.slice(2)
const H = process.env.BANC ?? fileURLToPath(new URL('../banc-impression', import.meta.url))
const { chargerProjet } = await import(H + '/projet.mjs')
const P = chargerProjet()
const { chromium } = await import(H + '/node_modules/playwright/index.mjs')
const PLANCHE = process.env.G2_PLANCHE ?? 'div.relative', POINT = process.env.G2_POINT ?? ':scope > div.absolute'
const U = `http://127.0.0.1:${port}/`
mkdirSync(SORTIES + '/_logs', { recursive: true })
const log = openSync(`${SORTIES}/_logs/g2-vite-${port}.log`, 'a')
const vite = spawn('node', [H + '/node_modules/vite/bin/vite.js', '--config', H + '/vite.config.mjs'], { cwd: H, stdio: ['ignore', log, log], env: { ...process.env, BANC_PROJET: P.slug, BANC_PORT: port } })
process.on('exit', () => { try { process.kill(vite.pid) } catch {} })
for (let i = 0; ; i++) { try { if ((await fetch(U)).ok) break } catch {} ; if (i > 150) process.exit(1); await new Promise(r => setTimeout(r, 200)) }
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.route(U + P.api, r => r.fulfill({ status: 404, body: '' }))
await page.route(P.images, r => r.fulfill({ path: H + '/ferme.webp', contentType: 'image/webp' }))
if (fx !== '-') await page.addInitScript(f => { window.__bancFixture = f }, JSON.parse(readFileSync(fx, 'utf8')))
for (let k = 0; k < 2; k++) { await page.goto(`${U}?code=${code}`); await page.locator(P.contenu).first().waitFor({ timeout: 30000 }).catch(() => {}); await page.waitForTimeout(2500) }
if (process.argv[5] === 'corrige') { await page.getByLabel(P.corrige).check(); await page.waitForTimeout(1500) }
await page.emulateMedia({ media: 'print' })
await page.waitForTimeout(500)
const out = await page.evaluate(([contenu, planche, point]) => {
	const mm = 96 / 25.4
	return [...document.querySelectorAll(planche)].filter(b => b.querySelector(point)).map(b => {
		const r = b.getBoundingClientRect()
		const p = document.querySelector(contenu).getBoundingClientRect(); return { left: (r.left - p.left) / mm, right: (r.right - p.left) / mm, pw: p.width / mm, w: r.width / mm, h: r.height / mm, dots: [...b.querySelectorAll(point)].map(d => { const q = d.getBoundingClientRect(); return { l: d.textContent.trim(), x: (q.left + q.width / 2 - r.left) / mm, y: (q.top + q.height / 2 - r.top) / mm, w: q.width / mm, h: q.height / mm } }), line: (b.querySelector('polyline')?.getAttribute('points') ?? '') }
	})
}, [P.contenu, PLANCHE, POINT])
console.log(JSON.stringify(out))
await browser.close(); process.exit(0)
