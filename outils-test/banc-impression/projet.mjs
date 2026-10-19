import { readFileSync, readdirSync } from 'node:fs'
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
