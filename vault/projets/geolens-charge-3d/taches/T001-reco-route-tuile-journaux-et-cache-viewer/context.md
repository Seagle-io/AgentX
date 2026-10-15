---
pack: T001
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-12
---

# Pack T001 — Reco route tuile, journaux et cache viewer

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier dans `G` le chemin d'une requête tuile (API + viewer) → coordonnées pour les packs phases 0-2 de l'epic charge 3D ; 0 édition de code.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] Q1 ordre exact des étapes de `GET /api/projects/:id/storage/*` (G/api/src/server.ts:733, ancre `'/api/projects/:id/storage/*'`) : HMAC, rate-limit, SQL (tileAuth), 304, presign/302, Range, stream, log → 1 ligne/étape `chemin:L — rôle`
- [ ] Q2 point d'insertion d'un 304 avant le SELECT : conditions (ETag dérivé du chemin, branche « saute le 304 » vers server.ts:755) + ce qui doit rester vérifié avant (jeton HMAC, exp)
- [ ] Q3 journalisation par requête : `loggerOptions` (server.ts:155), niveau, hooks `onResponse`/`onRequest` existants, `disableRequestLogging` ou équivalent ; où filtrer pour ne garder que 4xx/5xx/lents sur la seule route tuile
- [ ] Q4 point d'accroche d'un chronométrage agrégé (SQL, lecture S3, envoi) dans un module dédié : hooks fastify utilisables, `reply` en stream (fin d'envoi détectable où ?), exposition possible (route interne ? log périodique ?) — lister l'existant, ne rien concevoir
- [ ] Q5 activation `TILE_PRESIGN_REDIRECT` : flag config, chemin `tileRedirect.ts`, CSP `G/web/viewer.html:13` (origine provisoire), synchro `src/viewer/index.html`, ce qui manque encore (CORS bucket, MinIO joignable) → liste
- [ ] Q6 viewer : où l'URL tuile reçoit son jeton (`__glrSignUrl`, install.ts, HttpBackend.ts), format du paramètre, comment `TilesRendererLoader.ts` fetch (fetch natif ? `fetchOptions` ? hook de requête 3d-tiles-renderer ?) → point d'insertion d'un cache Cache Storage indexé par chemin sans jeton ; chemin COPC (requêtes Range) à exclure
- [ ] Q7 tests existants de la route tuile : `rg -l "storage/" G/api/test` → fichiers + cas couverts (304, 302, 429, 401) en 1 ligne chacun
- [ ] Q8 scripts k6 : présents dans G ? (`rg -l "k6/http" G --hidden -g '!node_modules'`) ; chiffres de référence de `G/RAPPORT_CHARGE_CORRECTIFS.md` (VUs, p95, cœurs)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule. rg -n libre sur les dossiers api/src, api/test, web/src/viewer de G (sortie ≤ 30 lignes/appel) ; ouvrir seulement :
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :140-200,500-560,725-830 logger, ETag/304, route tuile |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | L | SELECT d'autorisation |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRedirect.ts` | L | décision 302 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | :40-120 sign/verify jeton, presign |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | :195-235 TILE_* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | L | sérialiseur req |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | pool, query nommée |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | :1-20 CSP meta |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | L | signature URL |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | backend http |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | fetch des tuiles |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/RAPPORT_CHARGE_CORRECTIFS.md` | L | chiffres k6 |

## Contrats
```
config.ts:212  tileUrlWindowSec: posInt(env.TILE_URL_WINDOW_SEC, 14400, 86400), // ≤ 24 h
config.ts:215  rateLimitTileMax: Number(env.RATE_LIMIT_TILE_MAX ?? 5000),
config.ts:223  tilePresign: { enabled: bool(env.TILE_PRESIGN_REDIRECT, false), ttlSec: intIn(env.TILE_PRESIGN_TTL_SEC, 300, 120, 3600) },
server.ts:155  const app = Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy: config.trustProxy });
server.ts:524  const replyNotModified = (req, reply, etag: string): boolean => { … 304 avant accès stockage }
```

## Décisions actées
- 302 vers S3 présigné = levier principal — D19 geolens-viewer
- presign : GET sans Range, extensions binaires, 304/ETag avant, échec → stream — D20
- auth tuile = 1 SELECT préparé nommé `tile_grant`, 0 cache — D6/D22
- jeton tuile : exp = (⌊(now+T)/W⌋+1)·W, T 28800, W 14400 — D6
- monolithes gelés (`server.ts`, `main.ts`) : nouveau code en module dédié

## Hors périmètre
- toute édition, tout commit, toute commande `npm`/`docker`
- serveur de test 82.65.97.67 : 0 ssh, 0 requête
- `G/web/src/viewer/main.ts` (9405 l) : `rg` seulement, jamais ouvert
- concevoir les solutions : localiser seulement
- phases 3-4 de l'epic (multi-process, compression)

## Environnement
- node v22.22.1 ; G = git local, branche master, HEAD da5fced ; arbre sale (TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine.ts : mission D24 non commitée) → lire tel quel
- coordonnées données = HEAD du 2026-10-12 ; reconfirmer par ancre `rg`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg:*, wc:*), Write (result.md seul)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- Q1..Q8 : chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
