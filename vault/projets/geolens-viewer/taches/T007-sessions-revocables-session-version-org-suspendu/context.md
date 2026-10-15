---
pack: T007
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T007 — Sessions révocables (session_version) + org suspendue (PT-2, PT-3)

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre toute session JWT révocable (changement/reset de mdp, désactivation, rétrogradation, org suspendue) via `users.session_version` + claim `sv` relus à chaque `requireAuth`, dans G/api, selon le contrat ci-dessous. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/session.ts` NEUF = contrat verbatim (6 fonctions, 4 types)
- [ ] `api/src/auth.ts` : payload `SessionUser & { sv?: number }` ; `requireAuth` remplacé intégralement (contrat)
- [ ] `api/src/repo.ts` : `UserRow` + `session_version: number`
- [ ] `api/src/schema.ts` : colonne dans CREATE users + ALTER idempotent ; 0 `;` dans les commentaires ajoutés
- [ ] `api/src/server.ts` : uniquement les 7 sites listés (rang 1) ; `wc -l` server.ts ≤ 3387 + 5
- [ ] `api/test/session-revocation.test.ts` NEUF : 9 cas A2 listés
- [ ] `api/test/session-unit.test.ts` NEUF : cas PT-3 checkUserAccess
- [ ] `api/test/org-suspension.test.ts` NEUF : 4 cas PT-3
- [ ] `npm --prefix api run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix api test` → tous verts, compte collé (base 2026-10-07 ≈ 571 verts)
- [ ] `git -C G diff --stat` collé : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | E | requireAuth :80-87, payload :39-44 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | E | UserRow :7-18, toSessionUser :30 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | E | users ~L71-81, migrate :208 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | 7 sites rang 1 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-revocation.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-unit.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/org-suspension.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/admin-console.test.ts` | L | modèle : env(), captureMailer, suspension :216-227 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/password-reset.test.ts` | L | modèle reset self, mailer capturé |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject :87 (0 modif) |

## Contrats
```ts
// ═══ api/src/session.ts (NEUF). imports : type FastifyReply ; type Db ; type SessionUser (./auth.js) ; toSessionUser, type UserRow (./repo.js). 0 import runtime de auth.ts
export interface SessionClaims extends SessionUser { sv?: number; iat?: number; exp?: number }
export interface UserAccessState { row: UserRow; orgStatus: string | null }
export type AccessDenial = 'user_missing' | 'user_disabled' | 'user_pending' | 'org_suspended' | 'session_revoked';
export type AccessCheck = { ok: true; user: SessionUser; row: UserRow } | { ok: false; reason: AccessDenial };
// SQL : SELECT u.*, o.status AS org_status FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = $1
export async function loadUserAccessState(db: Db, userId: string): Promise<UserAccessState | null>;
// PURE, ordre fixe : null→user_missing · row.disabled→user_disabled · row.status==='pending'→user_pending
//   · orgStatus==='suspended'→org_suspended · (expectedSv!==undefined && expectedSv!==row.session_version)→session_revoked
//   · sinon { ok: true, user: toSessionUser(row), row }
export function checkUserAccess(state: UserAccessState | null, expectedSv?: number): AccessCheck;
// = checkUserAccess(await loadUserAccessState(db, userId), expectedSv) ; expectedSv omis = jeton tuile
export async function resolveActiveUser(db: Db, userId: string, expectedSv?: number): Promise<AccessCheck>;
// = resolveActiveUser(db, claims.userId, claims.sv ?? 0)
export async function validateSession(db: Db, claims: SessionClaims): Promise<AccessCheck>;
// = reply.jwtSign({ ...toSessionUser(row), sv: row.session_version }, { expiresIn: '7d' }) ; n'écrit PAS le cookie
export async function signSession(reply: FastifyReply, row: UserRow): Promise<string>;
// 1 UPDATE hash+bump puis SELECT session_version FROM users WHERE id = $1 ; rowCount 0 → throw new Error('user_not_found')
//   défaut        : UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2
//   activate:true : UPDATE users SET password_hash = $1, status = 'active', session_version = session_version + 1 WHERE id = $2
export async function setPasswordAndRevoke(db: Db, userId: string, passwordHash: string, opts?: { activate?: boolean }): Promise<number>;

// ═══ auth.ts:80-87 requireAuth, remplacement intégral (requireAdmin/requirePlatformAdmin inchangés) :
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  let claims: SessionClaims;
  try { claims = await request.jwtVerify<SessionClaims>(); }
  catch { await reply.code(401).send({ error: 'unauthenticated', message: 'Session requise.' }); return; }
  const check = await validateSession(request.server.db, claims); // db décoré server.ts:171 ; erreur DB → 500
  if (!check.ok) { clearSessionCookie(reply); await reply.code(401).send({ error: 'unauthenticated', message: 'Session invalide.' }); return; }
  request.sessionUser = check.user;
}
// auth.ts:39-44 : payload: SessionUser & { sv?: number };   (user inchangé)
// existants : SESSION_COOKIE='glx_session' auth.ts:13 · setSessionCookie(reply,token,config) :66 · clearSessionCookie(reply) :75 · hashPassword(plain) :47

// ═══ schema.ts (migrate() au boot, split sur ';' :210, ALTER toléré si colonne existe)
//   CREATE users, après L71 :  session_version INTEGER NOT NULL DEFAULT 0,
//   après L81 :                ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;

// ═══ server.ts — 7 sites (lignes baseline, recouper par rg)
//   :278-282 resolveSignedProject → const c = await resolveActiveUser(db, payload.u); if (!c.ok) return null; return getAccessibleProject(db, c.user, payload.p);
//   :304     login → const token = await signSession(reply, user);
//   :322-341 /me → claims = jwtVerify<SessionClaims> (catch → { user: null } inchangé) ; c = await validateSession(db, claims) ;
//            !c.ok → clearSessionCookie + 401 'Session invalide.' ; u = c.user ; fresh = c.row ; L342+ inchangées
//   :379  change-password → const sv = await setPasswordAndRevoke(db, u.userId, await hashPassword(newPassword));
//                           setSessionCookie(reply, await signSession(reply, { ...fresh, session_version: sv }), config);
//   :458  reset self      → await setPasswordAndRevoke(db, valid.userId, await hashPassword(password), { activate: true });
//   :486  accept-invite   → idem :458
//   :1458 admin reset     → await setPasswordAndRevoke(db, target.id, await hashPassword(tempPassword));

// ═══ règle : session valide ⇔ (claims.sv ?? 0) === row.session_version ; iat NON lu ; tolérance 0
//   JWT pré-A2 sans sv → 0 = DEFAULT → valide jusqu'au 1er bump ; change-password réémet cookie (sv neuf) ; autres sites : bump, 0 cookie
// ═══ test helpers : makeTestApp(extraEnv?) → FastifyInstance · login(app,email,password) → cookie string · DEMO.{adminEmail,adminPassword,rivalEmail,rivalPassword} (src/seed.js)
```
Cas de test (recopiés T006) :
- session-revocation : change-password → cookie réémis, GET /api/projects 200, 2e session antérieure 401 · /me session antérieure → 401 + cookie effacé · admin reset membre → session membre 401, admin 200 · reset self (mailer capturé) → session antérieure 401 · accept-invite → session_version = 1 · JWT sans sv (`app.jwt.sign(SessionUser)`) → 200 si sv=0, 401 après bump · user désactivé → GET /api/projects 401 · org_admin rétrogradé member → GET /api/admin/users 403 sans re-login · change-password sans cookie → 401
- session-unit : checkUserAccess null · disabled · pending · suspended · sv≠ · ok ; disabled+suspended → user_disabled ; expectedSv undefined → sv ignoré
- org-suspension : org suspendue → GET /api/projects (session antérieure) 401 · URL tuile émise avant → 403 · réactivée → même URL 200 · user org active sur projet partagé (project_orgs) de l'org suspendue → 200
- non-rég : admin-console.test.ts:216-227 · accounts.test.ts · auth-and-tiles.test.ts · password-reset.test.ts verts

## Décisions actées
- session_version + claim sv, pas password_changed_at — iat s ≠ timestamptz µs
- DDL via migrate() au boot, 0 commande humaine — ALTER toléré
- 1 SELECT par requête, 0 cache — révocation immédiate
- requireAuth pose toSessionUser(ligne DB), pas les claims — rétrogradation immédiate
- tenancy.ts 0 modif — org suspendue garde projets partagés aux autres orgs
- logique dans session.ts, server.ts = appels — monolithe gelé

## Hors périmètre
- fenêtre jeton tuile, logger, config.ts (lot A2b, rang 2)
- rate-limit, sidecars, PT-5/PT-6, relais upload
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules installé ; pg-mem en test (USE_MEM_DB=1)
- `npm --prefix api test` (vitest run) ; `npm --prefix api run typecheck` (tsc -p tsconfig.test.json)
- G sous git : baseline commit 745d46f ; `git -C G diff --stat` pour le rendu
- shell humain fish → `bash -c` si POSIX ; d'autres agents écrivent dans web/, worker/, e2e/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T007
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
