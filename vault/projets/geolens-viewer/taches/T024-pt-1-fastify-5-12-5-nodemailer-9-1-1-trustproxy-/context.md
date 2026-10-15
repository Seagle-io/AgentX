---
pack: T024
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T024 — PT-1 : fastify 5.12.5 + nodemailer 9.1.1, trustProxy derrière Caddy

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Monter fastify en ^5.12.5 et nodemailer en ^9.1.1 (commande unique autorisée), puis activer `trustProxy` configurable (`TRUST_PROXY`, nombre de sauts) pour que `req.ip` = IP du client derrière Caddy et que chaque client ait son propre compteur de rate-limit. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] commande lancée telle quelle (cwd G) : `npm --prefix api install fastify@^5.12.5 nodemailer@^9.1.1` → sortie (fin) collée ; `node -p "require('./api/node_modules/fastify/package.json').version"` ≥ 5.12.5 et nodemailer ≥ 9.1.1 collés
- [ ] `npm --prefix api audit --omit=dev` → sortie résumée collée (avant/après : 5 high au 2026-10-07) ; 0 `audit fix`
- [ ] `api/src/config.ts` : AppConfig `trustProxy: number` + `trustProxy: hops(env.TRUST_PROXY)` (contrat)
- [ ] `api/src/server.ts` : `Fastify({ logger: …, trustProxy: config.trustProxy || false })` (ligne ~:163) ; 0 autre ligne
- [ ] `.env.production.example` : `TRUST_PROXY=1` + commentaire 1 ligne (Caddy = 1 saut) sous le bloc RATE_LIMIT
- [ ] `api/test/rate-limit-proxy.test.ts` NEUF : 3 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts, compte collé (base 71 fichiers / 617 tests)
- [ ] `git -C G diff --stat -- api/package.json api/package-lock.json api/src/config.ts api/src/server.ts .env.production.example` + `git -C G status --short api/test/rate-limit-proxy.test.ts` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | E | via la commande npm SEULEMENT |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package-lock.json` | E | via la commande npm SEULEMENT |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig :15-35, loadConfig :130-160 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | ~:163 Fastify({…}) seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | bloc RATE_LIMIT ~:8-9 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/hardening.test.ts` | L | modèle rate-limit :27-49 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv) |

## Contrats
```ts
// ═══ config.ts
//   AppConfig : /** Nombre de proxys de confiance devant l'API (Caddy = 1). 0 = aucun (req.ip = socket). */ trustProxy: number;
//   local, à côté de bool()/posInt() :
function hops(v: string | undefined): number; // n = Number(v) ; Number.isInteger(n) && n >= 0 && n <= 5 ? n : 0
//   loadConfig : trustProxy: hops(env.TRUST_PROXY),

// ═══ server.ts ~:163 ACTUEL
const app = Fastify({ logger: loggerOptions(opts.logger ?? false) });
// → const app = Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy: config.trustProxy || false });
// rate-limit existant ~:243 (INCHANGÉ) : if (config.rateLimitEnabled) { await app.register(rateLimit, { max: 300, timeWindow: '1 minute' }); }
// login : route config rateLimit 10/min (INCHANGÉ) ; clé par défaut de @fastify/rate-limit = req.ip
// fastify trustProxy: <number> = nombre de sauts de confiance → req.ip = adresse à cette profondeur dans X-Forwarded-For
```
Cas rate-limit-proxy.test.ts (`makeTestApp({ RATE_LIMIT: '1', TRUST_PROXY: '1' })`, `app.inject` avec `remoteAddress: '10.0.0.2'` = Caddy) :
- 11 POST /api/auth/login (identifiants faux), `x-forwarded-for` différent à chaque appel (`203.0.113.<i>`) → 0 réponse 429
- 11 POST /api/auth/login, même `x-forwarded-for: 203.0.113.7` → ≥ 1 réponse 429
- `TRUST_PROXY` absent : 11 POST login, XFF différents, même remoteAddress → ≥ 1 réponse 429 (XFF ignoré sans confiance — anti-spoof)
- unitaire : loadConfig({ TRUST_PROXY: '1' }).trustProxy === 1 ; 'abc' → 0 ; '9' → 0 ; absent → 0

## Décisions actées
- commande npm unique autorisée à cet agent — decisions.md D8 (humain)
- nodemailer 10.x = HP — montée majeure, décision humaine
- trustProxy en nombre de sauts, défaut 0 — anti-spoof XFF en dev
- clé rate-limit = req.ip, pas userId — trustProxy suffit à séparer les clients

## Hors périmètre
- toute autre commande npm (`audit fix`, autre paquet, `npm ci`, `npm update`)
- keyGenerator par utilisateur ; limites par route ; Caddyfile/nginx
- PT-5, politique mdp (T019, livré avant) ; sessions (T020, livré avant)
- modifier un test existant ; si un test existant casse après la montée → BLQ avec nom + sortie (ne pas rétrograder seul)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules installé ; registre npm joignable (T002 a lancé `npm view`)
- `npm --prefix api test` ; `npm --prefix api run typecheck` ; ciblé `npx --prefix api vitest run --root api test/rate-limit-proxy.test.ts`
- G sous git, HEAD ad370d1 = tout le travail antérieur commité → `git -C G diff --stat` = périmètre T024 seul ; seul agent api/ ; un vérificateur lit web/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api install fastify@^5.12.5 nodemailer@^9.1.1, npm --prefix api audit --omit=dev, npm --prefix api test, npm --prefix api run typecheck, npx vitest, node -p, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T024
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
