---
pack: T041
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T041 — Contre-vérif API : T037 + T040 (garde de prod, admin, corps, logs, proxy)

> Seule source de vérité de l'agent T041. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter A1-A9 sur les correctifs API T037 (commit `745bc54`) et T040 (commit `2cda47a`) dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, par test jetable et lecture ; rendre OK ou DÉFAUTS avec repro, sans corriger.

## Definition of Done
- [ ] A1-A9 chacun OK/KO avec preuve
- [ ] `api/test/zz-verif-t041.test.ts` créé, exécuté, supprimé ; `git -C G status --short` → ∅ en fin
- [ ] `npm --prefix api test` + `npm --prefix api run typecheck` relancés, sortie collée
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution ; écriture : result.md + test jetable.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | posInt, proxyList, productionProblems :257-294 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | L | loadProductionSafeConfig |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scripts/create-platform-admin.ts` | L | createPlatformAdmin, main |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/bodyField.ts` | L | bodyStr |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | L | redactUrl |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg : bodyStr · :2136 query.search · :2292 fields.orgId · app.decorate('db') :177 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/hardening-t037.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/prod-guard.test.ts` | L | cas couverts, accès db de test |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | format, placeholders |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t041.test.ts` | E | jetable |

## Contrats
```ts
// config.ts : productionProblems(env, cfg): string[] — [] si env.GEOLENS_ENV !== 'production'
//   R1 secret défaut/<32/'__…__'/changer|change.?me · R2 useMemDb||!databaseUrl · R3 storage≠s3||S3_BUCKET/clés absentes ou '__…__'
//   R4 seedDemo · R5 !rateLimitEnabled · R6 !cookieSecure · R7 webOrigin !https:// · R8 TRUST_PROXY posé mais invalide
// loadProductionSafeConfig(env = process.env) : throw 'Configuration de production invalide — démarrage refusé :\n- …'
// create-platform-admin.ts : createPlatformAdmin(db, email, orgName): Promise<{ userId, orgId, orgCreated, password }>
//   normalizeEmail sinon 'email invalide' ; org 1..120 ; email pris → 'email déjà utilisé' 0 écriture ; mdp randomBytes(18) base64url ; role org_admin, is_platform_admin true
// bodyField.ts : bodyStr(v: unknown): string — typeof v === 'string' ? v : ''
// logRedact.ts : redactUrl par clé décodée (decodeURIComponent, + → espace), insensible casse
// config.ts : posInt(v, def, max) ; TTL ≤ 604800, fenêtre ≤ 86400 ; proxyList v6 recouvrant ::ffff:0:0/96 exige ≥ /104
```
Affirmations à réfuter :
- A1 GEOLENS_ENV=production + `.env.production.example` parsé tel quel → refus (≥ R1, R3) ; même env avec vraies valeurs (secret 64 hex, DATABASE_URL, clés S3 non factices, https) → [] ; `GEOLENS_ENV=Production` / `' production'` → comportement constaté (garde contournée = défaut M)
- A2 R1 : secret 32 car. tous identiques (`aaaa…`) accepté → constat ; `JWT_SECRET='   '` → défaut appliqué donc refus
- A3 createPlatformAdmin : 2 appels concurrents même email → 1 succès, 1 rejet, 0 doublon ; org au nom avec espaces de tête/queue → réutilise l'org trimée ; mdp rendu → login 200 ; user non platform → aucun effet de bord
- A4 index.ts : démarrage avec env invalide → exit≠0 avant tout listen (`GEOLENS_ENV=production npx --prefix api tsx api/src/index.ts` env minimal → message + exit 1, port 4000 jamais ouvert)
- A5 bodyStr : tous les `req.body?.` de server.ts typés string passent par bodyStr (`rg -n "req\.body\?\.[a-zA-Z]+ \?\? ''" api/src/server.ts` → liste résiduelle) ; :2136 `?search[a]=1` → code ; :2292 fields.orgId type
- A6 redactUrl : `?token=a&token=b`, `?t%6Fken=a`, `?token` sans =, `;token=`, `?%74oken%3Da` → masqué ou constat
- A7 proxyList : `::ffff:0:0/104` (= v4 0.0.0.0/8) accepté → constat ; `::ffff:127.0.0.0/104` ; `64:ff9b::/96` (NAT64) → constat
- A8 posInt : `'86400.9'`, `'0x3c'`, `' 3600 '` → valeur constatée, jamais NaN/Infinity
- A9 suite api ≥ 667 verte, typecheck 0

## Décisions actées
- garde activée par GEOLENS_ENV=production — decisions.md D12
- trustProxy fail-closed — D10 ; PT-5 409 générique — D7

## Hors périmètre
- corriger, éditer src/ ou un test existant ; npm install
- web/, worker/, e2e/, infra (T042)
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; G HEAD `2cda47a`, arbre propre ; suite 75 fichiers 667 tests
- suite complète : `npm --prefix api test -- --exclude 'test/zz-verif-*'` ; jetable : `npx --prefix api vitest run --root api test/zz-verif-t041.test.ts`
- 1 autre vérificateur (T042) en parallèle : docker uniquement, port hôte 4100 ; toi : ne lance rien sur 4000/4100 sauf A4 (refus avant listen)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t041.test.ts), Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, npx --prefix api tsx, rg, ss, rm du seul zz-verif-t041.test.ts, git -C G show, git -C G status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T041
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A<n> OK | KO — preuve ≤ 12 mots
## Défauts
- D<n> · chemin:L — symptôme — repro — correctif ≤ 15 mots | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
