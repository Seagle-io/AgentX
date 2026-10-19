import { mkdirSync, writeFileSync } from 'node:fs'
import { H, chargerProjet } from './projet.mjs'
// Projet (BANC_PROJET) → front, alias, shims, plugins ; port posé par shot.mjs (BANC_PORT) ; cache Vite propre au port.
const P = chargerProjet()
const F = P.front
const port = Number(process.env.BANC_PORT ?? P.port)
const plugins = await Promise.all(P.plugins.map(async p => (await import(`${F}/node_modules/${p}`)).default()))
// CSS du projet + sources Tailwind : généré (chemins absolus du front), importé par main.tsx (banc:css)
const css = `${H}/.banc-css/${P.slug}.css`
mkdirSync(H + '/.banc-css', { recursive: true })
writeFileSync(css, `@import '${F}/${P.css}';\n@source '${F}/${P.sources}';\n`)
// alias du projet appliqué à la main (page : chemin `@/…` du projet)
const viaAlias = s => Object.entries(P.alias).reduce((r, [a, d]) => r.startsWith(a) ? `${F}/${d}${r.slice(a.length)}` : r, s)
const exact = s => new RegExp('^' + s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '$')
export default {
	root: H,
	cacheDir: H + '/.vite-cache-' + port,
	plugins,
	resolve: {
		alias: [
			// shims : module servi par le banc (réexporte le vrai module, ex. `@/api/exercises.ts`)
			...Object.entries(P.shims).map(([m, f]) => ({ find: exact(m), replacement: `${H}/projets/${f}` })),
			{ find: /^banc:registre$/, replacement: `${H}/projets/${P.registre}` },
			{ find: /^banc:projet$/, replacement: `${H}/projets/${P.slug}.json` },
			{ find: /^banc:css$/, replacement: css },
			{ find: /^banc:page$/, replacement: viaAlias(P.page) },
			...Object.entries(P.alias).map(([a, d]) => ({ find: new RegExp('^' + a.replace(/[/@]/g, '\\$&')), replacement: `${F}/${d}` })),
		],
		dedupe: ['react', 'react-dom'],
	},
	// watch: null — une édition concurrente (shim, front) ne recharge plus la page en pleine capture
	server: { port, strictPort: true, host: '127.0.0.1', fs: { allow: [F, H] }, watch: null },
}
