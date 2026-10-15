---
pack: T051
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T051 — D15-A : IP et user-agent dans l'audit + schéma (contract_end_at, index) + getPlatformOrgIds

> Seule source de vérité de l'agent T051. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Poser la fondation D15 dans G/api : chaque entrée `audit_log` porte l'IP (`req.ip`) et le user-agent via un contexte de requête AsyncLocalStorage (0 appel `audit()` modifié), ajouter au schéma `audit_log.ip/user_agent`, `organizations.contract_end_at` et 2 index, et le helper `getPlatformOrgIds`. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/requestContext.ts` NEUF = contrat verbatim
- [ ] `api/src/repo.ts` : audit() insère ip/user_agent depuis currentRequestMeta() (signature inchangée, try/catch conservé) ; + getPlatformOrgIds
- [ ] `api/src/schema.ts` : colonnes dans les CREATE + 3 ALTER + 2 CREATE INDEX (contrat) ; 0 `;` dans les commentaires SQL ajoutés
- [ ] `api/src/server.ts` : import + `registerRequestContext(app);` juste après `await registerAuth(app, config);` (~:250) ; 0 autre ligne (`git diff -- api/src/server.ts` = 2 lignes ajoutées)
- [ ] `api/test/audit-context.test.ts` NEUF : 7 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base ≥ 629 ; noter le compte exact de départ) — sorties collées
- [ ] `git -C G diff --stat -- api` collé : repo.ts, schema.ts, server.ts + 2 non suivis
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/requestContext.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | E | imports en tête, audit() :139-152, + getPlatformOrgIds |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | E | organizations :18-52, audit_log :134-146 + ALTER, migrate() :210-230 (L) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | imports en tête + ~:250 (ancre `await registerAuth(app, config);`) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/audit-context.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv), login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | L | modèle inject remoteAddress + XFF + TRUST_PROXY |

## Contrats
```ts
// ═══ api/src/requestContext.ts (NEUF) — import { AsyncLocalStorage } from 'node:async_hooks' ; import type { FastifyInstance } from 'fastify'
export interface RequestMeta { ip: string | null; userAgent: string | null }
export const UA_MAX_LEN = 255;
export function truncateUa(raw: string | string[] | undefined): string | null;   // tableau → [0] ; '' | undefined → null ; slice(0, UA_MAX_LEN)
export function currentRequestMeta(): RequestMeta | undefined;                   // hors requête (timer, scripts) → undefined
export function registerRequestContext(app: FastifyInstance): void;
//   app.addHook('preValidation', (req, _r, done) => als.run({ ip: req.ip || null, userAgent: truncateUa(req.headers['user-agent']) }, done))
//   NV architecte : contexte conservé jusqu'au handler sous inject → le cas « POST JSON » tranche ; s'il échoue : hook `preHandler` (même code), le noter dans Écarts

// ═══ repo.ts:139-152 ACTUEL
export async function audit(db: Db, user: SessionUser | null, action: string, detail?: string): Promise<void> {
  try {
    await db.query(
      'INSERT INTO audit_log (id, user_id, org_id, action, detail) VALUES ($1,$2,$3,$4,$5)',
      [randomUUID(), user?.userId ?? null, user?.orgId ?? null, action, detail ?? null],
    );
  } catch { … }
// → const m = currentRequestMeta();
//   'INSERT INTO audit_log (id, user_id, org_id, action, detail, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7)' [..., m?.ip ?? null, m?.userAgent ?? null]
// repo.ts NEUF :
export async function getPlatformOrgIds(db: Db): Promise<Set<string>>;  // SELECT org_id FROM users WHERE is_platform_admin = true

// ═══ schema.ts
// CREATE organizations : + `contract_end_at TIMESTAMPTZ,` (avant la parenthèse fermante, ~:44)
// CREATE audit_log : + `ip TEXT,` + `user_agent TEXT,` (~:140)
// après le bloc des ALTER organizations (~:52), 1 instruction par ligne :
ALTER TABLE organizations ADD COLUMN contract_end_at TIMESTAMPTZ;
// après audit_log (~:141) :
ALTER TABLE audit_log ADD COLUMN ip TEXT;
ALTER TABLE audit_log ADD COLUMN user_agent TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
// migrate() découpe sur ';' et tolère ALTER (colonne existante) et CREATE INDEX déjà présent (~:227)

// ═══ server.ts ~:247-251 ACTUEL
  if (config.rateLimitEnabled) {
    await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  }
  await registerAuth(app, config);
// → + registerRequestContext(app);   (avant toute route)
// req.ip honore TRUST_PROXY (D10, config.trustProxy = proxyList)
```
Cas audit-context.test.ts (lire audit_log via `app.db.query`) :
- login (inject, header user-agent 'vitest-UA/1') → dernière ligne action 'login' : ip '127.0.0.1', user_agent 'vitest-UA/1'
- user-agent de 400 caractères → user_agent longueur 255
- POST JSON authentifié (change-password, corps JSON) → ip ≠ NULL (contexte conservé à travers le parsing)
- `audit(app.db, null, 'test_hors_requete')` appelé hors requête → ip NULL, user_agent NULL
- migrate(app.db) appelé une 2e fois → 0 throw ; colonnes ip/user_agent/contract_end_at présentes
- TRUST_PROXY='loopback', XFF '203.0.113.7' → ip '203.0.113.7'
- sans TRUST_PROXY, XFF '203.0.113.7' → ip ≠ '203.0.113.7'
- getPlatformOrgIds → contient l'org de DEMO.adminEmail (admin plateforme du seed)

## Décisions actées
- ALS en preValidation, 0 appel audit() modifié — decisions.md D17
- DDL via migrate() au boot, 0 commande humaine — modèle D6
- UA tronqué 255 ; IP = req.ip — honore TRUST_PROXY

## Hors périmètre
- erasure, retention, export, teardown, routes contrat (lots suivants) ; Admin.tsx/Account.tsx (T052 en parallèle)
- modifier un appel audit() existant ou un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules (fastify 5.12.5) ; vitest + pg-mem ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals)
- ciblé : `npx --prefix api vitest run --root api test/audit-context.test.ts`
- G sous git HEAD 003e284, arbre propre ; T052 écrit web/ en parallèle ; seul agent api/

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T051
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
