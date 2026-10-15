---
tache: T017
statut: fait
verdict: DÉFAUTS
---
## Livré
- défaut 1 : `tileGrantCache.ts:18,34` — horloge murale `Date.now`, recul NTP → révocation retardée de TTL + recul · repro `verif-t017-cache.test.ts:"horloge murale reculée"` → recul 600 s = servi 631 000 ms > D16 30 s · gravité basse (il faut un saut d'horloge, pas un lissage)
- constat (≠ défaut, D16) : load commencé avant la révocation, fini après → `at` = fin du load ; requête qui rejoint le load en vol après la révocation → positif · retard max = TTL + durée du load (SELECT→résolution) ; mesuré 35 000 ms avec un load de 5 s · `verif-t017-cache.test.ts:"load commencé avant révocation"`
- constat : `''`/`' '` → `Number('')=0` → cache désactivé (≠ commentaire `config.ts:171` « absent → défaut ») ; conforme au contrat intIn littéral ; sans risque pour la sécurité
- constat : `clear()` ne vide pas `inflight` → positif stocké après clear (size 1) ; `clear` hors prod (grep src → 0 appel)
- constat : clés `a\0b|c` et `a|b\0c` en collision → HIT ; non exploitable (u,p signés HMAC, uuid)
- tests casse : `W/api/test/verif-t017-cache.test.ts` (13 cas) · `W/api/test/verif-t017-prefix0.test.ts` (1 témoin)
## Vérifié comment
- `npm --prefix api run typecheck` (W) → `tsc -p tsconfig.test.json` 0 erreur (aussi après l'ajout des verif-t017)
- `npm --prefix api test` (W, base) → `Test Files 100 passed (100) · Tests 893 passed (893)`
- idem avec verif-t017 → `Test Files 102 passed (102) · Tests 907 passed (907)`
- `npx vitest run test/verif-t017-cache.test.ts` → `13 passed`
- fuite : (u1,p1) caché → (u2,p1) et (u1,p2) 2 loads, null → OK ; `server.ts:747` `payload.p !== req.params.id` → 403 avant cache ; route : jeton A sur URL B → 403 après grant A caché → OK
- refus : null ×5 concurrents → 1 load, size 0, l'appel suivant relance → OK ; rejet ×5 → 5 rejected, 1 load, size 0, l'appel suivant relance (inflight vidé) → OK ; throw synchrone de load → throw synchrone, pas d'entrée → OK (resolveTileGrant async : jamais)
- mémoire : 100 000 clés → size 50 000, p50000..p99999 gardées, p49999 évincée, 455 ms → OK ; 100 000 loads en vol → inflight 100 000 (aucun plafond, borné par les requêtes concurrentes), vidé à la fin → OK
- storage_prefix : `UPDATE projects SET storage_prefix='inexistant/republie'` → cache 30000 : GET1 200 · GET2 200 (ancien préfixe, ETag identique) ; cache 0 : GET1 200 · GET2 404 → servi ≤ TTL, D16 OK
- config TILE_GRANT_CACHE_MS : `0→0 -1→30000 30000.5→30000 60000→60000 60001→30000 abc→30000 ''→0 ' '→0 1e4→10000 0x10→16 1000ms→30000`
- config PG_POOL_MAX : `1→10 2→2 100→100 101→10 ''→10 0→10 2.5→10` ; `db.ts:120` max=config.pgPoolMax → OK
- pg-mem : défaut 0 ; pg-mem + env 30000 → 30000
## Écarts
- lecture hors WL : grep `TILE_GRANT_CACHE_MS|PG_POOL_MAX` dans W (*.yml, .env*) — `.env.production.example:11-12` seul, 0 compose qui passe `''`
## Pour la suite
- défaut 1 : `now` par défaut = `performance.now` (monotone) au lieu de `Date.now` dans `tileGrantCache.ts:18` ; test : now recule → expiration ≤ TTL
- borne réelle de révocation = TTL + durée du SELECT (en vol + appels qui rejoignent) ; D16 « ≤ 30 s » → écrire « ≤ TTL + 1 load »
- `TILE_GRANT_CACHE_MS=` vide → cache coupé sans bruit ; si on veut le défaut, traiter `v.trim()===''` comme absent dans intIn (touche toutes les variables qui passent par intIn)
- `inflight` n'a pas de plafond (1 entrée par couple (u,p) en vol) ; acceptable tant que le rate-limit des tuiles borne le débit
## Retour sur le pack
- Manquait : emplacement des fichiers env/compose (pour juger le cas `''`) ; liste des projets DEMO du membre (≥ 2 supposé, vérifié à l'exécution)
- Inutile : ∅
