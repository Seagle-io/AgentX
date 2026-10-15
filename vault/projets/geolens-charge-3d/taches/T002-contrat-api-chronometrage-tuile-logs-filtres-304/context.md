---
pack: T002
projet: geolens-charge-3d
role: architecte
cree: 2026-10-12
---

# Pack T002 — Contrat API : chronométrage tuile, logs filtrés, 304 sans SELECT

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire dans `result.md` 3 contrats exécutables pour la route tuile de G (0.2 chronométrage agrégé, 1.2 logs 4xx/5xx/lents seulement, 1.3 304 avant SELECT) → un implémenteur code sans rouvrir de débat ; 0 code de production.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] C1 0.2 : module neuf `api/src/tileMetrics.ts` — signatures TS verbatim (API d'enregistrement, agrégats : count, p50, p95, max par phase sql|storage|send), fenêtre d'agrégation, mode d'exposition (log périodique et/ou route interne protégée ; si route : auth + test 401), coût mémoire borné (chiffre)
- [ ] C1 : points d'appel exacts dans `server.ts` (≤ 6 lignes ajoutées, monolithe gelé) ; fin d'envoi mesurée par hook `onResponse` de route (précédent server.ts:2767) ou autre, justifié
- [ ] C2 1.2 : mécanisme retenu parmi `logLevel` de route (`types/route.d.ts:69`), `disableRequestLogging` fn (`fastify.d.ts:136`, déprécié → `logController`), autre ; seuil « lent » en ms + variable de config (nom, défaut, bornes) ; ligne loguée = champs exacts ; jeton jamais logué (logRedact)
- [ ] C3 1.3 : ETag calculable SANS SELECT ; preuve écrite qu'un ré-import (nouveau storagePrefix) ne produit pas de 304 faux pour un client sans l'ancien contenu ; ordre final des étapes route (HMAC :741 → … → 304 → SELECT → …) ; impact sur `signTileToken` (5 appelants : server.ts:545,599,615,864 ; geoplan/computeProxy.ts:229) et sur la taille d'URL
- [ ] C3 : chiffrer le gain réel du 304 sachant que l'URL change toutes les 4 h (W 14400) et `Cache-Control: private, max-age=86400, immutable` → le navigateur revalide-t-il jamais ? conclure : 1.3 utile seul, ou seulement avec 2.1 (cache viewer clé sans jeton)
- [ ] liste des tests de non-régression à écrire (fichier, nom de cas, assertion) pour C1-C3, dont : 304 sans SELECT (compteur de requêtes db), jeton forgé → 403 avant tout 304, manifeste project.json jamais 304
- [ ] découpage d'implémentation proposé : lots ≤ 12 fichiers, fichiers E par lot, lots parallélisables ou non
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (seul result.md écrit). `rg -n` libre dans api/src et api/test de G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :140-260 boot/logger, :500-620 ETag+jetons, :725-870 route, :2750-2790 hooks route |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | L | resolveTileGrant |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | :40-120 sign/verify jeton |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileExp.ts` | L | fenêtre W |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRateKey.ts` | L | 1ʳᵉ vérif HMAC |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | L | sérialiseur |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | :1-60 type, :195-235 TILE_* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | L | logger: true |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-redirect.test.ts` | L | cas 304/302/429 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/node_modules/fastify/types/logger.d.ts` | L | :100-130 disableRequestLogging, logController |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/node_modules/fastify/types/route.d.ts` | L | :60-80 logLevel de route |

## Contrats
Ordre actuel de la route (T001) :
```
server.ts:733  app.get('/api/projects/:id/storage/*')
:739  rate-limit (5000/min) ; clé tileRateKey.ts:8-13 → verifyTileToken (HMAC n°1)
:741  verifyTileToken (HMAC+exp) n°2 ; :742-744 KO ou payload.p ≠ :id → 403
:749  resolveTileGrant = SELECT `tile_grant` (tileAuth.ts:35-43) ; null → 403
:751  sanitizeRelPath ; null → 400
:758  isMutableManifest (project.json)
:759  storageEtag(grant.storagePrefix, rel) = sha1[0:32]
:760  replyNotModified → 304 (sauté si manifeste)
:763-779  shouldRedirectTile && presignGet → 302 ; échec → warn :775, stream
:789  app.storage.get(prefix, rel, range) ; :796 erreur → 503 ; :803 null → 404
:809-818  Content-Type, Cache-Control IMMUTABLE_CACHE, ETag, Accept-Ranges, 206
:824  reply.send(obj.stream)
IMMUTABLE_CACHE = 'private, max-age=86400, immutable'
jeton : signTileToken(config, { p: projectId, u: userId, exp }) ; ?token=<base64url mac>
exp = (⌊(now+T)/W⌋+1)·W, T 28800, W 14400
```
Logger :
```
index.ts:7     const app = await buildServer({ config, logger: true });
server.ts:155  const app = Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy: config.trustProxy });
logRedact.ts:39-41  { serializers: { req: serializeReq } }  // pino info, 2 lignes/req, toutes routes ; :10 masque token + x-amz-*
fastify 5.12.5 : disableRequestLogging?: boolean | ((req: FastifyRequest) => boolean)  // déprécié → logController
route.d.ts:69  logLevel?: LogLevel;
```
Mesures de référence (serveur de test, 10 VUs) : 48 480 tuiles / 2 min, p95 147-154 ms, API ≈ 1,15 cœur ; ≈ 600 lignes de log/s.

## Décisions actées
- 304 avant SELECT accepté par l'humain ; HMAC + exp + p=:id restent AVANT — D1
- D6 maintenu : 0 cache d'autorisation, 1 SELECT par 200/206 — D1
- monolithe `server.ts` gelé : logique en module, simple appel
- `process.env` lu seulement dans `config.ts`
- presign/302 inchangé (D20 geolens-viewer) : 304/ETag reste avant le 302
- pas de dépendance nouvelle (prom-client…) sans justification écrite

## Hors périmètre
- toute édition de code de G, tout commit, `npm install`
- route jumelle `/imported/*` (server.ts:1197-1230) : signaler si le contrat doit s'y appliquer, ne pas concevoir
- viewer, cache navigateur (phase 2), MinIO/CSP (T004), k6 (T005)
- phases 3-4

## Environnement
- node v22.22.1 ; fastify 5.12.5 ; vitest 2.1.8 ; pg-mem en test (`USE_MEM_DB=1`) : `ON CONFLICT`/`ROLLBACK` non fiables
- api : `npm --prefix api test` (≈ 77 fichiers / 690 tests) · `npm --prefix api run typecheck`
- règles G : fichier neuf ≤ 400 l, fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`, route = test 401 + test autre-org
- arbre G sale (mission D24, web/ seulement) → sans effet sur api/

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg:*, wc:*), Write (result.md seul)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes (contrats en blocs de code verbatim), sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- C1 / C2 / C3 : contrat verbatim + décision ≤ 8 mots + tests + lots
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
