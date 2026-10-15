---
pack: T005
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T005 — Scripts k6 dans tools/load + 3 scénarios

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Verser les scripts k6 du serveur de test dans `G/tools/load/` (0 identifiant) et y ajouter 3 scénarios — retour 304, COPC par plages, suivi des 302 — plus un p95 agrégé tous VUs dans `make report`.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` · S = `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-k6`

## Definition of Done
- [ ] `G/tools/load/viewer-navigation.js` = S/viewer-navigation.js + env `SCENARIO` ∈ `navigation` (défaut, comportement actuel inchangé) · `revisit` · `redirect` ; usage en tête à jour (chemin `tools/load/`)
- [ ] `revisit` : passe 1 mémorise `ETag` par chemin SANS `token` ; déplacements suivants re-demandent des tuiles déjà vues avec `If-None-Match` ; Counter `tile_304` ; tag `storage/tile-revisit`
- [ ] `redirect` : tuiles en `redirects: 0` ; 302 → GET de `Location` sans cookie, tag `s3/tile` ; Counters `tile_302`, `s3_bytes` ; erreurs S3 (≠ 200/206) → `s3_err` ; seuils `http_req_duration{name:s3/tile}` p95 et `http_req_failed{name:s3/tile}`
- [ ] `G/tools/load/copc-ranges.js` : env `PROJECT_ID`, `COPC_PATH` (chemin relatif dans le stockage du projet, obligatoire), `RANGE_KB` (défaut 256), `RANGES_PER_ITER` (défaut 16) ; jeton pris de `tilesetUrl` comme viewer-navigation.js:171-172 ; 1ʳᵉ lecture `Range: bytes=0-65535`, taille totale tirée de `Content-Range`, puis plages aléatoires ; tag `storage/copc` ; Counter `copc_206`, `copc_err`
- [ ] `G/tools/load/Makefile` = S/Makefile + `SCRIPT ?= viewer-navigation.js`, `SCENARIO ?= navigation`, `COPC_PATH ?=` transmis par `-e` ; `--out csv=/out/u$$i.csv.gz` ajouté ; `make report` imprime en plus `p95 agrégé tuile` = p95 exact de `http_req_duration` sur TOUS les échantillons `name=storage/tile` des `u*.csv.gz` (et `s3/tile`, `storage/copc` si présents)
- [ ] 0 identifiant : `rg -n "demo1234|@demo\.geolens\.fr" G/tools/load` → ∅ (défaut USERS vidé → `setup()` lève si USERS absent, comme PROJECT_ID) ; Makefile lit toujours `-include .env.k6`
- [ ] `docker run --rm -v G/tools/load:/s:ro grafana/k6:0.54.0 inspect /s/<script>` exit 0 pour les 2 scripts, avec `-e SCENARIO=revisit` et `-e SCENARIO=redirect` pour viewer-navigation.js
- [ ] `make -n run VUS=2 SCENARIO=redirect -C G/tools/load PROJECT_ID=x USERS=a:b` → la ligne `docker run` contient `-e SCENARIO=redirect` et `--out csv=` (sortie collée)
- [ ] `python3 -c` du report testé sur 2 faux `u1.csv.gz`/`u2.csv.gz` fabriqués dans `/tmp/t005/` (≥ 3 lignes `storage/tile` chacun) → p95 attendu calculé à la main = p95 imprimé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-k6/viewer-navigation.js` | L | source, 238 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-k6/Makefile` | L | source, 80 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/viewer-navigation.js` | E | neuf |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/copc-ranges.js` | E | neuf, ≤ 200 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/Makefile` | E | neuf |

## Contrats
Route tuile (API) : `GET /api/projects/:id/storage/<rel>?token=<jeton>` ; réponses 200 · 206 (Range) · 304 (If-None-Match = ETag) · 302 (Location présignée, si flag serveur) · 403 jeton/accès · 429 quota.
302 émis seulement pour GET sans Range et ext ∈ b3dm pnts i3dm cmpt glb bin ktx2 jpg png webp ; jamais pour `tileset.json`/`project.json`.
ETag = chaîne opaque (`"…"`) ; `Cache-Control: private, max-age=86400, immutable`.
Viewer (lecture COPC, HttpBackend.ts:217-221) :
```
fetch(sign(resolve(filePath)), { credentials: 'same-origin', headers: { Range: `bytes=${begin}-${Math.max(begin, end - 1)}` } })
// attend 206 ; COPC jamais redirigé (Range)
```
Session : cookie `glx_session` ; login `POST /api/auth/login` JSON `{email,password}` ; 10/min/IP (setup déjà rythmé, S:159).
Jeton : `decodeURIComponent(tilesetUrl.split('token=')[1])` (S:172) ; `tilesetUrl` de `GET /api/projects/:id`.
k6 : image `grafana/k6:0.54.0` ; `http.batch`, `params.redirects`, `res.headers['Etag']`/`['Location']`/`['Content-Range']` (casse k6 = canonique Go : `Etag`, `Location`, `Content-Range`).

## Décisions actées
- scripts versés au dépôt, identifiants hors dépôt (`~/.env.k6`) — D3
- 1 conteneur k6 = 1 VU = 1 IP (Makefile actuel) conservé
- objectif mesuré = p95 `http_req_duration{name:storage/tile}` agrégé tous VUs < 150 ms à 30 VUs, 0 429/5xx — D1
- mode `navigation` par défaut : résultats comparables aux mesures du 09/10

## Hors périmètre
- serveur de test : 0 ssh, 0 lancement de k6 réel
- `api/`, `web/`, autres dossiers de G ; aucun `.md` à la racine de G
- dépendance npm nouvelle ; package.json
- commit (le chef commite)

## Environnement
- `docker run … grafana/k6:0.54.0 inspect` vérifié OK par le chef sur S/viewer-navigation.js (jslib k6-summary téléchargé à l'inspection : réseau requis)
- python3 local dispo pour tester le report ; image `python:3-alpine` utilisée par le Makefile sur le serveur
- G : git local master, arbre sale hors tools/ (mission D24) → ne pas toucher
- DoD périmètre : `git -C G status --short -- tools/load` seulement

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Bash(docker run grafana/k6:0.54.0, make -n, python3, rg, mkdir /tmp/t005)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Machine partagée : ne supprimer que `/tmp/t005` ; jamais `docker rm`/prune hors conteneurs `--rm`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T005
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
