---
pack: T065
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T065 — Tuiles L2 : tileAuth.ts (1 SELECT) + test de parité

> Seule source de vérité de l'agent T065. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer `api/src/tileAuth.ts` : la décision d'accès d'une tuile en UNE requête SQL, strictement équivalente à `resolveSignedProject` (2 SELECT aujourd'hui), prouvée par un test de parité en produit croisé utilisateurs × projets ; 0 ligne de server.ts. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/tileAuth.ts` NEUF = contrat verbatim
- [ ] `api/test/tile-auth-parity.test.ts` NEUF : produit croisé, tous les cas listés, + espion `db.query` = 1 appel par resolveTileGrant
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npx --prefix api vitest run --root api test/tile-auth-parity.test.ts` vert — sorties collées
- [ ] `git -C G status --short api` collé : 2 fichiers neufs (+ fichiers d'autres agents)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-auth-parity.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | checkUserAccess, loadUserAccessState |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject :87-121 (règles de référence) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | resolveSignedProject ~:270-280 (référence de parité, NE PAS modifier) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | UserRow, toSessionUser, getUserById |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | PK users, projects, project_orgs, project_access |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp |

## Contrats
```ts
// ═══ api/src/tileAuth.ts (NEUF) — imports : type Db (./db.js) ; checkUserAccess (./session.js) ; type UserRow (./repo.js)
export interface TileGrant { projectId: string; storagePrefix: string }
export const TILE_GRANT_SQL = `
SELECT u.*, uo.status AS org_status,
       p.id AS tg_project_id, p.storage_prefix AS tg_storage_prefix,
       COALESCE(u.is_platform_admin, false)
       OR ((p.org_id = u.org_id OR pog.project_id IS NOT NULL)
           AND (u.role = 'org_admin' OR pa.user_id IS NOT NULL)) AS tg_allowed
  FROM users u
  LEFT JOIN organizations uo ON uo.id = u.org_id
  LEFT JOIN projects p ON p.id = $2
  LEFT JOIN project_orgs pog ON pog.project_id = p.id AND pog.org_id = u.org_id
  LEFT JOIN project_access pa ON pa.project_id = p.id AND pa.user_id = u.id
 WHERE u.id = $1`;   // ≤ 1 ligne (PK users, projects, project_orgs(project_id,org_id), project_access(user_id,project_id))
export async function resolveTileGrant(db: Db, userId: string, projectId: string): Promise<TileGrant | null>;
//   row = (await db.query(TILE_GRANT_SQL, [userId, projectId])).rows[0] ; { org_status, tg_project_id, tg_storage_prefix, tg_allowed, ...userRow } = row ?? {}
//   !checkUserAccess(row ? { row: userRow as UserRow, orgStatus: org_status ?? null } : null).ok → null   (sans expectedSv : jeton tuile)
//   tg_project_id == null || tg_allowed !== true → null ; sinon { projectId: tg_project_id, storagePrefix: tg_storage_prefix }
// RÉFÉRENCE (server.ts ~:270-280) : resolveSignedProject(payload {u,p}) = resolveActiveUser(db, u) puis getAccessibleProject(db, c.user, p) → ProjectRow | null
// si la règle de getAccessibleProject (tenancy.ts:87-121) diffère de TILE_GRANT_SQL sur un cas : le test de parité DOIT le révéler ; adapter le SQL pour suivre tenancy.ts (la référence fait foi), le noter dans Écarts
// pg-mem : COALESCE/LEFT JOIN supportés ; si un booléen calculé revient en string, normaliser (=== true || === 't')
```
Cas de parité (`resolveTileGrant(db,u,p)?.storagePrefix ?? null` === `resolveSignedProject({u,p})?.storage_prefix ?? null` pour chaque couple) — fixtures SQL : 2 orgs A, B ; projets PA (org A), PB (org B), PS (org B partagé à A via project_orgs), PO (org_id NULL, orphelin) ; utilisateurs :
- membre A avec project_access PA · membre A sans accès · membre A avec project_access PB (autre org, non partagé) · membre A avec project_access PS (partagé)
- org_admin A (propre org, autre org, partagé) · admin plateforme (cross-org, orphelin)
- membre désactivé · membre pending · membre d'une org suspendue · user absent · projet absent · user avec org_id NULL (si le schéma l'autorise ; sinon le noter)
- + espion db.query : 1 seul appel par resolveTileGrant

## Décisions actées
- D20 : 1 SELECT, 0 cache (D6), parité testée = garde ; toute règle d'accès future touche tenancy.ts ET TILE_GRANT_SQL
- resolveSignedProject reste utilisé ailleurs (vignettes, objets importés) : inchangé

## Hors périmètre
- server.ts (lot L4), storage.ts/config.ts (T064 en parallèle), tenancy.ts/session.ts (lecture seule)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; resolveSignedProject est interne à server.ts → l'atteindre via la route tuile n'est PAS requis : reconstituer la référence dans le test = `resolveActiveUser` (session.ts) puis `getAccessibleProject` (tenancy.ts), mêmes fonctions que server.ts:270-280
- G sous git, HEAD 120d0aa ; T064 écrit storage.ts/config.ts/logRedact.ts + fichiers neufs en parallèle ; `npm --prefix api test` complet non exigé

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Bash(npm --prefix api run typecheck, npx vitest, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T065
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
