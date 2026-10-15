---
pack: T015
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T015 — Vérif T011+T012 : secret worker, preuves e2e Linux

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter chaque affirmation livrée par T011 (secret worker) et T012 (preuves e2e portables) ci-dessous ; rendre `OK` ou `DÉFAUTS` avec reproduction par défaut ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A1-A6 (worker) : chacune OK/KO avec commande + sortie
- [ ] B1-B6 (e2e) : chacune OK/KO avec commande + sortie
- [ ] ≥ 3 contre-exemples tentés hors cas déjà testés (ex. secret unicode, header vide "", PROOF_MIN_TILES=abc, OUT relatif)
- [ ] `git -C G diff -- worker e2e` relu : 0 changement hors WL T011/T012
- [ ] verdict global `OK` | `DÉFAUTS` ; chaque défaut = fichier:ligne + repro + attendu/obtenu
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution). Écriture : `result.md` de ce dossier seulement.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/secret.py` | L | livré T011 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/app.py` | L | branchement T011 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/tests/test_secret.py` | L | tests T011 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/_proofEnv.mjs` | L | livré T012 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | L | seuils |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-refine.mjs` | L | seuil :19 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-pnts.mjs` | L | seuils :50,:52 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-interaction.mjs` | L | seuil :36 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-package.mjs` | L | skip :83 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-cloudpkg.mjs` | L | skip :65 |

## Contrats
Affirmations à réfuter :
- A1 `check_secret` compare via `hmac.compare_digest` (secret.py:47) ; 0 `!=` sur le secret dans app.py
- A2 secret vide + `GEOLENS_ENV=production` → `create_app()` lève `MissingWorkerSecret` (require_secret_at_startup 1ʳᵉ ligne de create_app, app.py:106)
- A3 secret vide hors prod → warning journalisé, accès ouvert (comportement dev conservé)
- A4 les 4 routes appelant l'ancien `_check_secret` appellent `check_secret` (app.py:116,127,133,149) ; `rg -n "_check_secret|\bos\." app.py` → ∅
- A5 `python3 -m pytest -q --noconftest tests/test_secret.py` (cwd worker) → 7 passed
- A6 `import os` retiré d'app.py sans NameError (aucun `os.` restant)
- B1 `rg -n "C:/" e2e/proof-*.mjs` → ∅ ; DIR = `process.env.OUT || path.join(os.tmpdir(),'glw-proofs')`, créé au chargement
- B2 `ASSETS_PRESENT` true ssi ≥1 .b3dm/.pnts sous seed-data/storage/villelaure-real ; false aujourd'hui
- B3 `minTiles(n)` : PROOF_MIN_TILES défini → Number(...) ; sinon assets ? n : 0 ; warn si < n
- B4 `skipIfMissing` → ligne `SKIP <fichier> : raison` + exit 0, AVANT tout lancement navigateur (package :83, cloudpkg :65)
- B5 `node --check` OK sur les 12 fichiers e2e touchés
- B6 reste dur connu : proof-viewer.mjs:71 `mem.geometries >= 30 && mem.textures >= 10` — confirmer/infirmer, ne pas compter comme défaut T012 (hors pack)
Contrat secret.py attendu (pack T011) :
```python
SECRET_ENV = "GEOPLAN_WORKER_SECRET" ; ENV_ENV = "GEOLENS_ENV"
class MissingWorkerSecret(RuntimeError)
def expected_secret() -> str          # strip
def is_production() -> bool           # GEOLENS_ENV.strip().lower() == "production"
def require_secret_at_startup() -> None
def check_secret(x_worker_secret: str | None) -> None   # 401 "secret worker invalide"
```

## Décisions actées
- refus démarrage seulement si GEOLENS_ENV=production — decisions.md H1
- seuils conditionnés aux données + SKIP exit 0 — decisions.md D4
- tests app.py non lançables (scipy absent) — NV accepté, ne pas installer

## Hors périmètre
- corriger quoi que ce soit ; éditer un fichier de G
- pip install, npm ci, lancer la stack ou une preuve navigateur
- web/, api/, Caddyfile (autres tâches en cours)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- python3 + pytest système ; fastapi/numpy/httpx OK ; scipy ABSENT → `import geolens_worker.app` impossible → tester A2/A4 par lecture + `python3 -c` sur secret.py seul
- node v22.22.1 ; e2e/node_modules absent → `node --check`, `node -e "import('./_proofEnv.mjs')…"` OK
- G sous git, baseline 745d46f : `git -C G diff -- worker e2e` ; fichiers neufs via `git -C G status --short worker e2e`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(python3, python3 -m pytest, node --check, node -e, rg, git diff, git status, git show), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T015
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A6, B1..B6 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro (commande) · attendu / obtenu
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
