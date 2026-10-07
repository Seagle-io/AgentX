---
pack: T005
projet: geolens-viewer
role: eclaireur
cree: 2026-10-07
---

# Pack T005 — Reco preuves e2e exécutables sous Linux

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Établir comment faire tourner sous Linux les preuves `e2e/proof-*.mjs` qui jugeront les lots sécurité (viewer, upload, persistance, export) : prérequis, chemins Windows à remplacer, commande exacte, sans rien modifier. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] runner : `e2e/package.json` scripts, `npm run proofs` racine ? (13 preuves selon T001), Playwright version, navigateur requis (`npx playwright install chromium` nécessaire ?)
- [ ] serveurs requis : API (`npm run dev:api`, port 4000), web (`dev:web`, port ?) ou build + preview ; variables d'env utilisées par les preuves (`rg -n "process.env" e2e/*.mjs`)
- [ ] chemins Windows : liste des 17 fichiers `C:/tmp/glw-proofs` + autres chemins absolus Windows (`rg -n "[A-Z]:[/\\\\]" e2e`) ; correctif minimal unique (constante partagée ? helper existant ?)
- [ ] module de session partagé existant ? duplication login (`rg -c "login" e2e/proof-*.mjs`)
- [ ] sélection : pour chaque lot (XSS viewer, CSP/décodeurs, upload, sessions/jetons, exports), les 1-3 preuves qui l'exercent — `proof-x.mjs — ce qu'elle vérifie ≤ 10 mots`
- [ ] dépendance aux données : preuves exigeant des .pnts/tilesets lourds non présents (seed-data gitignoré, scripts populate)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. proofs : `head -60` + rg ciblé.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/package.json` | L | scripts, versions |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/playwright.config.ts` | L | config inutilisée ? |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | L | type de preuve viewer |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-interaction.mjs` | L | 20 assertions |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-upload.mjs` | L | upload |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-persistence.mjs` | L | persistance |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-export.mjs` | L | exports |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/package.json` | L | script proofs |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/README.md` | L | section preuves |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | port, proxy /api |

## Contrats
```
scripts racine : dev:api (API :4000, pg-mem + stockage local seed-data/storage) · dev:web (Vite)
T001 : proofs écrivent dans C:/tmp/glw-proofs/ (17 fichiers) ; npm run proofs enchaîne 13 preuves ; README en annonce 12
audit : Playwright configuré mais jamais utilisé par son runner, duplication 32,6 %
```

## Décisions actées
- lecture seule — reco avant lot E1
- ne pas migrer vers le runner Playwright — HP, refonte e2e

## Hors périmètre
- modifier un fichier ; `npm install` dans e2e ; lancer une preuve ; installer un navigateur
- factoriser les preuves, archiver les orphelines

## Environnement
- node v22.22.1 ; node_modules api+web installés ; e2e : non installé
- base verte 2026-10-07 : typecheck OK · lint 0 err · api 571 tests · web 1665 tests
- G sans `.git` : pas de `git diff` ; copie de référence AgentX/.cache/geolens-baseline-2026-10-07
- shell humain fish : utiliser `bash -c` si syntaxe POSIX

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, find, sed -n, head)
- rg/wc/find/sed -n ciblé libres sur G/api, G/web/src, G/worker, G/scripts, G/e2e : localiser, pas de lecture intégrale hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T005
statut: fait | bloque
---
## Constats
- ID-audit · chemin:L1-L2 — mécanisme ≤ 12 mots — confirmé | ≠ audit (préciser)
## Correctif minimal
- ID-audit · fichiers E (chemins exacts) · changement ≤ 20 mots · test de non-régression (fichier test + cas)
## Contrats
```
signatures/types/config existants à recopier dans les packs d'implémentation, verbatim
```
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots à fichiers disjoints, collisions entre lots
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
