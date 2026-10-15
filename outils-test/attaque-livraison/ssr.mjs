// usage : node ssr.mjs <cas.mjs> [sortie.json] — SSR (Vite du front du projet, env BANC_PROJET) des composants de <cas.mjs> × cas × énoncé/corrigé ; sortie relative → .sorties/<sortie>, défaut .sorties/_divers/ssr-out.json
// <cas.mjs> exporte : modules { CODE: '/src/…' }, cases { CODE: { nom: items } }, props(items, withAnswers), mesure(html) → string
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { sortie as versSorties, purgerSorties } from '../banc-impression/projet.mjs'
const [fichierCas, argSortie = '_divers/ssr-out.json'] = process.argv.slice(2)
const sortie = versSorties(argSortie)
if (!fichierCas) { console.error('usage : node ssr.mjs <cas.mjs> [sortie.json]'); process.exit(2) }
purgerSorties()
const H = process.env.BANC ?? fileURLToPath(new URL('../banc-impression', import.meta.url))
const F = (await import(H + '/projet.mjs')).chargerProjet().front
const { modules, cases, props, mesure } = await import(pathToFileURL(resolve(fichierCas)).href)
const require = createRequire(F + '/package.json')
const { createServer } = await import(require.resolve('vite'))
const server = await createServer({
	root: F, cacheDir: fileURLToPath(new URL('.vite-cache-ssr', import.meta.url)),
	server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error',
})
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const mods = {}
for (const [code, m] of Object.entries(modules)) mods[code] = (await server.ssrLoadModule(m)).default
const out = {}
for (const [code, cs] of Object.entries(cases)) {
	for (const [name, items] of Object.entries(cs)) {
		for (const wa of [false, true]) {
			const k = `${code}/${name}/${wa ? 'corrige' : 'enonce'}`
			try {
				const html = renderToStaticMarkup(React.createElement(mods[code], props(items, wa)))
				out[k] = html
				console.log(k, 'OK', mesure(html))
			} catch (e) { console.log(k, 'THROW', String(e.message).slice(0, 120)) }
		}
	}
}
mkdirSync(dirname(sortie), { recursive: true })
writeFileSync(sortie, JSON.stringify(out, null, 1))
await server.close()
