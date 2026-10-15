---
pack: T055
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T055 — D15-X : module userExport.ts (export JSON v1)

> Seule source de vérité de l'agent T055. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer le module NEUF `api/src/userExport.ts` qui construit l'export JSON v1 des données personnelles d'un utilisateur (droit d'accès et portabilité), sans aucun secret, avec ses tests unitaires ; AUCUNE route (câblage dans un lot suivant), 0 ligne de server.ts. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/userExport.ts` NEUF = contrat verbatim (types + 2 fonctions)
- [ ] `api/test/user-export-unit.test.ts` NEUF : 6 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npx --prefix api vitest run --root api test/user-export-unit.test.ts` vert — sorties collées
- [ ] `git -C G status --short api` collé : 2 fichiers neufs (+ fichiers d'autres agents)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userExport.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/user-export-unit.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | colonnes users, organizations, project_access, audit_log, project_sidecars :147-160, report_artifacts :196-210 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userLayers.ts` | L | project_layers :55-85 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | Db.query |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |

## Contrats
```ts
// ═══ api/src/userExport.ts (NEUF) — imports : type Db (./db.js) ; tableExists (./projectTeardown.js — créé par T053 en parallèle ; absent à la compilation → sonde locale `SELECT 1 FROM project_layers LIMIT 1` tolérant 42P01, noter dans Écarts)
export interface UserExportV1 { format: 'geolens-user-export'; version: 1; exportedAt: string;
  user: { id: string; email: string; role: string; isPlatformAdmin: boolean; disabled: boolean; status: string; lastLogin: string | null; createdAt: string; organization: { id: string; name: string } | null };
  projectAccess: Array<{ projectId: string; projectName: string | null }>;
  auditLog: Array<{ id: string; action: string; detail: string | null; ip: string | null; userAgent: string | null; createdAt: string }>;   // user_id = moi seulement
  layers: Array<{ id: string; projectId: string; kind: string; scope: string; visibility: string; data: string; createdAt: string; updatedAt: string; publishedAt: string | null }>; // owner_user_id = moi ; [] si table absente
  reportArtifacts: Array<{ id: string; projectId: string; pack: string; kind: string; title: string; createdAt: string }>;   // created_by = moi
  sidecarEdits: Array<{ projectId: string; kind: string; scope: string; updatedAt: string }>;                              // updated_by = moi, SANS le json
}
// EXCLUS : password_hash, session_version, auth_tokens (token_hash), image_key, meta_json, project_sidecars.json, audit d'autrui
export async function buildUserExport(db: Db, userId: string, now?: Date): Promise<UserExportV1 | null>;  // user absent → null ; dates en toISOString() ; exportedAt = (now ?? new Date()).toISOString()
export function exportFilename(now: Date): string;  // `geolens-export-${YYYY-MM-DD}.json` (date UTC)
// noms de colonnes exacts : lire schema.ts / userLayers.ts (ex. users.last_login, created_at ; project_layers.data ? → vérifier le nom réel, l'adapter en gardant la clé JSON du contrat)
```
Cas user-export-unit.test.ts (`makeTestApp` + `app.db`, fixtures SQL) :
- membre avec accès projet, 2 entrées audit (dont 1 avec ip/ua), 1 rapport, 1 sidecar → export : format/version, user.email, organization.name, projectAccess 1, auditLog 2 avec ip, reportArtifacts 1, sidecarEdits 1 sans clé `json`
- `JSON.stringify(export)` ∌ `password_hash`, ∌ `token_hash`, ∌ `session_version`, ∌ le hash argon2 réel du user (`$argon2`)
- auditLog ne contient AUCUNE ligne d'un autre utilisateur (fixture : audit d'un admin dans la même org)
- table project_layers absente → layers = []
- userId inconnu → null
- exportFilename(new Date('2026-10-08T23:30:00Z')) → 'geolens-export-2026-10-08.json'

## Décisions actées
- JSON v1 auto-descriptif (format + version) — portabilité art. 20 (decisions.md D17)
- 0 secret, 0 donnée d'autrui dans l'export

## Hors périmètre
- route GET /api/me/export, rate-limit, en-têtes, bouton web (autres lots) ; server.ts (T053 seul écrivain)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; `npm --prefix api run typecheck` (noUnusedLocals) ; ciblé `npx --prefix api vitest run --root api test/user-export-unit.test.ts`
- G sous git ; HEAD = commit local T051 (audit_log.ip/user_agent présents) ; T053 (server.ts, projectTeardown.ts) et T054 (erasure.ts) en parallèle
- `npm --prefix api test` complet : NE PAS exiger vert pendant que T053 modifie server.ts

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Bash(npm --prefix api run typecheck, npx vitest, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T055
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
