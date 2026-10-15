---
pack: T018
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T018 — Vérif T007 : sessions révocables et org suspendue

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter la révocation de session livrée par T007 : trouver une route, un ordre d'appels ou un état (user/org) où une session qui devrait être refusée passe encore, ou une session légitime refusée ; `OK` ou `DÉFAUTS` avec test de repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A1-A8 : chacune OK/KO avec commande + sortie ou coordonnée lue
- [ ] `rg -n "jwtVerify|password_hash\s*=|UPDATE users SET" api/src` : chaque hit classé (passe par validateSession / setPasswordAndRevoke ou non) — liste
- [ ] `rg -n "requireAuth|requireAdmin|requirePlatformAdmin" api/src/server.ts | wc -l` + routes `/api/` SANS preHandler d'auth listées (hors publiques attendues : login, health, forgot/reset, accept-invite, contact, tuiles signées)
- [ ] ≥ 4 contre-exemples en test jetable `api/test/zz-verif-t018.test.ts` (copie du style de session-revocation.test.ts), lancés puis SUPPRIMÉS ; sortie collée : ex. 2 change-password concurrents · rétrogradation puis action admin · user déplacé d'org · jeton tuile d'un user désactivé · JWT forgé sv=999
- [ ] `npx --prefix api vitest run --root api test/session-revocation.test.ts test/session-unit.test.ts test/org-suspension.test.ts test/admin-console.test.ts test/accounts.test.ts test/auth-and-tiles.test.ts test/password-reset.test.ts` → sortie collée
- [ ] `git -C G status --short api/test` final : 0 fichier zz-verif restant
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + gravité
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution) ; écriture : `result.md` + `api/test/zz-verif-t018.test.ts` temporaire.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | livré T007 (63 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | requireAuth :80-92 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :270-340, :370-380, :450-490, :1440-1470 + rg |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | :60-90 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | UserRow, toSessionUser |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject :87 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-revocation.test.ts` | L | modèle + cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/org-suspension.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t018.test.ts` | E | jetable, supprimé à la fin |

## Contrats
```ts
// session.ts (T007)
export async function validateSession(db: Db, claims: SessionClaims): Promise<AccessCheck>; // resolveActiveUser(db, claims.userId, claims.sv ?? 0)
export function checkUserAccess(state: UserAccessState | null, expectedSv?: number): AccessCheck;
//   ordre : null→user_missing · disabled→user_disabled · status 'pending'→user_pending · org 'suspended'→org_suspended · sv≠→session_revoked
export async function setPasswordAndRevoke(db: Db, userId: string, passwordHash: string, opts?: { activate?: boolean }): Promise<number>;
export async function signSession(reply: FastifyReply, row: UserRow): Promise<string>; // jwtSign({...toSessionUser(row), sv}, 7d)
// requireAuth : jwtVerify → validateSession → !ok : clearSessionCookie + 401 ; ok : request.sessionUser = check.user (ligne DB)
// test helpers : makeTestApp(extraEnv?) · login(app,email,password) → cookie · DEMO.{adminEmail,adminPassword,memberEmail,memberPassword,rivalEmail,rivalPassword} (src/seed.js)
```
Affirmations à réfuter :
- A1 toute route protégée relit l'utilisateur (requireAuth) → désactivé / pending / org suspendue / sv périmé ⇒ 401
- A2 requireAdmin/requirePlatformAdmin s'appuient sur sessionUser issu de la DB (rôle rétrogradé ⇒ 403 immédiat)
- A3 les 4 sites d'écriture de mdp (server.ts:375, :455, :483, :1455) passent par setPasswordAndRevoke ; 0 autre `UPDATE users SET password_hash`
- A4 change-password réémet un cookie valide pour l'appelant ; ses autres sessions ⇒ 401
- A5 JWT pré-A2 (sans sv) valide tant que session_version = 0, refusé après bump
- A6 /api/auth/me : session refusée ⇒ 401 + cookie effacé ; sans cookie ⇒ { user: null } (inchangé)
- A7 jeton tuile : user désactivé ou org suspendue ⇒ 403 ; org réactivée ⇒ même URL 200 ; projet partagé (project_orgs) à une org active ⇒ 200
- A8 migrate() idempotent (2 appels, 0 throw) ; nouvel user session_version = 0
Restes acceptés (pas défauts) : PATCH rôle/disabled sans bump (effet via lecture DB) ; jeton tuile non lié à sv (lot futur).

## Décisions actées
- révocation par session_version + sv, égalité stricte, 0 cache — decisions.md D6
- tenancy.ts inchangé — projets partagés conservés aux orgs actives

## Hors périmètre
- corriger, éditer un fichier de src/ ou un test existant
- fenêtre de jeton tuile, logger, config.ts (T014 en cours sur server.ts:160 et :497-512 — ignorer ces plages)
- web/, worker/, e2e/
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; base 67 fichiers / 592 tests verts après T007
- T014 modifie server.ts/config.ts EN PARALLÈLE → ne lancer que la liste ciblée de tests ci-dessus ; un échec de typecheck/test sur tileExp/logRedact/config = T014, à citer sans le compter
- G sous git, baseline 745d46f : `git -C G diff -- api/src/auth.ts api/src/repo.ts api/src/schema.ts` ; session.ts non suivi

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t018.test.ts), Bash(npx vitest, rg, rm du seul zz-verif-t018.test.ts, git diff, git status, git show)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T018
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A8 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro (cas de test verbatim) · attendu / obtenu · gravité
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
