---
pack: T053
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T053 — D15-T : extraction projectTeardown.ts (route DELETE projet)

> Seule source de vérité de l'agent T053. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Extraire VERBATIM la logique de suppression d'un projet de la route `DELETE /api/admin/projects/:id` (server.ts ~:2925-3003) et les helpers `isMissingRelation`/`tableExists` (server.ts :90-110) vers un module NEUF `api/src/projectTeardown.ts`, réutilisable par la purge de rétention ; comportement de la route strictement inchangé. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/projectTeardown.ts` NEUF = contrat (isMissingRelation, tableExists exportés + teardownProject)
- [ ] server.ts :90-110 : les 2 fonctions SUPPRIMÉES, importées depuis ./projectTeardown.js ; tous leurs appelants restants (rg) compilent
- [ ] route DELETE projet : appel `teardownProject` ; statuts, corps de réponse, `audit(... 'delete_project', ...)` et `guardNote` identiques octet pour octet
- [ ] `api/test/project-teardown.test.ts` NEUF : 3 cas listés, verts
- [ ] non-rég : `npx --prefix api vitest run --root api test/delete.test.ts test/delete-user-layers.test.ts test/scenes-shared-prefix.test.ts` verts, inchangés
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts — sorties collées
- [ ] `git -C G diff --stat -- api/src/server.ts` + `git -C G status --short api` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/projectTeardown.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | imports en tête ; :88-112 (retrait) ; route DELETE projet (ancre `'/api/admin/projects/:id',` suivie de `app.delete`) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/project-teardown.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scenes.ts` | L | isPrefixShared :46 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | StorageDriver :115-135 (deletePrefix) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/delete.test.ts` | L | modèle (création projet uploadé, stockage local) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/scenes-shared-prefix.test.ts` | L | modèle préfixe partagé |

## Contrats
```ts
// ═══ api/src/projectTeardown.ts (NEUF) — imports : type Db (./db.js) ; type StorageDriver (./storage.js) ; isPrefixShared (./scenes.js) ; type FastifyBaseLogger (fastify)
export function isMissingRelation(e: unknown, table: string): boolean;          // verbatim server.ts:94-98
export async function tableExists(db: Db, table: string): Promise<boolean>;     // verbatim server.ts:102-110 (sonde HORS transaction)
export interface ProjectRef { id: string; org_id: string | null; storage_prefix: string }
export interface TeardownResult { filesDeleted: boolean; storageKept: boolean; importedKept: boolean }
export async function teardownProject(db: Db, storage: StorageDriver, log: Pick<FastifyBaseLogger, 'warn' | 'error'>, proj: ProjectRef): Promise<TeardownResult>;
//   = route ACTUELLE, dans cet ordre :
//   importedPrefix = `uploads/${proj.org_id}/${proj.id}` ; sharedMain = isPrefixShared(db, proj.id, proj.storage_prefix) ; sharedImported = isPrefixShared(db, proj.id, importedPrefix)
//   hasProjectLayers = tableExists(db, 'project_layers')   (HORS transaction ; throw → remonte)
//   db.transaction : DELETE project_access · project_orgs · project_sidecars · report_artifacts · (si hasProjectLayers) project_layers · projects   (WHERE project_id/id = $1, ordre inchangé ; throw → remonte, 0 fichier touché)
//   fichiers HORS tx, best-effort : si /^uploads\// : sharedMain → log.warn(<message actuel>) sinon deletePrefix(storage_prefix) → filesDeleted ; (échec → log.warn)
//   importés : sharedImported → log.warn(<message actuel>) sinon deletePrefix(importedPrefix) (échec → log.warn)
//   return { filesDeleted, storageKept: sharedMain, importedKept: sharedImported }
//   messages log.warn : recopier ceux de la route (préfixe `delete_project ${proj.id} : …`)

// ═══ route — CIBLE (ce qui reste dans server.ts)
//   SELECT proj (inchangé, platform vs org) ; 404 inchangé
//   let res: TeardownResult ;
//   try { res = await teardownProject(db, app.storage, app.log, proj); } catch (e) { app.log.error(e); return reply.code(500).send({ error: 'delete_failed', message: 'Échec de la suppression du projet.' }); }
//   guardNote = res.storageKept ? ', stockage conservé (préfixe partagé) — reprise manuelle nécessaire (scenes:orphans)' : (res.filesDeleted ? ', fichiers supprimés' : '')
//   await audit(db, admin, 'delete_project', `${proj.id} (${proj.storage_prefix}${guardNote})`) ; return { ok: true, filesDeleted: res.filesDeleted }
// existant : import { isPrefixShared } from './scenes.js' (server.ts:54) — garder si encore utilisé ailleurs (server.ts ~:3045)
```
Cas project-teardown.test.ts (stockage local, `makeTestApp` + `app.db`, `app.storage`) :
- projet uploadé (`uploads/…`) avec fichier → teardownProject → filesDeleted true, ligne projet absente, fichier absent
- 2 projets partageant un préfixe (modèle scenes-shared-prefix) → teardown de l'un → storageKept true, fichiers du préfixe présents, l'autre projet intact
- table project_layers absente (USER_LAYERS_ENABLED non activé) → teardown OK (0 throw)

## Décisions actées
- extraction verbatim, 0 changement de comportement — réutilisé par la purge de rétention (decisions.md D17)
- tableExists/isMissingRelation déplacés (pas dupliqués)

## Hors périmètre
- erasure.ts, userExport.ts (T054, T055 en parallèle : fichiers neufs, ne pas les créer) ; retention ; routes contrat/export
- toute autre route de server.ts ; modifier un test existant (si un test existant casse → BLQ avec nom + sortie)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem (ROLLBACK pg-mem non effectif, db.ts:74-75) ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals)
- G sous git ; HEAD = commit local T051 ; SEUL écrivain de server.ts ; T054/T055 créent des fichiers neufs en parallèle (api/src/erasure.ts, userExport.ts + tests)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T053
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
