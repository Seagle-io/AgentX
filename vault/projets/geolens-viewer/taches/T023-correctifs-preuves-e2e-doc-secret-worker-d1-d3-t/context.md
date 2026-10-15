---
pack: T023
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T023 — Correctifs preuves e2e + doc secret worker (D1-D3 T015)

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 3 défauts e2e du vérificateur T015 (seuil dur proof-interaction, `PROOF_MIN_TILES` non numérique, message trompeur), conditionner le seuil mémoire de proof-viewer aux assets, et documenter `GEOLENS_ENV`/`GEOPLAN_WORKER_SECRET` côté worker. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] proof-interaction.mjs:39 `>= 20` → `>= minTiles(20)` ; `rg -n ">= 20" e2e/proof-interaction.mjs` → ∅
- [ ] _proofEnv.mjs `minTiles` = contrat (NaN/négatif → warn + règle par défaut ; message distinct si forcé par env)
- [ ] proof-viewer.mjs:71 `mem.geometries >= 30 && mem.textures >= 10` → `mem.geometries >= minTiles(30) && mem.textures >= (ASSETS_PRESENT ? 10 : 0)` (import ASSETS_PRESENT)
- [ ] worker/README.md : section « Sécurité » (≤ 12 lignes, contrat) ; app.py docstring :1-14 : « secret partagé optionnel » → texte contrat
- [ ] vérifs collées : `node --check` (3 .mjs) · `PROOF_MIN_TILES=abc node -e "import('./_proofEnv.mjs').then(m=>console.log(m.minTiles(30)))"` → `0` + 1 warn · `PROOF_MIN_TILES=5 …minTiles(30)` → `5` + warn « forcé » · sans env → `0` + warn « assets absents » · `python3 -m py_compile worker/geolens_worker/app.py`
- [ ] `git -C G diff --stat -- e2e worker` collé : 5 fichiers max
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/_proofEnv.mjs` | E | minTiles :18-27 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-interaction.mjs` | E | :6 import, :39 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | E | :11 import, :71 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/README.md` | E | ~:58 secret |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/app.py` | E | docstring :1-14 SEULEMENT |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/secret.py` | L | comportement réel (48 l) |

## Contrats
```js
// ═══ _proofEnv.mjs minTiles — CIBLE
// raw = process.env.PROOF_MIN_TILES
// raw défini ET n = Number(raw) entier fini ≥ 0 → n ; si n < original → console.warn(`SEUIL FORCÉ ${original}→${n} (PROOF_MIN_TILES)`) 1×/valeur
// raw défini mais invalide (NaN, négatif, vide, non entier) → console.warn(`PROOF_MIN_TILES ignoré : "${raw}" invalide`) 1× puis règle par défaut
// règle par défaut : ASSETS_PRESENT ? original : 0 ; si 0 < original → console.warn(`SEUIL ASSOUPLI ${original}→0 : assets 3D absents (decisions.md D4)`) 1×/valeur
export function minTiles(original);
// exports existants inchangés : DIR, ASSETS_PRESENT, skipIfMissing
```
```markdown
<!-- worker/README.md — section Sécurité (contenu attendu) -->
## Sécurité
- `GEOPLAN_WORKER_SECRET` : secret partagé avec l'API (`X-Worker-Secret`), comparé en temps constant ; ASCII uniquement (ex. `openssl rand -hex 32`)
- `GEOLENS_ENV=production` : le worker REFUSE de démarrer sans `GEOPLAN_WORKER_SECRET` (MissingWorkerSecret)
- hors production sans secret : accès ouvert + avertissement au démarrage (dev uniquement)
- côté API : `GEOPLAN_WORKER_SECRET` identique dans le `.env` de l'API
```
app.py docstring cible (remplace la mention « optionnel ») : « Secret partagé X-Worker-Secret obligatoire si GEOLENS_ENV=production (cf. secret.py, README §Sécurité). »
Faits T015 : interaction:6 importe déjà `{ DIR, minTiles }` ; viewer:11 importe `{ DIR, minTiles }` ; secret non-ASCII → header latin-1 ≠ compare utf-8 → 401 (d'où « ASCII uniquement »)

## Décisions actées
- seuils conditionnés aux données, override PROOF_MIN_TILES — decisions.md D4
- refus prod via GEOLENS_ENV — decisions.md H1
- secret ASCII documenté, pas de code — comportement actuel sûr (401)

## Hors périmètre
- diag-*.mjs, autres proof-*, package.json, README racine
- secret.py, tests worker, code app.py hors docstring
- compose/.env (le worker n'y figure pas)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; e2e/node_modules absent → `node --check` et import de _proofEnv.mjs seulement (cwd e2e)
- python3 système ; scipy absent → py_compile seulement
- G sous git, baseline 745d46f ; d'autres agents écrivent dans api/, web/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(node --check, node -e, python3 -m py_compile, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T023
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
