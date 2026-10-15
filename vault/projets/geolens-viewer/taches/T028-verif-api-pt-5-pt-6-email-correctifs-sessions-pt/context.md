---
pack: T028
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T028 — Vérif API : PT-5/PT-6/email, correctifs sessions, PT-1 trustProxy (T019 T020 T024 T029)

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter les livrables API T019 (politique mdp, email borné, PT-5 générique + 10/h), T020 (auto-suspension refusée, bump atomique) et T024 (fastify ≥ 5.12.5, nodemailer ≥ 9.1.1, trustProxy) ; `OK` ou `DÉFAUTS` avec test de repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A1-A10 : chacune OK/KO avec commande + sortie
- [ ] ≥ 5 contre-exemples en test jetable `api/test/zz-verif-t028.test.ts` (style input-policy.test.ts), lancés puis SUPPRIMÉS : email `A@B.FR` vs `a@b.fr` en doublon (même 409 ?) · email unicode `é@x.fr` · mdp 256 car multi-octets · XFF `1.1.1.1, 10.0.0.9` avec TRUST_PROXY=uniquelocal (quelle IP compte ?) · TRUST_PROXY=`0.0.0.0/0` (accepté ? risque) · XFF spoofé sans TRUST_PROXY · 11ᵉ invitation dans l'heure → 429 · PATCH org self → `active` (doit rester permis)
- [ ] `npm --prefix api test` + `npm --prefix api run typecheck` + `npm --prefix api audit --omit=dev` → sorties collées
- [ ] `git -C G status --short api/test` final : 0 fichier zz-verif restant
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + gravité
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution) ; écriture : `result.md` + `api/test/zz-verif-t028.test.ts` temporaire.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/passwordPolicy.ts` | L | T019 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/emailSchema.ts` | L | T019 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | T020 setPasswordAndRevoke |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | trustProxy, hops |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg ciblé : Fastify( · change-password · forgot · reset · accept-invite · /api/contact · /api/admin/users · /api/admin/invitations · PATCH organizations |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/input-policy.test.ts` | L | cas couverts + modèle |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/session-fixes.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv), login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t028.test.ts` | E | jetable, supprimé à la fin |

## Contrats
```ts
// passwordPolicy.ts : PASSWORD_MIN = 8 ; PASSWORD_MAX = 256 ; passwordProblem(pw: unknown): string | null
// emailSchema.ts : EMAIL_MAX = 254 ; normalizeEmail(v: unknown): string | null  // trim + lowercase ; /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/
//   EMAIL_UNAVAILABLE = { error: 'email_unavailable', message: 'Cette adresse ne peut pas être utilisée.' }
// session.ts : setPasswordAndRevoke(db, userId, hash, { activate?, expectedSv? }) → UPDATE … AND session_version = $sv RETURNING ; conflit → throw 'session_conflict'
// change-password : 409 { error: 'session_conflict' } ; PATCH /api/admin/organizations/:id {status:'suspended'} sur sa propre org → 400 { error: 'self_suspend' }
// config.ts : trustProxy: proxyList(env.TRUST_PROXY) : string[] | false (IP/CIDR/loopback/linklocal/uniquelocal ; invalide → false) ; server.ts : Fastify({ logger, trustProxy: config.trustProxy }) (T029)
// rate-limit : global 300/min si RATE_LIMIT=1 ; login 10/min ; /api/admin/users et /api/admin/invitations 10/h ; clé = req.ip
```
Affirmations à réfuter :
- A1 min 8 / max 256 appliqués sur les 4 sites (change, reset, accept-invite, création admin) ; `rg -n "length < [68]" api/src/server.ts` → ∅
- A2 email normalisé/borné sur création admin, invitations, forgot (invalide = même réponse que inconnu), contact replyTo (repli u.email)
- A3 PT-5 : 409 corps identique email même org / autre org / course 23505 ; `rg "existe déjà" api/src` → ∅
- A4 PT-5 : 10/h sur les 2 routes quand RATE_LIMIT=1
- A5 self-suspend → 400 ; self → active permis ; autre org suspend/réactive → 200
- A6 2 change-password concurrents → {200, 409}, cookie du 200 valide
- A7 fastify ≥ 5.12.5, nodemailer ≥ 9.1.1 installés (`node -p require(...).version`) ; package.json cohérent ; audit : nombre de high restant listé
- A8 TRUST_PROXY=uniquelocal, pair 10.0.0.2 : clients distincts par XFF ⇒ compteurs distincts ; même XFF ⇒ 429 au 11ᵉ login ; pair public ⇒ XFF ignoré
- A9 TRUST_PROXY absent : XFF ignoré ⇒ 429 malgré XFF différents (anti-spoof)
- A10 suite api verte (≥ 617 + T024), typecheck 0

## Décisions actées
- PT-5 : 409 générique + 10/h, pas de faux succès — decisions.md D7
- commande npm unique fastify/nodemailer — D8 ; nodemailer 10.x HP
- trustProxy par réseau de confiance, défaut false — decisions.md D10 ; clé rate-limit = req.ip

## Hors périmètre
- corriger, éditer src/ ou un test existant ; npm install/audit fix
- web/, worker/, e2e/, Caddyfile
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules (fastify monté par T024) ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- inject : `app.inject({ remoteAddress: '10.0.0.2', headers: { 'x-forwarded-for': '…' } })`
- G sous git : HEAD = commit local T024+T029 (voir `git -C G log -3`) (`git -C G diff -- api .env.production.example`)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t028.test.ts), Bash(npx vitest, npm --prefix api test, npm --prefix api run typecheck, npm --prefix api audit --omit=dev, node -p, rg, rm du seul zz-verif-t028.test.ts, git diff, git status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T028
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A10 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro (cas verbatim) · attendu / obtenu · gravité
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
