---
pack: T020
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T020 — Correctifs sessions : auto-suspension admin plateforme, bump atomique (D1-D2 T018)

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 2 défauts trouvés par le vérificateur T018 : (D1) un admin plateforme ne peut plus suspendre sa propre organisation (sinon verrouillage irréversible), (D2) deux change-password concurrents ne déconnectent plus l'appelant — bump `session_version` conditionnel. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] D1 : PATCH `/api/admin/organizations/:id` (server.ts ~:1857) : `status === 'suspended' && req.params.id === admin.orgId` → 400 contrat, AVANT l'UPDATE
- [ ] D2 : `setPasswordAndRevoke` (session.ts:55-62) = contrat (expectedSv, UPDATE … RETURNING) ; change-password (server.ts ~:374) passe `expectedSv: fresh.session_version` et répond 409 contrat sur `session_conflict`
- [ ] `api/test/session-fixes.test.ts` NEUF : 4 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix api test` → tous verts, compte collé (base 69 fichiers / 606 tests)
- [ ] `git -C G diff --stat -- api/src/session.ts api/src/server.ts api/test/session-fixes.test.ts` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | E | :50-63 setPasswordAndRevoke |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | change-password ~:362-380 ; PATCH org ~:1853-1870 ; 0 autre ligne |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-fixes.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-revocation.test.ts` | L | modèle (cookies, change-password) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/seed.ts` | L | DEMO, org de l'admin plateforme (:95-115) |

## Contrats
```ts
// ═══ session.ts — ACTUEL
export async function setPasswordAndRevoke(db: Db, userId: string, passwordHash: string, opts?: { activate?: boolean }): Promise<number> {
  const sql = opts?.activate
    ? "UPDATE users SET password_hash = $1, status = 'active', session_version = session_version + 1 WHERE id = $2"
    : 'UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2';
  const upd = await db.query(sql, [passwordHash, userId]);
  if ((upd.rowCount ?? 0) === 0) throw new Error('user_not_found');
  const r = await db.query<{ session_version: number }>('SELECT session_version FROM users WHERE id = $1', [userId]);
  return r.rows[0].session_version;
}
// ═══ CIBLE
// opts.expectedSv défini → clause `AND session_version = $3` ; toujours `RETURNING session_version`
// 0 ligne : expectedSv défini ET user existe → throw new Error('session_conflict') ; sinon throw new Error('user_not_found')
// (existence : SELECT 1 FROM users WHERE id = $1)
export async function setPasswordAndRevoke(db: Db, userId: string, passwordHash: string, opts?: { activate?: boolean; expectedSv?: number }): Promise<number>;
// si pg-mem refuse RETURNING sur UPDATE : garder UPDATE conditionnel + rowCount + SELECT, même sémantique ; le noter dans Écarts

// ═══ server.ts change-password — ACTUEL (~:374-375)
const sv = await setPasswordAndRevoke(db, u.userId, await hashPassword(newPassword));
setSessionCookie(reply, await signSession(reply, { ...fresh, session_version: sv }), config);
// CIBLE : setPasswordAndRevoke(db, u.userId, hash, { expectedSv: fresh.session_version }) dans try/catch :
//   e.message === 'session_conflict' → return reply.code(409).send({ error: 'session_conflict', message: 'Mot de passe modifié entre-temps : reconnectez-vous.' }) ; autre erreur → rethrow
//   (fresh = await getUserById(db, u.userId) ~:370 ; UserRow.session_version: number)

// ═══ server.ts PATCH org — ACTUEL (~:1857-1869) : const admin = req.sessionUser! ; status ∈ {active, suspended} ; SELECT org ; UPDATE ; audit
// CIBLE, après la validation du statut :
//   if (status === 'suspended' && req.params.id === admin.orgId) return reply.code(400).send({ error: 'self_suspend', message: 'Impossible de suspendre votre propre organisation.' });
// SessionUser { userId, orgId, role, email, isPlatformAdmin }
```
Cas session-fixes.test.ts :
- admin plateforme PATCH sa propre org `{status:'suspended'}` → 400 `self_suspend` ; GET /api/projects avec le même cookie → 200
- admin plateforme suspend l'org rival → 200 ; réactive → 200 (non-rég)
- `Promise.all` 2 change-password concurrents, même cookie → statuts {200, 409} ; le cookie réémis par le 200 → GET /api/projects 200 ; login avec le mdp du 200 → 200
- change-password seul → 200, cookie réémis valide, sv +1 (non-rég)

## Décisions actées
- interdire l'auto-suspension plutôt qu'exempter isPlatformAdmin — 0 exception dans checkUserAccess
- conflit concurrent = 409, pas de retry serveur — client relance
- reset-password / accept-invite / admin reset : 0 expectedSv — jeton à usage unique HP

## Hors périmètre
- checkUserAccess, validateSession, requireAuth, login (inchangés)
- politique mdp / email / PT-5 (T019, suivant sur server.ts)
- logout serveur (révocation au logout), concurrence des jetons reset/invite — notés, lot futur
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals actif)
- ciblé : `npx --prefix api vitest run --root api test/session-fixes.test.ts`
- G sous git, baseline 745d46f ; seul agent api/ pendant cette tâche

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T020
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
