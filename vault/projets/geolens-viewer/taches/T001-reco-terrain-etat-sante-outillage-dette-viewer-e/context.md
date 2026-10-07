---
pack: T001
projet: geolens-viewer
role: eclaireur
cree: 2026-10-07
---

# Pack T001 — Reco terrain : état, santé outillage, dette viewer en ligne

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier `geolens-web-feat-viewer-online` (racine `G` ci-dessous) pour le chef : architecture du viewer en ligne, santé outillage, écarts de parité restants, dette ; rendre des coordonnées `chemin:L` + des lots candidats à fichiers disjoints.

## Definition of Done
- [ ] carte : 8-15 lignes `chemin:L — rôle ≤ 10 mots` couvrant boot-web, HttpBackend, montage iframe, routes API du viewer (URLs signées), stockage, auth front
- [ ] santé : node requis vs `node -v` (v22.22.1) ; node_modules présents ? (∅ attendu) ; `.git` présent ? (∅ attendu) ; commandes typecheck/lint/test/smoke recopiées des `package.json` ; prérequis pour les lancer
- [ ] tailles : `wc -l` de `web/src/viewer/main.ts`, `web/src/viewer/geoplan/workspace.ts`, `api/src/server.ts` + 5 plus gros fichiers de `web/src/viewer` (`find … -name '*.ts' | xargs wc -l | sort -n | tail`)
- [ ] parité : liste des écarts restants (formats différés, stubs, NV) tirée de PROGRESS.md (fin + section « Reste hors parité ») et PORTAGE_WEB.md, chacun `source:L — écart — fichier de code concerné (rg)`
- [ ] tests : unitaires (vitest api/web : nombre de fichiers `*.test.ts`), e2e Playwright vs scripts `proof-*.mjs` (comment ils se lancent, prérequis serveur)
- [ ] règles : contraintes dures de `.claude/rules/*` résumées ≤ 10 lignes (style, tests, git, api, agent)
- [ ] lots candidats : 3-6, chacun `titre — fichiers principaux — risque H/M/B`, fichiers disjoints entre lots
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. Racine G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online (abrégé G dans tout le pack).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/PORTAGE_WEB.md` | L | architecture portage, 155 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/PROGRESS.md` | L | journal ; lire L1-80 et L560-675 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/README.md` | L | démarrage, statut honnête |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/CLAUDE.md` | L | stack, commandes, monolithes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.claude/rules/01-style.md` | L | |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.claude/rules/02-tests.md` | L | |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.claude/rules/03-git.md` | L | |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.claude/rules/05-agent.md` | L | |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/package.json` | L | scripts racine |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/package.json` | L | scripts, versions |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | L | scripts, engines |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/playwright.config.ts` | L | stack e2e |

## Contrats
```
scripts racine : install:all · dev:api · dev:web · test (api) · typecheck (api+web+build:viewer-types) · lint (web) · check:viewer-html · build · smoke
monolithes gelés (CLAUDE.md) : web/src/viewer/main.ts ~9400 · web/src/viewer/geoplan/workspace.ts ~6200 · api/src/server.ts ~3400 · api/src/schema.ts gelé
viewer : renderer desktop vendoré web/src/viewer/, HttpBackend remplace window.glrAPI (pont Electron) par URLs signées ; monté en iframe
```

## Décisions actées
- lecture seule — reco avant cadrage final
- ne rien installer, ne rien lancer de npm — deps absentes, décision humaine

## Hors périmètre
- `npm install`, `npm run *`, `docker`, `git init` ; écrire hors `result.md`
- lire les `RAPPORT_*.md` racine (sauf `rg` ciblé ≤ 3)
- `worker/` Python, `geoplan`, packs métier : mentionner, ne pas détailler

## Environnement
- node v22.22.1 machine ; aucun node_modules ; dossier sans `.git` (copie zip probable)
- shell fish côté humain ; utiliser `bash -c` si syntaxe POSIX

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, find, head, sed -n, node -v)
- rg/wc/ls/find libres sur G/web/src, G/api/src, G/e2e, G/scripts : comptage, localisation ; pas de lecture intégrale hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Carte
- chemin:L — rôle
## Santé
- fait
## Parité
- source:L — écart — code
## Tests
- fait
## Règles
- contrainte
## Lots candidats
- titre — fichiers — H/M/B
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
