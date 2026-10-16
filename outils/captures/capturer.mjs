#!/usr/bin/env node
// Refait les captures produit d'un site (contrat seagle-pilotage §C6).
//   node outils/captures/capturer.mjs <cle> --base <url> --sortie <dir> [--essai] [--ecrans a,b]
// --essai : 0 navigateur ; imprime les noms prévus (stdout) et le diagnostic outils (stderr).
// Registre : $AGENTX_PRODUITS sinon <racine>/produits.json.
// Sorties : 0 ok · 1 écrans sautés/échoués · 2 usage/registre/profil · 3 Playwright ou convertisseur webp introuvable.
// Écrit seulement sous --sortie ; 0 npm install ; 0 écriture dans les dépôts produits ou sites.

import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = resolve(ICI, '..', '..')
const QUALITE = 85

const sortir = (code, msg) => { if (msg) process.stderr.write(msg + '\n'); process.exit(code) }
const tilde = p => (p && p.startsWith('~/') ? join(homedir(), p.slice(2)) : p)

function args(argv) {
	const a = { cle: null, base: null, sortie: null, essai: false, ecrans: null }
	for (let i = 0; i < argv.length; i++) {
		const x = argv[i]
		if (x === '--essai') a.essai = true
		else if (x === '--base') a.base = argv[++i]
		else if (x === '--sortie') a.sortie = argv[++i]
		else if (x === '--ecrans') a.ecrans = (argv[++i] || '').split(',').filter(Boolean)
		else if (x.startsWith('--')) sortir(2, `option inconnue : ${x}`)
		else if (!a.cle) a.cle = x
		else sortir(2, `argument en trop : ${x}`)
	}
	if (!a.cle) sortir(2, 'usage : capturer.mjs <cle> --base <url> --sortie <dir> [--essai] [--ecrans a,b]')
	if (!a.essai && (!a.base || !a.sortie)) sortir(2, '--base et --sortie requis hors --essai')
	return a
}

function produit(cle) {
	const chemin = process.env.AGENTX_PRODUITS || join(RACINE, 'produits.json')
	if (!existsSync(chemin)) sortir(2, `registre absent : ${chemin}`)
	let reg
	try { reg = JSON.parse(readFileSync(chemin, 'utf8')) } catch (e) { sortir(2, `registre illisible : ${e.message}`) }
	const p = (reg.produits || []).find(x => x.cle === cle)
	if (!p) sortir(2, `produit inconnu : ${cle}`)
	return p
}

// Ordre §C6 : site.depot puis depots[].chemin.
function dossiers(p) {
	return [p.site && p.site.depot, ...(p.depots || []).map(d => d.chemin)].filter(Boolean).map(tilde)
}

function resoudre(p, module) {
	for (const d of dossiers(p)) {
		const req = createRequire(join(d, 'package.json'))
		try { return { mod: req(module), ou: req.resolve(module) } } catch {}
	}
	return null
}

function convertisseur(p) {
	const sharp = resoudre(p, 'sharp')
	if (sharp) return {
		nom: `sharp (${sharp.ou})`,
		async convertir(png, webp) { await sharp.mod(png).webp({ quality: QUALITE }).toFile(webp) },
	}
	const cw = spawnSync('cwebp', ['-version'], { encoding: 'utf8' })
	if (cw.status === 0) return {
		nom: `cwebp ${cw.stdout.trim()}`,
		async convertir(png, webp) {
			const r = spawnSync('cwebp', ['-quiet', '-q', String(QUALITE), png, '-o', webp])
			if (r.status !== 0) throw new Error(`cwebp rc ${r.status}`)
		},
	}
	const PIL = "from PIL import features,Image;import sys;assert features.check('webp');" +
		"len(sys.argv)>2 and Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',quality=int(sys.argv[3]))"
	const py = spawnSync('python3', ['-c', PIL], { encoding: 'utf8' })
	if (py.status === 0) return {
		nom: 'python3 PIL',
		async convertir(png, webp) {
			const r = spawnSync('python3', ['-c', PIL, png, webp, String(QUALITE)])
			if (r.status !== 0) throw new Error(`PIL rc ${r.status}`)
		},
	}
	return null
}

function plan(profil, filtre) {
	const noms = Object.keys(profil.ecrans)
	if (filtre) for (const e of filtre) if (!noms.includes(e)) sortir(2, `écran inconnu : ${e}`)
	const ecrans = filtre ? noms.filter(e => filtre.includes(e)) : noms
	const out = []
	for (const theme of profil.themes)
		for (const taille of profil.tailles)
			for (const ecran of ecrans)
				out.push({ theme, taille, ecran, route: profil.ecrans[ecran], nom: profil.nom(theme, ecran, taille.suffixe) })
	return out
}

const LOCAUX = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

function route(r, env) {
	const manque = []
	const chemin = r.replace(/\{([A-Z0-9_]+)\}/g, (_, v) => (env[v] ? encodeURIComponent(env[v]) : (manque.push(v), '')))
	return { chemin, manque }
}

async function main() {
	const a = args(process.argv.slice(2))
	const p = produit(a.cle)
	const fichier = join(ICI, `${a.cle}.mjs`)
	if (!existsSync(fichier)) sortir(2, `profil absent : ${fichier}`)
	const profil = (await import(pathToFileURL(fichier).href)).default
	const prevus = plan(profil, a.ecrans)

	const pw = resoudre(p, 'playwright')
	const conv = convertisseur(p)

	if (a.essai) {
		process.stdout.write([...new Set(prevus.map(x => x.nom))].sort().join('\n') + '\n')
		for (const e of Object.keys(profil.ecrans)) if (profil.ecrans[e] === null) process.stderr.write(`route null : ${e}\n`)
		process.stderr.write(`playwright : ${pw ? pw.ou : 'introuvable'}\nwebp : ${conv ? conv.nom : 'introuvable'}\n`)
		process.exit(pw && conv ? 0 : 3)
	}

	let base
	try { base = new URL(a.base) } catch { sortir(2, `--base invalide : ${a.base}`) }
	if (profil.baseLocaleSeulement && !LOCAUX.has(base.hostname)) sortir(2, `${a.cle} : stack locale seulement, refus de ${base.hostname}`)
	if (!pw) sortir(3, `playwright introuvable sous : ${dossiers(p).join(', ')}`)
	if (!conv) sortir(3, 'convertisseur webp introuvable : sharp, cwebp, python3 PIL')

	const sortie = resolve(a.sortie)
	const tmp = join(sortie, '.png-tmp')
	mkdirSync(tmp, { recursive: true })
	const env = { ...process.env, CAPTURES_BASE: base.href }
	const sautes = []
	let faits = 0
	const nav = await pw.mod.chromium.launch()
	try {
		for (const theme of profil.themes)
			for (const taille of profil.tailles) {
				const lot = prevus.filter(x => x.theme === theme && x.taille === taille)
				if (!lot.length) continue
				const ctx = await nav.newContext({
					viewport: { width: taille.largeur, height: taille.hauteur },
					deviceScaleFactor: taille.dpr,
					...(theme ? { colorScheme: theme } : {}),
				})
				const page = await ctx.newPage()
				try {
					await profil.theme(page, theme)
					await profil.connexion(page, env)
					for (const x of lot) {
						if (x.route === null) { sautes.push(`${x.nom} — route null`); continue }
						const r = route(x.route, env)
						if (r.manque.length) { sautes.push(`${x.nom} — variable ${r.manque.join(',')} absente`); continue }
						try {
							await page.goto(new URL(r.chemin, base).href, { waitUntil: 'networkidle' })
							const png = join(tmp, x.nom.replace(/\.webp$/, '.png'))
							writeFileSync(png, await page.screenshot({ type: 'png' }))
							await conv.convertir(png, join(sortie, x.nom))
							rmSync(png)
							faits++
							process.stdout.write(`${x.nom}\n`)
						} catch (e) { sautes.push(`${x.nom} — ${e.message.split('\n')[0]}`) }
					}
				} catch (e) {
					for (const x of lot) sautes.push(`${x.nom} — connexion : ${e.message.split('\n')[0]}`)
				} finally { await ctx.close() }
			}
	} finally {
		await nav.close()
		rmSync(tmp, { recursive: true, force: true })
	}
	process.stderr.write(`faits ${faits} · sautés ${sautes.length} · webp ${conv.nom}\n`)
	for (const s of sautes) process.stderr.write(`  ${s}\n`)
	process.exit(sautes.length ? 1 : 0)
}

main().catch(e => sortir(2, e.stack || String(e)))
