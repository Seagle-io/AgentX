---
tache: T028
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 — OK (4 sites passwordProblem ; rg ∅) ; voir D5
- A2 — KO : objet `email` → 500 (D2)
- A3 — KO : course invitations → 500 (D1)
- A4 — OK : users + invitations 11ᵉ → 429
- A5 — OK : self suspend 400, self active 200
- A6 — OK : {200,409} stable 5/5 runs
- A7 — OK : 5.12.5 / 9.1.1 ; 4 high restants
- A8 — OK : XFF par client ; pair public ignoré
- A9 — OK pour rate-limit ; KO audit accept-invite (D3)
- A10 — OK : 622/622, tsc rc=0
## Défauts
- D1 · api/src/server.ts:1559 · `Promise.all` 2× POST /api/admin/invitations `{email:'race-inv@x.fr'}` · attendu 201+409 EMAIL_UNAVAILABLE / obtenu `201 | 500 server_error` (INSERT hors try, ≠ /api/admin/users:1401) · moyenne
- D2 · api/src/emailSchema.ts:11 · POST /api/auth/forgot-password `{email:{toString:1}}` · attendu 200 uniforme / obtenu `500 server_error` (String(v) throw) ; même chemin contact, admin users, invitations · basse
- D3 · api/src/server.ts:496-497 · accept-invite, remoteAddress 198.51.100.9, TRUST_PROXY absent, `x-forwarded-for: 6.6.6.6` · attendu ip audit 198.51.100.9 (req.ip) / obtenu `/api/admin/acceptances` → `["spoof@x.fr","6.6.6.6"]` ; preuve RGPD falsifiable, contourne PT-1 · moyenne
- D4 · api/src/config.ts:142-147 · TRUST_PROXY=`0.0.0.0/0` | `::/0` | `999.1.1.1` | `10.0.0.0/99` | `:` | `.` · attendu invalide → false (contrat) / obtenu tableau retenu → buildServer throw `invalid range on address` / `invalid IP address` (boot KO) · basse
- D5 · api/src/passwordPolicy.ts:12 · création admin mdp `'😀'.repeat(4)` · attendu 400 (« 8 caractères ») / obtenu 201 + login 200 (.length = unités UTF-16) ; `'😀'.repeat(129)` refusé · basse
- D6 · api/src/server.ts:463-466 · forgot → token ; `Promise.all` 2× reset-password même token mdp ≠ · attendu 200+400 invalid_token / obtenu `200 | 200` (usage unique non atomique) · basse, hors A1-A10
## Vérifié comment
```
rg -n "length < [68]" api/src/server.ts → rc=1 (∅)
rg "existe déjà" api/src → 2 commentaires (scripts/scenes-create-solo.ts, schema.ts), 0 message
node -p fastify|nodemailer|@fastify/rate-limit version → 5.12.5 · 9.1.1 · 10.3.0 ; package.json ^5.12.5 ^9.1.1 ; lock idem
npm --prefix api test → Test Files 72 passed (72) · Tests 622 passed (622)
npm --prefix api run typecheck → tsc -p tsconfig.test.json rc=0
npm --prefix api audit --omit=dev → {"high":4,"total":4} : @fastify/busboy<=3.2.1 · fast-uri 3.1.2 · find-my-way 9.6.0 · nodemailer<=10.0.8 (fix --force → 10.0.15, HP D8)
npx vitest run test/zz-verif-t028.test.ts → 11 cas ; sorties [T028] :
 C1 Dup@X.FR 201 → dup@x.fr 409 EMAIL_UNAVAILABLE ; login Dup@X.FR 200, ADMIN maj 200
 C2 é@x.fr → 201 ; 'admin​@demo.geolens.fr' → 201 (clone visuel) ; 'a\u0000b@x.fr' normalisé non-null
 C3 4 emoji len 8 → null → 201/200 ; 256 'é' (512 o) → 201/200
 C4 uniquelocal, pair 10.0.0.2, XFF '1.1.1.1, 10.0.0.9' → ip 1.1.1.1 ; '1.1.1.1, 8.8.8.8' → 8.8.8.8 ; pair public → 198.51.100.9
 C5 TRUST_PROXY 0.0.0.0/0 → boot THROW ; 0.0.0.0/1,128.0.0.0/1 → boot ok, pair public XFF rotatif 12 logins → 12×401, 0×429
 C6 sans TRUST_PROXY XFF rotatif → 401×10,429 ; accept-invite ip audit 6.6.6.6
 C7 invitations → 201×10,429
 C8 self active 200 ; self suspended 400 self_suspend ; /api/projects 200
 C9 invitations 201|500 ; users 201|409 ; mix users+invit 409|201
 C10 forgot 'x@y'|inconnu|MEMBRE maj|300 car|['a@b.fr'] → 200 identiques ; {toString:1} → 500
 C11 reset concurrents même token → 200|200
npx vitest run session-fixes input-policy rate-limit-proxy ×5 → 16 passed (16) ×5
rm api/test/zz-verif-t028.test.ts ; git -C G status --short api/test → (vide) ; git status --short → (vide)
```
## Écarts
- ∅
## Pour la suite
- D1 : envelopper INSERT server.ts:1559 + isUniqueViolation → 409 EMAIL_UNAVAILABLE ; test course invitations
- D2+D4 : normalizeEmail typeof v === 'string' sinon null ; proxyList valider via proxy-addr compile (try → false) ou regex bornée /1-32|128
- D3 : clientIp = req.ip (trustProxy fait foi), supprimer lecture XFF brute
- HP : NUL `\u0000` accepté par normalizeEmail → Postgres TEXT rejette → 500 probable (NV, pg-mem tolère) ; ZWSP/homoglyphes acceptés
- HP : TRUST_PROXY=`0.0.0.0/1,128.0.0.0/1` accepté = trust-all, rate-limit contournable ; find-my-way 9.6.0 high (HTTP2) restant
## Retour sur le pack
- Manquait: route GET /api/admin/acceptances (lecture IP audit) ; signature Mailer.send(to,subject,html,text) pour capter token
- Inutile: ∅
