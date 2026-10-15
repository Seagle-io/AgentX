---
pack: T033
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T033 — Vérif T029+T030 : trustProxy, invitation concurrente, IP d'audit, entrées, jeton reset

> Seule source de vérité de l'agent T033. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter A1-A9 (correctifs API T029 + T030, défauts D1-D6 de T028) par tests jetables et lecture, sans corriger ; rendre OK ou DÉFAUTS avec repro.

## Definition of Done
- [ ] A1-A9 chacun OK/KO avec preuve (sortie de test ou `rg`)
- [ ] `api/test/zz-verif-t033.test.ts` créé, exécuté, puis supprimé (`git -C G status --short` → ∅ en fin)
- [ ] `npm --prefix api test` et `npm --prefix api run typecheck` relancés, sortie collée
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution ; écriture : `result.md` + test jetable.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | proxyList :145, trustProxy :177 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg : Fastify( :165 · clientIp :499 · claimToken :466,:494 · /api/admin/invitations · /api/admin/users |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tokens.ts` | L | claimToken :62, consumeToken :57 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/emailSchema.ts` | L | normalizeEmail :12 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/passwordPolicy.ts` | L | passwordProblem :11 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | type query / rowCount |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/final-fixes.test.ts` | L | cas T030 couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | L | cas T029 couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv), login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | TRUST_PROXY doc |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t033.test.ts` | E | jetable, supprimé à la fin |

## Contrats
```ts
// config.ts : trustProxy: proxyList(env.TRUST_PROXY) : string[] | false — IP/CIDR/loopback/linklocal/uniquelocal ; entrée invalide → false ; préfixe < /8 (v4) ou < /16 (v6) → false (fail-closed)
// server.ts:165 : Fastify({ logger: loggerOptions(...), trustProxy: config.trustProxy }) ; clé rate-limit = req.ip
// server.ts:499 : clientIp = req.ip || '?' (0 lecture XFF brute)
// tokens.ts:62 : claimToken(db, tokenId): Promise<boolean> — UPDATE atomique, false si déjà consommé ; reset-password :466 et accept-invite :494 → 400 invalid_token si false
// emailSchema.ts : normalizeEmail(v: unknown): string | null — typeof v === 'string' sinon null ; trim + lowercase ; EMAIL_MAX 254
// EMAIL_UNAVAILABLE = { error: 'email_unavailable', message: 'Cette adresse ne peut pas être utilisée.' }
// passwordPolicy.ts : PASSWORD_MIN 8, PASSWORD_MAX 256 ; passwordProblem(pw: unknown): string | null
// inject : app.inject({ remoteAddress: '10.0.0.2', headers: { 'x-forwarded-for': '…' } })
```
Défauts T028 à réfuter comme corrigés + affirmations :
- A1 D1 : 2 POST /api/admin/invitations concurrents même email → {201, 409 EMAIL_UNAVAILABLE}, jamais 500
- A2 D2 : normalizeEmail(non-string : number, objet, tableau) → null → 400, jamais 500
- A3 D3 : IP d'audit accept_invite = req.ip ; XFF forgé depuis pair public → ignoré dans audit_log.detail
- A4 D4 : TRUST_PROXY `0.0.0.0/1,128.0.0.0/1`, `::/1`, `10.0.0.0/7` → false (XFF ignoré, 429 au 11ᵉ login avec RATE_LIMIT=1)
- A5 TRUST_PROXY=uniquelocal + pair 10.0.0.2 : XFF distincts → compteurs distincts ; même XFF → 429 au 11ᵉ ; pair public → XFF ignoré
- A6 D6 : 2 reset-password concurrents même jeton → {200, 400 invalid_token} ; idem accept-invite
- A7 email avec `\u0000` → 400 ou 409, jamais 500 ; ZWSP noté (HP, constat seulement)
- A8 consumeToken : 0 appelant (`rg -n consumeToken api/src api/test`) → constat code mort
- A9 suite api ≥ 629 verte, typecheck 0

## Décisions actées
- PT-5 : 409 générique + 10/h — decisions.md D7
- trustProxy par réseau de confiance, défaut false — D10
- nodemailer 10.x, transitifs high — HP, décision humaine (D8, D10)

## Hors périmètre
- corriger, éditer src/, un test existant, un fichier de config
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean
- npm install, npm audit fix, montée de dépendance
- web/, worker/, e2e/, Caddyfile, compose

## Environnement
- G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · git local : base `745d46f`, HEAD `6e22e8c` · arbre propre (`git -C G status --short` → ∅)
- node v22.22.1 ; deps api, web, e2e installées ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- état connu : typecheck 0 · lint 0 err 1 warn (Admin.tsx:368, préexistant) · api 73 fichiers 629 tests · web 176 fichiers 1691 tests
- suite complète : `npm --prefix api test -- --exclude 'test/zz-verif-*'` (le test jetable d'un autre vérificateur peut exister) ; ton jetable : `npx --prefix api vitest run --root api test/<ton fichier>`
- 3 autres vérificateurs tournent en parallèle sur G : 0 écriture hors fichiers jetables listés ; ne jamais lancer `npm install`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t033.test.ts), Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, node -p, rm du seul zz-verif-t033.test.ts, git -C G diff 745d46f..HEAD, git -C G status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T033
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A<n> OK | KO — preuve ≤ 12 mots
## Défauts
- D<n> · chemin:L — symptôme — repro (commande ou cas) — correctif ≤ 15 mots | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
