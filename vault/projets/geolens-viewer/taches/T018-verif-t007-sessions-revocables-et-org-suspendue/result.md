---
tache: T018
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 — OK : 73 gardes, 3 routes token, 0 trou
- A2 — OK : rôle/plateforme rétrogradés ⇒ 403 immédiat
- A3 — OK : 4 sites → setPasswordAndRevoke, 0 UPDATE direct
- A4 — KO sous concurrence : cookie réémis déjà révoqué (D2)
- A5 — OK : sans sv = 0 ; sv 999/"0"/-1 ⇒ 401
- A6 — OK : révoqué 401 + effacé ; sans/poubelle ⇒ {user:null}
- A7 — OK : désactivé/pending/supprimé ⇒ 403 ; réactivé ⇒ 200
- A8 — OK pour T007 ; migrate#2 throw pg-mem préexistant (baseline idem)
## Défauts
- D1 · G/api/src/session.ts:35 + G/api/src/server.ts:1857-1866 · admin plateforme `PATCH /api/admin/organizations/<sa propre org> {status:'suspended'}` → 200 · puis `PATCH … {status:'active'}` même cookie → attendu 200 / obtenu 401 ; relogin 403 ; 1 seul admin plateforme ⇒ verrouillage irréversible hors DB · régression T007 (baseline requireAuth lisait claims → session survivait) · gravité moyenne
- D2 · G/api/src/server.ts:370-376 + G/api/src/session.ts:55-62 · même cookie, `Promise.all([change-password 'aaaaaaaa-11', change-password 'bbbbbbbb-22'])` → 200/200 · attendu : chaque cookie réémis valide / obtenu cookieA 401, cookieB 200, sv=2, login pwdA 401 (A reçoit ok mais mdp écrasé) · double-submit ⇒ déconnexion si réponse A arrive en dernier · gravité basse
## Vérifié comment
- `rg -n "jwtVerify|password_hash\s*=|UPDATE users SET" api/src` → auth.ts:87 jwtVerify→validateSession · server.ts:325 jwtVerify→validateSession:332 · session.ts:57,58 = setPasswordAndRevoke · server.ts:307 last_login · :1489 disabled · :1493 role (restes acceptés) · 0 autre
- `rg -n "password_hash|setPasswordAndRevoke" api/src` → server.ts:375,455,483,1455 (fichier 1452 : dérive T014) ; INSERT :1393 :1555 = création (sv DEFAULT 0)
- `rg -n "requireAuth|requireAdmin|requirePlatformAdmin" api/src/server.ts | wc -l` → 73 ; userLayers.ts 6 + computeProxy.ts 3 routes, toutes requireAuth
- routes /api/ sans preHandler (awk multi-ligne) → health · auth/login · auth/logout · auth/me · config · forgot-password · reset-password · accept-invite · GET projects/:id/thumbnail · projects/:id/storage/* · projects/:id/imported/:file (3 dernières = verifyTileToken→resolveSignedProject:281) → 0 inattendue
- `rg -n "sessionUser\s*=" api/src` → auth.ts:91 seul ; `req.user` 0 usage
- `git diff 745d46f -- api/src/auth.ts` → baseline `request.sessionUser = payload` (claims) → fonde D1 régression
- zz-verif-t018.test.ts (9 cas) `npx --prefix api vitest run --root api test/zz-verif-t018.test.ts` → EXIT=1, `Tests 1 failed | 8 passed (9)` :
```
[T018] C1 status 200 200 cookieA→ 401 cookieB→ 200 db sv 2
[T018] C1 login pwdA 401 pwdB 200
[T018] C2 403 403 403            (rétrogradé: PATCH user, invitation, reset admin)
[T018] C3 403                    (is_platform_admin=false en DB → PATCH org)
[T018] C4 disabled 403 thumb 403 reenabled 200 pending 403 deleted 403
[T018] C5 999 401 "0" 401 null 200 -1 401 ghost 401 noUid 401 inflated admin 403 meGhost 401
[T018] C6 suspend own 200 reactivate 401 relogin 403 platform admins 1
[T018] C7 none 200 {"user":null} junk 200 {"user":null} afterLogout 200
[T018] C8 migrate#2 🔨 Not supported 🔨 … | baseline SQL#2 CREATE TABLE IF NOT EXISTS organizations :: 🔨 Not supported 🔨 | ALTER sv#2 throw(toléré: ALTER)
[T018] C8 create 201 sv 0
[T018] C8 change-pwd revoked 401
[T018] C9 200 200 sv 2           (2 reset-password concurrents, même token)
× C1 — AssertionError: expected 401 to be 200
```
- liste ciblée 7 fichiers → `Test Files 7 passed (7)` · `Tests 71 passed (71)`
- `rm api/test/zz-verif-t018.test.ts` ; `git -C G status --short api/test` → `?? log-redact · org-suspension · session-revocation · session-unit · tile-window` ; `ls api/test | rg zz | wc -l` → 0
## Écarts
- lecture hors WL: api/src/seed.ts:25-32,100-125 — org de l'admin plateforme pour C6
- lecture hors WL: vault T007/result.md — reproduire affirmations implémenteur
- lecture hors WL: api/src/server.ts:410-495,655-690,815-840,1385-1395,1440-1530,1855-1880 · userLayers.ts/computeProxy.ts (rg) · schema.ts:212-235 — hors plages pack, routes token/admin/migrate
- C5 : sv null forgé ⇒ 200 (=0, exige secret) — non défaut
## Pour la suite
- D1 : interdire suspension de l'org de l'appelant plateforme, ou exempter isPlatformAdmin de org_suspended (session.ts:35 + login server.ts:303)
- D2 : bump atomique `UPDATE … RETURNING session_version` + garde `WHERE session_version = $sv` (409 si perdu)
- reset-password/accept-invite : token consommé APRÈS écriture (server.ts:453-456, 481-484) ⇒ 2 appels concurrents même token 200/200 ; préexistant baseline, consommer avant (`UPDATE … WHERE used_at IS NULL RETURNING`)
- logout = clearCookie seul ⇒ cookie copié reste 200 7 j ; bump sv au logout si voulu
- migrate() 2e appel throw en pg-mem (CREATE TABLE organizations) dès baseline ; A8 « 2 appels » invérifiable en pg-mem
## Retour sur le pack
- Manquait: seed.ts:25-125 (DEMO + org de l'admin plateforme) · plages server.ts 655-690/1855-1870 (thumbnail, PATCH org) · `migrate` importable depuis src/schema.js et limite pg-mem · numéros server.ts décalés par T014 (1455→1452)
- Inutile: tenancy.ts (getAccessibleProject inchangé, 0 attaque utile)
