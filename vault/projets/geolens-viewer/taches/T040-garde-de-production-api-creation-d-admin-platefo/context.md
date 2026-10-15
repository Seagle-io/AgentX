---
pack: T040
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T040 — Garde de production API + création d'admin plateforme sans SQL

> Seule source de vérité de l'agent T040. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, faire refuser le démarrage de l'API quand `GEOLENS_ENV=production` et que la config est dangereuse (T035 D1-D3, D10), et livrer un script qui crée le 1ᵉʳ admin plateforme sans SQL, avec tests.

## Definition of Done
- [ ] config.ts : `productionProblems` + `loadProductionSafeConfig` selon Contrats
- [ ] index.ts : `loadConfig()` → `loadProductionSafeConfig()` (1 ligne + import)
- [ ] `api/src/scripts/create-platform-admin.ts` NEUF ≤ 120 l ; `api/package.json` script `admin:create`
- [ ] `api/test/prod-guard.test.ts` NEUF : 1 cas par règle (problème présent / absent), env complet sain → [], GEOLENS_ENV absent → [] même config faible ; `.env.production.example` tel quel (JWT_SECRET=__CHANGER_MOI__, clés `__…__`) → ≥ 2 problèmes ; loadProductionSafeConfig lève avec la liste
- [ ] même fichier : createPlatformAdmin sur base pg-mem : crée org + user is_platform_admin=true role org_admin ; login avec le mot de passe rendu → 200 ; org existante réutilisée ; email déjà pris → rejet, 0 ligne ajoutée ; email invalide → rejet
- [ ] `npm --prefix api run build` exit 0 et `ls api/dist/scripts/create-platform-admin.js` présent ; puis `rm -r api/dist` si absent avant (`ls api/dist` au départ)
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` vert (≥ 640 + nouveaux) ; `wc -l api/src/config.ts` collé ; server.ts non modifié
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig :8-95, DEFAULT_JWT_SECRET :129, loadConfig :169 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | E | 17 l, appel loadConfig :6 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scripts/create-platform-admin.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | E | scripts :7-18 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/prod-guard.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scripts/scenes-create-solo.ts` | L | modèle argv :199-202, isMain :232, loadConfig + createDb |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | Db :13, createDb :102 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | rg DDL `CREATE TABLE.*users`, colonnes NOT NULL |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | hashPassword :48 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/emailSchema.ts` | L | normalizeEmail :12 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login, accès db de test |

## Contrats
```ts
// ═══ config.ts — AJOUTS (process.env reste lu seulement ici)
/** Règles de prod : [] si env.GEOLENS_ENV !== 'production'. 1 message FR par règle violée. */
export function productionProblems(env: NodeJS.ProcessEnv, cfg: AppConfig): string[];
//   R1 secret  : cfg.jwtSecret === DEFAULT_JWT_SECRET || cfg.jwtSecret.length < 32 || /^__.*__$/.test(cfg.jwtSecret) || /changer|change.?me/i.test(cfg.jwtSecret)
//   R2 base    : cfg.useMemDb || !cfg.databaseUrl
//   R3 stockage: cfg.storageDriver !== 's3' || !env.S3_BUCKET?.trim() || !cfg.s3.accessKeyId || !cfg.s3.secretAccessKey || [cfg.s3.accessKeyId, cfg.s3.secretAccessKey].some(v => /^__.*__$/.test(v ?? ''))
//   R4 démo    : cfg.seedDemo
//   R5 débit   : !cfg.rateLimitEnabled
//   R6 cookie  : !cfg.cookieSecure
//   R7 origine : !cfg.webOrigin.startsWith('https://')
//   R8 proxy   : (env.TRUST_PROXY ?? '').trim() !== '' && cfg.trustProxy === false
/** loadConfig(env) puis refus de démarrer si productionProblems non vide. */
export function loadProductionSafeConfig(env: NodeJS.ProcessEnv = process.env): AppConfig;
//   throw new Error('Configuration de production invalide — démarrage refusé :\n- ' + problems.join('\n- '))

// ═══ api/src/scripts/create-platform-admin.ts (NEUF)
export interface CreateAdminResult { userId: string; orgId: string; orgCreated: boolean; password: string }
export async function createPlatformAdmin(db: Db, email: string, orgName: string): Promise<CreateAdminResult>;
//   e = normalizeEmail(email) ?? throw new Error('email invalide') ; nom = orgName.trim(), 1..120 car. sinon throw
//   SELECT 1 FROM users WHERE email = $1 → présent : throw new Error('email déjà utilisé') (0 écriture)
//   org : SELECT id FROM organizations WHERE name = $1 ; absente → INSERT INTO organizations (id, name) VALUES (randomUUID(), nom)
//   password = randomBytes(18).toString('base64url') (24 car., passwordProblem(password) === null)
//   INSERT INTO users (id, org_id, email, password_hash, role, is_platform_admin) VALUES (randomUUID(), orgId, e, await hashPassword(password), 'org_admin', true)
// main si isMain : args --email <e> --org "<nom>" (sinon usage + exit 2) ; config = loadProductionSafeConfig() ; db = await createDb(config)
//   succès : console.log(`Admin plateforme créé : ${e} (organisation « ${nom} »${orgCreated ? ', créée' : ''}) — mot de passe temporaire : ${password} — à changer à la 1re connexion`) ; exit 0
//   erreur : console.error(message) ; exit 1
// en prod : docker compose -f docker-compose.scaleway.yml exec api node dist/scripts/create-platform-admin.js --email <e> --org "<nom>"
// api/package.json : "admin:create": "tsx src/scripts/create-platform-admin.ts"

// ═══ existants
// index.ts:6  const config = loadConfig();   → loadProductionSafeConfig()
// server.ts:161 garde JWT par défaut existante : CONSERVÉE, non modifiée
```

## Décisions actées
- garde activée par GEOLENS_ENV=production, pas NODE_ENV (image démo aussi en production) — decisions.md D12
- compose Scaleway pose GEOLENS_ENV, USE_MEM_DB=0, STORAGE_DRIVER=s3 (T039, en parallèle) — ne pas toucher au compose
- mot de passe temporaire affiché une fois, jamais journalisé ailleurs — D12

## Hors périmètre
- server.ts, docker-compose*, Caddyfile, DEPLOYMENT.md (T039 documente la commande ci-dessus)
- forcer le changement de mot de passe à la 1ʳᵉ connexion (évolution produit)
- worker, web, e2e ; migrations (aucune colonne ajoutée)
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; G git HEAD `745bc54` (T037 commité) ; suite 74 fichiers 640 tests
- en parallèle : T039 (compose, Caddyfile, Dockerfile, DEPLOYMENT.md, .env.production.example) — 0 fichier commun
- T038 a fini ou finit sur e2e/ avec une API dev en watch : tes éditions de api/src peuvent la redémarrer — c'est attendu, le chef a séquencé
- règle G : fichier neuf ≤ 400 l, fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, npm --prefix api run build, ls, rm -r api/dist si absent au départ, rg, wc, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T040
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
