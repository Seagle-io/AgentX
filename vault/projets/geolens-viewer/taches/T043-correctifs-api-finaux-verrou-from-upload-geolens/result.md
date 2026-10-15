---
tache: T043
statut: fait
---
## Livré
- api/src/server.ts:2811 — 6 champs bodyStr().trim() lus avant verrou
- api/src/server.ts:2822-2834 — metadata utilise les consts, req.body texte retiré
- api/src/config.ts:260-262 — GEOLENS_ENV trim + toLowerCase (= worker)
- api/src/config.ts:265-276 — R1 Set<10, R2 USER:PASSWORD/HOTE, R3 bucket __X__
- api/src/scripts/create-platform-admin.ts:28-56 — hash hors tx ; org+user en transaction ; 23505→« email déjà utilisé »
- api/test/prod-guard.test.ts:59-72,158-177 — R1×3, R2, R3, D2×3, D3×2
- api/test/hardening-t043.test.ts:1-64 — NEUF : D1 4 cas no-500 + verrou fantôme
## Vérifié comment
- KO sur HEAD (tests seuls, src intact) → `Tests  13 failed | 29 passed (42)` : D1×5 (`expected [ 202, 400 ] to include 500`, `expected 409 not to be 409`), D2×3 (`expected 0 to be greater than or equal to 1`), R1×2/R2/R3 (`expected [] to have a length of 1 but got +0`), D3 concurrent (`expected 'ERROR: insert into "users" (id, org_i…' to be 'email déjà utilisé'`)
- après : `npx --prefix api vitest run --root api test/prod-guard.test.ts test/hardening-t043.test.ts` ×5 → `Tests  42 passed (42)` ×5
- `rg -n "req\.body\?\.[a-zA-Z]+ \?\? ''" api/src/server.ts` → ∅ (exit 1)
- `git -C G diff --stat -- api/src/server.ts` → `1 file changed, 6 insertions(+), 6 deletions(-)`
- `npm --prefix api run typecheck` → exit=0
- `npm --prefix api test` → `Test Files  76 passed (76)` · `Tests  682 passed (682)`
## Écarts
- lecture hors WL: G/.env.production.example (rg 7 lignes) — valeurs d'exemple R2/R3, non bloquant, évitable
- server.ts:2811 — 6 lectures sur 1 ligne (~230 car.) — sinon insertions > suppressions
- config.ts:268 — `?? ''` du contrat retiré : databaseUrl déjà narrowé string
- config.ts messages R1/R2/R3 élargis (« trop peu varié », « / d'exemple ») — aucun test ne fige le texte
- D3 : pré-contrôle SELECT users conservé ; hashPassword sorti de la tx (tx plus courte)
## Pour la suite
- D3 pg-mem : le test concurrent passe car la 1ʳᵉ tx finit (microtâches) avant la fin du hash de la 2ᵉ ; ROLLBACK pg-mem inopérant (db.ts:72) → l'annulation d'org n'est prouvée qu'en Postgres réel (NV)
- D1 : `crs` numérique (`2154`) était accepté via toString → désormais ignoré (null) ; vérifier que web/ envoie une chaîne
- D3 HP constaté : 2 emails ≠ + même org neuve concurrents → 2 orgs homonymes (pas d'unicité de nom, migration requise)
- test D1 verrou : branche 2e appel seulement si le 1er renvoie 400 ; après correctif le 1er renvoie 202 → garde de non-régression, pas d'exercice actif
## Retour sur le pack
- Manquait: valeur de .env.production.example (DATABASE_URL/S3_BUCKET) pour le test R2/R3 ; comportement pg-mem ROLLBACK vs exigence « 1 org » en concurrence
- Inutile: bodyField.ts en L (contrat déjà recopié)
