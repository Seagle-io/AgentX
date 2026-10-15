import { readFileSync, readdirSync, lstatSync, rmSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// Dossier du banc = dossier de ce fichier ; projet = projets/<slug>.json (env BANC_PROJET, défaut : l'unique projets/*.json).
export const H = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')
export const chargerProjet = (slug = process.env.BANC_PROJET) => {
	if (!slug) {
		const l = readdirSync(H + '/projets').filter(f => f.endsWith('.json'))
		if (l.length !== 1) throw new Error(`BANC_PROJET ou --projet requis : ${l.map(f => f.slice(0, -5)).join(' ')}`)
		slug = l[0].slice(0, -5)
	}
	const p = JSON.parse(readFileSync(`${H}/projets/${slug}.json`, 'utf8'))
	return { ...p, slug, front: process.env.BANC_FRONT ?? p.front }
}
// Sorties des bancs : <racine AgentX>/.sorties (disque, gitignoré ; /tmp = tmpfs RAM). Convention --out : <projet-vault>/<TID>/<nom> (slug de `vault/projets/<slug>`, ≠ --projet du banc).
export const RACINE = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '')
export const SORTIES = process.env.BANC_SORTIES || RACINE + '/.sorties'
export const sortie = rel => {
	if (isAbsolute(rel)) return rel
	const r = resolve(SORTIES, rel)
	if (r !== resolve(SORTIES) && !r.startsWith(resolve(SORTIES) + '/')) throw new Error(`--out hors .sorties : ${rel}`)
	return r
}
// mtime max récursive d'une entrée (fichier ou dossier) ; liens non suivis
const recent = p => { const s = lstatSync(p); return s.isDirectory() ? readdirSync(p).reduce((m, f) => Math.max(m, recent(`${p}/${f}`)), s.mtimeMs) : s.mtimeMs }
// Purge : toute entrée SORTIES/*/* sans écriture depuis `heures` ; dossiers de 1er niveau vidés retirés. Silencieuse, jamais bloquante.
export const purgerSorties = (heures = 48) => {
	const limite = Date.now() - heures * 3600e3
	try {
		for (const a of readdirSync(SORTIES)) {
			const pa = `${SORTIES}/${a}`
			if (!lstatSync(pa).isDirectory()) continue
			for (const b of readdirSync(pa)) { try { if (recent(`${pa}/${b}`) < limite) rmSync(`${pa}/${b}`, { recursive: true, force: true }) } catch {} }
			try { if (!readdirSync(pa).length) rmSync(pa, { recursive: true, force: true }) } catch {}
		}
	} catch {}
}
