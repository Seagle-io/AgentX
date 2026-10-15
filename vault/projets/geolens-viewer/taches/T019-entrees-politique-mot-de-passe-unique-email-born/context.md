---
pack: T019
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T019 — Entrées : politique mot de passe unique + email borné (PT-6, M4) + PT-5

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Centraliser la règle de mot de passe (8 ≤ longueur ≤ 256, partout, création admin incluse) dans `api/src/passwordPolicy.ts` NEUF et la validation d'email (≤ 254, forme stricte) dans `api/src/emailSchema.ts` NEUF, remplacer les 8 contrôles littéraux de `server.ts` par ces appels, et rendre générique + limiter en débit la réponse « email déjà pris » (PT-5) sur création user admin et invitations. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] PT-5 : 3 réponses 409 email (server.ts ~:1367, ~:1394, ~:1547) = `EMAIL_UNAVAILABLE` (contrat) ; `rg -n "existe déjà" api/src/server.ts` → ∅
- [ ] PT-5 : routes POST `/api/admin/users` (~:1356) et POST `/api/admin/invitations` (~:1530) : options `config: { rateLimit: { max: 10, timeWindow: '1 hour' } }` ajoutées à côté de `preHandler`
- [ ] `api/src/passwordPolicy.ts` NEUF = contrat verbatim
- [ ] `api/src/emailSchema.ts` NEUF = contrat verbatim
- [ ] server.ts : 4 sites mdp + 3 sites email + contact replyTo = contrat ; `rg -n "length < [68]" api/src/server.ts` → ∅ ; `rg -n "/\.\+@\.\+" api/src/server.ts` → ∅
- [ ] `api/test/input-policy.test.ts` NEUF : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix api test` → tous verts, compte collé (base ≥ 592 + T014)
- [ ] `git -C G diff --stat -- api/src/server.ts api/src/passwordPolicy.ts api/src/emailSchema.ts api/test/input-policy.test.ts` collé ; `git -C G status --short api` : 0 autre fichier api modifié par T019
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/passwordPolicy.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/emailSchema.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | 8 sites, ancres rg ci-dessous, 0 autre ligne |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/input-policy.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/admin-console.test.ts` | L | modèle invitations, captureMailer |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/accounts.test.ts` | L | modèle création user admin |

## Contrats
```ts
// ═══ api/src/passwordPolicy.ts (NEUF), pur, 0 import
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 256;   // borne argon2 (DoS hash)
export const PASSWORD_RULE_MESSAGE = 'Le mot de passe doit faire entre 8 et 256 caractères.';
/** null si valide, sinon PASSWORD_RULE_MESSAGE ; non-string → message */
export function passwordProblem(pw: unknown): string | null;

// ═══ api/src/emailSchema.ts (NEUF), pur, 0 import
export const EMAIL_MAX = 254;
/** String(v ?? '').trim().toLowerCase() ; null si vide, > EMAIL_MAX, ou ≠ /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/ */
export function normalizeEmail(v: unknown): string | null;
/** PT-5 — réponse unique « email déjà pris », quelle que soit l'org */
export const EMAIL_UNAVAILABLE = { error: 'email_unavailable', message: 'Cette adresse ne peut pas être utilisée.' } as const;

// ═══ PT-5 sites ACTUELS (server.ts)
// ~:1367  return reply.code(409).send({ error: 'conflict', message: 'Un utilisateur avec cet email existe déjà.' });
// ~:1394  if (isUniqueViolation(e)) return reply.code(409).send({ error: 'conflict', message: 'Un utilisateur avec cet email existe déjà.' });
// ~:1547  if (await getUserByEmail(db, email)) return reply.code(409).send({ error: 'conflict', message: 'Un utilisateur avec cet email existe déjà.' });
//   → reply.code(409).send(EMAIL_UNAVAILABLE)
// ~:1356  app.post<…>('/api/admin/users', { preHandler: requireAdmin }, async (req, reply) => {
// ~:1530  app.post<…>('/api/admin/invitations', { preHandler: requireAdmin }, async (req, reply) => {
//   → { preHandler: requireAdmin, config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }
// rate-limit enregistré seulement si config.rateLimitEnabled (server.ts ~:240, RATE_LIMIT=1 ; off par défaut sous pg-mem) ; modèle route : '/api/contact' config.rateLimit
// 0 test existant n'asserte le message « existe déjà » (rg vérifié chef)
```
Sites server.ts (lignes au 2026-10-07 après T007 ; T014 peut décaler → recouper par ancre) :
- mdp ① ~:367 change-password `if (newPassword.length < 8)` → `const pb = passwordProblem(newPassword); if (pb) return reply.code(400).send({ error: 'bad_request', message: pb });`
- mdp ② ~:450 reset-password `if (password.length < 8)` → idem
- mdp ③ ~:475 accept-invite `if (password.length < 8)` → idem
- mdp ④ ~:1366 création user admin `if (!email || password.length < 6)` → email via normalizeEmail (null → 400 'Email valide requis.') puis passwordProblem → 400 ; message « ≥ 6 » supprimé
- email ① ~:422 forgot-password `const email = (req.body?.email ?? '').toString().toLowerCase().trim();` → `normalizeEmail(req.body?.email)` ; null → MÊME réponse que le cas « email inconnu » actuel (anti-énumération, lire la branche existante, 0 nouveau message)
- email ② ~:1363 création user admin → normalizeEmail (cf. mdp ④)
- email ③ ~:1538-1540 invitations `if (!email || !/.+@.+\..+/.test(email))` → `normalizeEmail` ; null → 400 'Email valide requis.' (inchangé)
- contact ~:393 `const replyTo = ((req.body?.email ?? '').toString().trim() || u.email).slice(0, 160);` → `const replyTo = normalizeEmail(req.body?.email) ?? u.email;`
- login ~:289 : INCHANGÉ (vérifie contre la base, pas de règle)
Cas input-policy.test.ts (unitaires + inject, style admin-console.test.ts) :
- passwordProblem : 'abcdefg' (7) → message · 'abcdefgh' (8) → null · 'a'.repeat(256) → null · 'a'.repeat(257) → message · 12345 → message
- normalizeEmail : ' A@B.fr ' → 'a@b.fr' · 'a@b' → null · 'a'.repeat(250)+'@b.fr' → null · 'x@y.fr, z@w.fr' → null · '"x"@y.fr' → null · '' → null
- inject : POST création user admin mdp 6 car → 400 · mdp 8 car → 201 · POST /api/admin/invitations email 300 car → 400 · change-password nouveau mdp 257 car → 400
- PT-5 : admin org A crée user avec email d'un user org B → 409 body === EMAIL_UNAVAILABLE · même email org A → 409 body identique · invitation email org B → 409 identique (mailer capturé)
- PT-5 débit : `makeTestApp({ RATE_LIMIT: '1' })` → 11ᵉ POST /api/admin/users dans l'heure → 429

## Décisions actées
- min 8 partout, max 256 — PT-6 + borne argon2
- validation dans modules neufs, server.ts = appels — monolithe gelé
- forgot-password : email invalide = réponse « inconnu » — anti-énumération
- PT-5 : message générique identique + 10/h — decisions.md D7 (humain)
- PT-5 : statut 409 conservé, pas de faux succès — D7

## Hors périmètre
- keyGenerator / trustProxy du rate-limit (lot PT-1 suivant)
- tileExp, logRedact, config.ts, session.ts (T014/T007) ; rate-limit, sidecars, relais upload
- front (web/) : messages d'erreur affichés
- modifier un test existant ; si un test existant crée un user avec mdp < 8 ou email refusé → BLQ avec nom:ligne + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals actif)
- ciblé : `npx --prefix api vitest run --root api test/input-policy.test.ts`
- G sous git, baseline 745d46f ; seul agent api/ pendant cette tâche ; d'autres vérificateurs lisent api/ en lecture

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T019
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
