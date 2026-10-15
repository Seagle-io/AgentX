---
pack: T054
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T054 — D15-E : module erasure.ts (effacement complet en 1 transaction)

> Seule source de vérité de l'agent T054. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer le module NEUF `api/src/erasure.ts` qui efface complètement un utilisateur en une transaction (jetons, accès, couches privées, réattribution des couches publiées, détachement sidecars/rapports, pseudonymisation de son audit, retrait de son email de l'audit d'autrui, suppression du compte), avec ses tests unitaires ; AUCUNE route (câblage dans un lot suivant), 0 ligne de server.ts. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/erasure.ts` NEUF = contrat verbatim
- [ ] `api/test/erasure-unit.test.ts` NEUF : 6 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npx --prefix api vitest run --root api test/erasure-unit.test.ts` vert — sorties collées
- [ ] `git -C G status --short api` collé : 2 fichiers neufs (+ fichiers d'autres agents)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/erasure-unit.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | Db, transaction :21, :34, :73 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | getUserById, UserRow |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | colonnes des tables citées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userLayers.ts` | L | project_layers :55-85 (DDL créé à l'activation du flag) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |

## Contrats
```ts
// ═══ api/src/erasure.ts (NEUF) — imports : type Db (./db.js) ; getUserById (./repo.js) ; tableExists (./projectTeardown.js — créé par T053 en parallèle ; s'il n'existe pas encore à la compilation : copier localement la sonde `SELECT 1 FROM project_layers LIMIT 1` tolérant 42P01, le noter dans Écarts)
export const ERASED_USER_ID = '__erased__';
export const ERASED_LABEL = '[utilisateur supprimé]';
export type EraseErrorCode = 'not_found' | 'last_platform_admin';
export class EraseError extends Error { constructor(readonly code: EraseErrorCode) }
export interface EraseCounts { authTokens: number; projectAccess: number; layersDeleted: number; layersReassigned: number; layersPublishedByCleared: number; sidecars: number; artifacts: number; auditOwn: number; auditScrubbed: number }
export async function eraseUser(db: Db, userId: string): Promise<EraseCounts>;
// pré-tx : getUserById null → throw new EraseError('not_found')
//          user.is_platform_admin ET (SELECT count(*) FROM users WHERE is_platform_admin = true) ≤ 1 → throw new EraseError('last_platform_admin')
//          hasLayers = tableExists(db, 'project_layers')  HORS tx
// db.transaction(tx => …) ordre STRICT, counts = rowCount :
//  1 DELETE FROM auth_tokens WHERE user_id = $1
//  2 DELETE FROM project_access WHERE user_id = $1
//  3 si hasLayers : DELETE FROM project_layers WHERE owner_user_id = $1 AND visibility = 'private'                   → layersDeleted
//                  UPDATE project_layers SET owner_user_id = $2 WHERE owner_user_id = $1 AND visibility = 'published'   ($2 = ERASED_USER_ID) → layersReassigned
//                  UPDATE project_layers SET published_by = NULL WHERE published_by = $1                               → layersPublishedByCleared
//  4 UPDATE project_sidecars SET updated_by = NULL WHERE updated_by = $1                                               → sidecars
//  5 UPDATE report_artifacts SET created_by = NULL WHERE created_by = $1                                               → artifacts
//  6 UPDATE audit_log SET user_id = NULL, ip = NULL, user_agent = NULL, detail = NULL WHERE user_id = $1               → auditOwn
//  7 SELECT id, detail FROM audit_log WHERE detail LIKE $1   ($1 = '%' + email + '%') ; filtre JS detail.includes(email) ;
//    par ligne : UPDATE audit_log SET detail = $2 WHERE id = $1   ($2 = detail.split(email).join(ERASED_LABEL))         → auditScrubbed
//  8 DELETE FROM users WHERE id = $1
// erreur SQL → rethrow ; 0 appel audit() dans ce module ; organizations/projects/project_orgs/org_packs : ∅ référence user
// colonnes (schema.ts) : project_sidecars.updated_by TEXT (:152) ; report_artifacts.created_by TEXT sans FK (:205) ; audit_log ip/user_agent (T051)
// Db.transaction<T>(fn: (tx: Pick<Db, 'query'>) => Promise<T>): Promise<T> (db.ts:21) ; pg-mem : ROLLBACK non effectif (db.ts:74-75)
```
Cas erasure-unit.test.ts (`makeTestApp({ USER_LAYERS_ENABLED: '1' })` ou équivalent si le flag crée la table ; fixtures en SQL direct via `app.db`) :
- fixture complète pour un membre M : auth_token, project_access, couche privée + couche publiée (published_by = M), sidecar updated_by = M, rapport created_by = M, 2 lignes audit de M (ip/ua renseignés), 1 ligne audit d'un admin dont detail cite l'email de M → eraseUser(M) : users/auth_tokens/project_access/couche privée = 0 ligne pour M ; couche publiée owner '__erased__', published_by NULL ; updated_by/created_by NULL ; audit de M : user_id/ip/user_agent/detail NULL ; `SELECT count(*) FROM audit_log WHERE detail LIKE '%<email M>%'` → 0 ; detail admin contient '[utilisateur supprimé]' ; counts cohérents
- utilisateur inconnu → EraseError code 'not_found'
- seul admin plateforme (seed : DEMO.adminEmail) → EraseError 'last_platform_admin', compte intact
- table project_layers absente (flag non activé) → eraseUser OK, layers* = 0
- email contenant des caractères LIKE (`a_b%c@x.fr`) → seul ce compte scrubbé (filtre JS includes)
- 2e appel sur le même id → EraseError 'not_found'

## Décisions actées
- couche publiée conservée, propriétaire `__erased__` ; audit pseudonymisé, pas supprimé — decisions.md D17
- dernier admin plateforme jamais effaçable — évite le verrouillage
- module sans audit() : l'appelant audite (route, rétention)

## Hors périmètre
- server.ts (T053 seul écrivain) ; route DELETE user (lot câblage suivant) ; retention ; export
- modifier un test existant
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; `npm --prefix api run typecheck` (noUnusedLocals) ; ciblé `npx --prefix api vitest run --root api test/erasure-unit.test.ts`
- G sous git ; HEAD = commit local T051 (colonnes audit_log.ip/user_agent présentes) ; T053 écrit server.ts + projectTeardown.ts, T055 userExport.ts en parallèle
- `npm --prefix api test` complet : NE PAS exiger vert (T053 modifie server.ts en même temps) ; lancer seulement le test ciblé + typecheck

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Bash(npm --prefix api run typecheck, npx vitest, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T054
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
