// usage : BANC_PROJET=<slug> node --import <ce dossier>/alias.mjs --test <test.ts> — alias du projet (ex. `@/` → front/src/), extensions .ts/.tsx/index.ts, import.meta.env → ({}) dans le front
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, resolve as pres } from 'node:path'
import { fileURLToPath } from 'node:url'
const H = process.env.BANC ?? fileURLToPath(new URL('../banc-impression', import.meta.url))
const P = (await import(H + '/projet.mjs')).chargerProjet()
const alias = Object.entries(P.alias).map(([a, d]) => [a, `${P.front}/${d}`])
const pick = base => [base, base + '.ts', base + '.tsx', base + '/index.ts'].find(f => existsSync(f) && !f.endsWith('/') && /\.[cm]?[jt]sx?$|\.json$/.test(f))
registerHooks({
	resolve(spec, ctx, next) {
		let base = null
		const a = alias.find(([p]) => spec.startsWith(p))
		if (a) base = a[1] + spec.slice(a[0].length)
		else if (spec.startsWith('.') && ctx.parentURL?.startsWith('file:')) base = pres(dirname(fileURLToPath(ctx.parentURL)), spec)
		if (base) { const f = pick(base); if (f) return next('file://' + f, ctx) }
		return next(spec, ctx)
	},
})
registerHooks({
	load(url, ctx, next) {
		const r = next(url, ctx)
		if (url.startsWith('file://' + P.front + '/') && !url.includes('/node_modules/') && r.source) r.source = String(r.source).replaceAll('import.meta.env', '({})')
		return r
	},
})
