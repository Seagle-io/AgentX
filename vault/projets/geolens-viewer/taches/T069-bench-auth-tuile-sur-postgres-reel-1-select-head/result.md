---
tache: T069
statut: fait
recommandation: reecrire
---
## Mesures
PG 16.14 conteneur t069-pg:5544 ; b304.mjs T068 ; N=3000 (K=1) / 6000 (K≥10) ; ordre alterné ; HEAD = G 9bcd265 ; BASE = 120d0aa ; HEAD+P = TILE_GRANT_SQL inchangé exécuté en requête préparée nommée (copie jetable)
| API | K | req/s (3 rép.) | p50 | p95 |
|---|---|---|---|---|
| HEAD | 1 | 1008 · 1040 · 1040 | 0.9–1.0 | 1.1–1.2 |
| BASE | 1 | 1137 · 1211 · 1203 | 0.8–0.9 | 1.0–1.1 |
| HEAD | 10 | 4426 · 4382 · 4361 | 2.1 | 3.4–3.5 |
| BASE | 10 | 3738 · 3684 · 3722 | 2.5–2.6 | 3.8–3.9 |
| HEAD | 50 | 4356 · 4419 · 4457 | 10.5–10.7 | 14.5–14.8 |
| BASE | 50 | 3792 · 3893 · 3755 | 12.4–12.8 | 14.8–15.5 |
| HEAD (session 4) | 1 / 10 / 50 | 1080·1103·1097 / 4237·4176·4232 / 4351·4260·4339 | 0.9 / 2.2 / 11 | 1.1 / 3.5 / 14.7 |
| HEAD+P (session 4) | 1 / 10 / 50 | 1671·1800·1793 / 4854·4925·4865 / 4925·4989·5029 | 0.5 / 2.0 / 9.3 | 0.7 / 3.2 / 13.9 |
- HEAD/BASE : K=1 −13.1 % (1029 vs 1184) → HORS critère ±10 % ; K=10 +18.2 % ; K=50 +15.7 %
- HEAD+P/HEAD même session : K=1 +60.6 % ; K=10 +15.8 % ; K=50 +15.4 % ; vs BASE (normalisé ancre HEAD) K=1 ≈ +40 %
- requêtes SQL/req 304 (pg_stat_database xact_commit, 1000 req) : HEAD +1003 · BASE +2017
- micro-bench pg direct (qbench.mjs, K=1 p50 ms) : SELECT 1 0.07 · B1 0.23 · TG 0.54 · B1+B2 0.46 · TG préparé 0.21 · V1 EXISTS 0.47 · V1 préparé 0.175
## EXPLAIN
- TG admin+villelaure · plan 0.116 ms + exec 0.118 ms · 5 Nested Loop Left Join, Index Scan users/organizations/projects_pkey, Index Only Scan project_orgs/project_access_pkey, 9 buffers hit
- TG membre sans accès · plan 0.108 + exec 0.116 ms · même plan, 0 Seq Scan
- B1 loadUserAccessState · plan 0.037 + exec 0.038 ms · Index Scan users_pkey + organizations_pkey
- B2 getAccessibleProject platformAdmin (cas admin démo) · plan 0.034 + exec 0.041 ms · Index Scan projects_pkey + organizations_pkey
- B2 member · plan 0.069 + exec 0.066 ms · Index Scan projects_pkey, Index Only Scan project_access_pkey, Seq Scan project_orgs non exécuté
- TG préparé, plan générique forcé · plan 0.004 + exec 0.116 ms · mêmes Index Scan
- V1 (EXISTS corrélés) · plan 0.087 + exec 0.077 ms · Index Scan ×3 + SubPlan Index Only Scan ; KO pg-mem : `column "p.id" does not exist` → 15/15 tests parité KO
- 1er appel/connexion : plan 2.0–2.3 ms (cache catalogue froid), tous variants
## Recommandation
- `reecrire` : garder TILE_GRANT_SQL tel quel (1 SELECT, parité pg-mem 15/15), l'exécuter en requête préparée nommée côté pg ; coût dominant = parse+plan par appel non nommé, pas l'exécution
- HEAD actuel KO critère à K=1 (−13 %) ; HEAD+P ≥ BASE à tous K (+40 % K=1, ≥ +15 % K=10/50 vs HEAD)
```ts
// Db.query(text, params, opts?: { name?: string }) — backend pg seulement ; pg-mem ignore name
pool.query({ name: 'tile_grant', text: TILE_GRANT_SQL, values: [userId, projectId] })
```
- V1 EXISTS rejeté : gain ≈ préparation seule, casse pg-mem
## Vérifié comment
- `pg_stat_database` avant/après 1000 req → `head|48479→49482` · `base|96690→98707`
- `docker exec -i t069-pg psql -d head < explain.sql` → plans ci-dessus
- parité TG vs V1 sur PG (users × 4 projets + inexistant, + project_orgs/project_access ajoutés, ROLLBACK) → `15|0|9` (n|diff|allowed)
- `vitest run test/tile-auth-parity.test.ts` copie var : V1 → `Tests 15 failed (15)` ; TG + db.ts préparé → `Tests 15 passed (15)`
- bruts : `$W/bench.txt` · `bench_var.txt` · `bench_var1b.txt` (=V1, patch prepare non appliqué) · `bench_var3.txt` (HEAD+P) ; `$W` = scratchpad/t069.9jQ6
- nettoyage : `ss -ltn | grep -cE ':(4110|4111|5544) '` → `0` ; `docker ps -a --filter name=t069-pg` → ∅ ; `git -C G status --short | wc -l` → `0`
## Écarts
- lecture hors WL: G/api/package.json scripts — mode de lancement (tsx src/index.ts)
- lecture hors WL: G/api/src/db.ts:13-31 — signature Db.query pour variante préparée
- lecture hors WL: base/api/src/server.ts grep resolveSignedProject — confirmer chemin base
- variantes lancées sur :4111 après arrêt BASE (ports 4110-4111 seuls autorisés) ; base PG `var` ajoutée ; big.b3dm 2 Mo créé dans la copie storage
## Pour la suite
- tâche implementeur : `Db.query` + option `name` (pg), TG + B1 loadUserAccessState (appelé à chaque requête auth, 0.23 ms) en préparé
- NV : prod derrière PgBouncer mode transaction ? préparés nommés exigent ≥1.21 + max_prepared_statements
- bench client et API sur même machine ; variance inter-session HEAD K=10 3877–4426 req/s (±7 %)
- jeu de données seed 3 users/4 projets : plans Index Scan déjà choisis, à reconfirmer sur volume prod
## Retour sur le pack
- Manquait: commande de lancement API (pas de script start sans build) ; Db.query (db.ts) ; big.b3dm absent du seed ; port pour 3e API variante
- Inutile: ∅
