---
pack: T062
projet: geolens-viewer
role: eclaireur
cree: 2026-10-08
---

# Pack T062 — Reco charge tuiles : N comptes sur un même modèle 3D — chemin de service, cache, limites, coût par tuile

> Seule source de vérité de l'agent T062. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Établir, avec coordonnées et mesures, ce que coûte au serveur l'ouverture d'un même modèle 3D par N comptes simultanés (chemin d'une tuile : viewer → Caddy → API → stockage S3/local), où ça sature en premier (CPU, mémoire, sockets S3, bande passante API, rate-limit) et quels leviers existent déjà ; 0 modification de G. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] chemin d'une tuile, étape par étape avec coordonnées : URL signée (jeton par user ? par projet ?) → Caddy (`encode zstd gzip` appliqué aux .b3dm/.pnts/.glb ?) → route `/api/projects/:id/storage/*` (server.ts:729-800) : vérifs DB par requête (combien de SELECT ?), ETag/304, Range, stream S3 (`storage.ts` getObject) ou disque
- [ ] cache : URL de tuile identique entre 2 comptes sur le même projet ? (jeton contient `u` user → oui/non) ; Cache-Control actuel `private, max-age=86400, immutable` (server.ts:516) → cache partagé (Caddy/CDN) possible ou non
- [ ] presign S3 existant (storage.ts:568-572 getSignedUrl) : où utilisé aujourd'hui, réutilisable pour rediriger les tuiles (302) ?
- [ ] limites : `rateLimitTileMax` (5000/min/IP, server.ts:734) — effet pour N comptes derrière une même IP (bureau, NAT) ; rate-limit global 300/min s'applique-t-il aux tuiles ? ; client S3 : maxSockets / keepAlive (storage.ts) ; healthcheck
- [ ] viewer : concurrence de téléchargement 3d-tiles-renderer (TilesRendererLoader.ts:290-330 downloadQueue/parseQueue maxJobs), nombre de tuiles typique au chargement (proofs : ≥30, refine ≥150)
- [ ] MESURE (stack locale, stockage local, pg-mem) : script node jetable HORS G (`mktemp -d`, fetch natif, 0 dépendance) qui ouvre K sessions (login seed) sur le même projet et télécharge en parallèle les mêmes tuiles du seed (villelaure-real : tileset.json + fichiers présents) — K = 1, 10, 50 : débit (req/s), latence p50/p95, codes 429/5xx, RSS du process API (`ps -o rss`) ; sorties brutes collées
- [ ] tableau leviers : (a) jeton de tuile par projet+fenêtre (URL identique entre comptes) + cache partagé Caddy · (b) 302 vers URL S3 présignée · (c) exclure les tuiles de `encode` Caddy · (d) clé de rate-limit tuile par user/jeton au lieu de l'IP · (e) cache mémoire LRU côté API · (f) CDN Scaleway Edge Services — pour chacun : gain attendu, fichiers à toucher, risque sécurité (révocation, fuite d'URL), taille S/M/L
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. rg libre sur les dossiers api/src, web/src/viewer, e2e du dépôt.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :500-560 jeton/cache, :720-800 route storage, :1190-1240 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | 679 l : getObject local/S3, client S3, presign :560-575 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileExp.ts` | L | fenêtre de jeton |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | resolveActiveUser (coût DB par tuile) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | rateLimitTileMax, trustProxy |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | encode, en-têtes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | L | ressources, 1 réplique api |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :280-340 files d'attente, LRU |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | makeSignUrl, cache client |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/playwright.config.ts` | L | commande de lancement de l'API (env pg-mem, stockage local) |

## Contrats
```
faits connus :
- jeton tuile = base64url(JSON{p,u,exp}).HMAC (storage.ts signTileToken) — contient u (user) → URL différente par compte (à confirmer)
- exp quantifiée : (⌊(now+T)/W⌋+1)·W, T 28800 W 14400 (tileExp.ts) → URL stable 4 h pour un même user
- route tuile : resolveSignedProject → resolveActiveUser (SELECT users⋈organizations) + getAccessibleProject par requête (D6/T007)
- ETag dérivé du chemin, 304 sans accès stockage ; IMMUTABLE_CACHE 'private, max-age=86400, immutable'
- rate-limit tuile : config.rateLimitTileMax (5000/min, clé = req.ip, TRUST_PROXY=uniquelocal en prod)
- prod : 1 seul service api (docker-compose.scaleway.yml), Caddy devant, stockage Scaleway Object Storage (S3)
lancement API locale (playwright.config.ts) : cwd api, `USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=../seed-data/storage JWT_SECRET=e2e PORT=4000 WEB_ORIGIN=http://localhost:5173 npx tsx src/index.ts`
login seed : admin@demo.geolens.fr / demo1234 (POST /api/auth/login JSON {email,password} → cookie glx_session) ; GET /api/projects → id ; GET /api/projects/:id → tilesetUrl signée
ports interdits : 5173 (Vite d'un autre projet) ; utiliser PORT=4100 pour l'API de mesure ; tuer le process à la fin
```

## Décisions actées
- reco + mesure seulement ; l'humain et l'architecte tranchent ensuite
- sécurité acquise non négociable : révocation de session immédiate (D6), jeton limité à l'origine API (T009), journaux sans jeton

## Hors périmètre
- modifier G ; installer une dépendance (autocannon, k6…) ; docker compose up de la stack prod
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; api/node_modules ; pg-mem + stockage local seed (assets 3D lourds absents : peu de tuiles, mesurer sur ce qui existe et le dire)
- G sous git, HEAD 120d0aa, arbre propre — vérifier `git status` vide à la fin (0 fichier créé dans G)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls, mktemp, node, npx tsx (API de mesure), curl, ps, kill du seul process lancé, git status), Write (result.md + script jetable hors G)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T062
statut: fait | bloque
---
## Chemin d'une tuile
- étape · chemin:L — coût (requêtes DB, I/O, CPU)
## Mesures
| K sessions | req/s | p50 | p95 | 429 | 5xx | RSS API |
## Goulots
- rang · ressource · seuil estimé · preuve
## Leviers
| # | levier | gain | fichiers | risque sécurité | taille |
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
