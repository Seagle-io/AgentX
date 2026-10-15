---
pack: T070
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T070 — Auth tuile en requête préparée nommée (Db.query name) — D22

> Seule source de vérité de l'agent T070. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter à `Db.query` une option `{ name }` qui exécute la requête en requête préparée nommée sur Postgres (pg-mem l'ignore), et l'utiliser pour `TILE_GRANT_SQL` (tileAuth.ts:36) et la requête de `loadUserAccessState` (session.ts:19-20) — les 2 requêtes exécutées à chaque tuile / requête authentifiée ; 0 changement de résultat. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] db.ts : interface + backend pg + backend pg-mem = contrat ; `tx.query` (transaction) inchangé
- [ ] tileAuth.ts:36 → `{ name: 'tile_grant' }` ; session.ts:19-20 → `{ name: 'user_access_state' }` ; 0 autre appel modifié
- [ ] `api/test/db-prepared.test.ts` NEUF : 3 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 95 fichiers / 821 tests ; tile-auth-parity inclus) — sorties collées
- [ ] `git -C G diff --stat -- api` collé : 3 fichiers + 1 test neuf
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | E | interface :13-22 ; pg :25-57 ; pg-mem :60-90 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | E | :36 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | E | :19-20 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/db-prepared.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-auth-parity.test.ts` | L | doit rester vert |

## Contrats
```ts
// ═══ db.ts — interface
export interface QueryOptions { /** Requête préparée NOMMÉE (Postgres) : parse+plan 1× par connexion. Ignoré par pg-mem. Nom ⇔ texte SQL constant. */ name?: string }
query<T = Record<string, unknown>>(text: string, params?: unknown[], opts?: QueryOptions): Promise<{ rows: T[]; rowCount: number }>;
// pg (createPgPool) : opts?.name ? pool.query({ name: opts.name, text, values: params as unknown[] }) : pool.query(text, params as unknown[])
// pg-mem (createMemPool) : signature acceptée, opts ignoré
// transaction / tx.query : INCHANGÉS (pas d'option)
// ═══ appels
// tileAuth.ts:36 : (await db.query<TileGrantRow>(TILE_GRANT_SQL, [userId, projectId], { name: 'tile_grant' })).rows[0]
// session.ts:19-20 : db.query<…>('SELECT u.*, o.status AS org_status FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = $1', [userId], { name: 'user_access_state' })
// constat T069 (Postgres 16 réel) : TG non nommé p50 0,54 ms (parse+plan à chaque appel) ; TG préparé 0,21 ms ; K=1 +60 % req/s ; parité pg-mem 15/15
// risque connu : `u.*` dans une requête préparée → si le schéma change pendant la vie du process, PG lève « cached plan must not change result type » ; migrate() s'exécute au boot AVANT toute requête → acceptable, le noter en commentaire au-dessus de l'appel
```
Cas db-prepared.test.ts :
- pg-mem : `db.query('SELECT 1 AS x', [], { name: 'n1' })` → rows [{ x: 1 }] ; même appel ×2 → OK
- backend pg simulé : stub d'un Pool (`{ query: vi.fn() }`) injecté via une fabrique testable OU test de la fonction de construction des arguments (extraire `pgQueryArgs(text, params, opts)` pure dans db.ts si nécessaire) → `{ name, text, values }` quand name, `(text, params)` sinon
- resolveTileGrant + loadUserAccessState : résultats identiques avec l'option (parité existante verte)

## Décisions actées
- D22 : requête préparée nommée pour les 2 requêtes chaudes ; TILE_GRANT_SQL inchangé
- 0 nouvelle dépendance

## Hors périmètre
- autres requêtes ; tx.query ; PgBouncer (NV, noté pour l'humain)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; `npm --prefix api test` ; typecheck (noUnusedLocals) ; module `pg` déjà dépendance
- G sous git HEAD 9bcd265, arbre propre ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T070
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
