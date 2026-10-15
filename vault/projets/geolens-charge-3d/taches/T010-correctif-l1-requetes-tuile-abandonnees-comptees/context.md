---
pack: T010
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T010 — Correctif L1 : requêtes tuile abandonnées comptées (499)

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Compter dans `tileMetrics` les requêtes tuile dont le client coupe la connexion avant la fin de la réponse (aujourd'hui absentes : Fastify 5.12.5 n'appelle pas `onResponse`) → statut pseudo `499`, `total` enregistré, 0 double comptage ; repro T008 au vert.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] abort pendant le handler (storage lent) ET abort pendant l'envoi du flux → `status['499']` +1, `total.count` +1, `send` non enregistré
- [ ] réponse complète → comportement inchangé (1 seul comptage, jamais 499) ; ordre close/onResponse indifférent
- [ ] 499 : pas de ligne `tile 4xx` ; si total ≥ slowMs → 1 ligne warn `tile slow` avec `status: 499` (soumise à takeLogSlot)
- [ ] `api/test/tile-metrics.test.ts` : 2 cas abort repris de la repro T008 (HTTP réel, Fastify nu) + 1 cas « réponse complète → pas de 499 » ; les 2 cas `-t abort` de la repro passent
- [ ] `rg -n "req\.(query|url)" G/api/src/tileMetrics.ts` → ∅ ; tileMetrics.ts ≤ 400 l, fonctions ≤ 60 l
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 99 fichiers / 869 tests) ; synthèse collée
- [ ] `git -C G diff --stat -- api/src/server.ts` : ≤ 1 ligne modifiée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileMetrics.ts` | E | :103-125 tileLogLine/interface, :140-203 register |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :741 options de route seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-metrics.test.ts` | E | +3 cas |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/test/verif-t008-core.test.ts` | L | :100-165 repro abort (HTTP réel) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/node_modules/fastify/types/hooks.d.ts` | L | :600-660 onRequest, onRequestAbort |

## Contrats
Actuel (server.ts:741) :
```ts
{ logLevel: 'warn', onSend: tileMetrics.onSend, onResponse: tileMetrics.onResponse,
  config: { rateLimit: { max: config.rateLimitTileMax, timeWindow: '1 minute', keyGenerator: (req) => tileRateKey(config, req) } } },
```
Actuel (tileMetrics.ts) :
```ts
export interface TileRouteMetrics {
  time<T>(req: object, phase: 'sql' | 'storage', fn: () => Promise<T>): Promise<T>; // record en finally (y.c. throw) ; ms par req (WeakMap)
  onSend(req: object, reply: unknown, payload: unknown): Promise<unknown>;          // marque t0 envoi ; payload inchangé
  onResponse(req: TileReqLike, reply: TileReplyLike): Promise<void>; // total ; send si 200|206 ; status ; slow ; tileLogLine si takeLogSlot
  flush(): TileMetricsSnapshot | null;
}
/** ≥500 → error 'tile 5xx' ; 400-499 → warn 'tile 4xx' ; sinon totalMs ≥ slowMs → warn 'tile slow' ; sinon null. */
export function tileLogLine(i: TileLogInput): TileLogLine | null;
export interface TileReplyLike { statusCode: number; elapsedTime: number }
```
Ajout imposé (forme libre dans ce cadre) :
```ts
// TileRouteMetrics
onRequest(req: TileReqLike, reply: { raw: { once(ev: 'close', cb: () => void): unknown; writableFinished: boolean } }): Promise<void>;
// → reply.raw.once('close', …) : si !writableFinished ET onResponse pas encore passé → abandon : countStatus(499), record('total', now()−t0Req), slow, ligne 'tile slow' si lente
// → onResponse marque la requête « terminée » (WeakMap) : close ultérieur = no-op
export const TILE_ABORT_STATUS = 499;
// tileLogLine : status 499 → jamais 'tile 4xx' ; 'tile slow' si totalMs ≥ slowMs, sinon null
```
server.ts:741 → ajouter `onRequest: tileMetrics.onRequest,` dans le même objet (1 ligne modifiée).
`onRequestAbort` (hooks.d.ts:617-618) ne se déclenche que si le client coupe AVANT la fin de la REQUÊTE → insuffisant pour un GET ; ne pas l'utiliser seul.

## Décisions actées
- abandon = statut pseudo 499 (convention nginx), compté, pas une erreur — renderer annule les tuiles hors champ
- 0 ligne 4xx pour un abandon ; ligne `tile slow` seulement si lent
- histogramme, fenêtre, plafond de lignes inchangés — D6

## Hors périmètre
- presign / storage.ts / config.ts (lot A, commité 77ecdcd)
- toute autre route ; 304 / tileEtag (D7)
- `W/` (worktrees de vérif) : lecture seule
- commit (le chef commite)

## Environnement
- node v22.22.1 ; fastify 5.12.5 : abort client → `onResponse` jamais appelé (constaté T008)
- vitest 2.1.8 ; fake timers seulement sur Fastify nu ; tests HTTP réels : `app.listen({ port: 0 })` + `http.get` + `req.destroy()` (modèle repro T008)
- HEAD G = 77ecdcd ; base 99 fichiers / 869 tests ; un vérificateur (T009) travaille dans `AgentX/.cache/wt-charge3d-T007`
- DoD périmètre : `git -C G status --short -- api/`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
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
