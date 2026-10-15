---
pack: T029
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T029 — PT-1 suite : trustProxy par réseau de confiance (fastify 5.12.5)

> Seule source de vérité de l'agent T029. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer le `trustProxy` numérique laissé par T024 (refusé par fastify 5.12.5 : typecheck KO, fail-closed à l'exécution) par une liste d'adresses/réseaux de confiance (`TRUST_PROXY=uniquelocal` en prod), pour que `req.ip` = IP du client derrière Caddy et que le rate-limit soit par client. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] config.ts : `hops()` supprimé → `proxyList()` contrat ; AppConfig `trustProxy: string[] | false`
- [ ] server.ts:165 → `trustProxy: config.trustProxy` (contrat) ; 0 autre ligne
- [ ] .env.production.example:10 → ligne contrat
- [ ] rate-limit-proxy.test.ts : réécrit selon les 5 cas listés (fichier T024 non commité, droit E)
- [ ] `npm --prefix api run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix api test` → tous verts, compte collé (attendu 72 fichiers)
- [ ] `git -C G diff --stat -- api .env.production.example` collé (inclut T024 : package.json/lock = attendu)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :32-33 type, :140-145 hops, :165 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :165 seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :10 seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | E | 51 l, réécriture |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv) |

## Contrats
```ts
// ═══ fastify 5.12.5 — node_modules/fastify/fastify.d.ts:152
trustProxy?: boolean | string | string[] | TrustProxyFunction
// lib/request.js:51-54 : typeof tp === 'number' → () => false (fail-closed, jamais XFF)
// string / string[] → proxy-addr : IP, CIDR, ou mots-clés 'loopback' | 'linklocal' | 'uniquelocal' (10/8, 172.16/12, 192.168/16, fc00::/7)

// ═══ config.ts — CIBLE (remplace hops() et `trustProxy: number`)
/** Adresses/réseaux de proxy de confiance (Caddy, nginx). false = aucun : req.ip = socket, XFF ignoré. */
trustProxy: string[] | false;
// TRUST_PROXY = liste séparée par virgules ; chaque entrée trim ; entrées vides ignorées
// entrée valide ⇔ ∈ {loopback, linklocal, uniquelocal} OU (contient '.' ou ':' ET /^[0-9A-Fa-f:.]+(\/\d{1,3})?$/)
// ≥ 1 entrée invalide → false (fail-closed, toute la liste) ; 0 entrée → false
function proxyList(v: string | undefined): string[] | false;
//   loadConfig : trustProxy: proxyList(env.TRUST_PROXY),

// ═══ server.ts:165 ÉTAT ACTUEL (T024, casse le typecheck)
const app = Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy: config.trustProxy || false });
// → const app = Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy: config.trustProxy });
```
```dotenv
# .env.production.example:10 — CIBLE
TRUST_PROXY=uniquelocal                    # proxys de confiance = réseau Docker interne (Caddy) ; l'API n'expose aucun port
```
Cas rate-limit-proxy.test.ts (`makeTestApp({ RATE_LIMIT: '1', … })`, 11 POST /api/auth/login identifiants faux, `remoteAddress` + `x-forwarded-for`) :
- TRUST_PROXY=uniquelocal, remoteAddress 10.0.0.2, XFF différents (203.0.113.<i>) → 0 réponse 429
- TRUST_PROXY=uniquelocal, remoteAddress 10.0.0.2, même XFF 203.0.113.7 → ≥ 1 réponse 429
- TRUST_PROXY=uniquelocal, remoteAddress PUBLIC 198.51.100.9, XFF différents → ≥ 1 réponse 429 (pair non fiable : XFF ignoré)
- TRUST_PROXY absent, remoteAddress 10.0.0.2, XFF différents → ≥ 1 réponse 429
- unitaire loadConfig : 'uniquelocal' → ['uniquelocal'] · ' 10.0.0.0/8 , loopback ' → ['10.0.0.0/8','loopback'] · '1' → false (ni '.' ni ':') · 'abc' → false · 'uniquelocal,abc' → false · absent → false

## Décisions actées
- confiance par réseau (uniquelocal), pas par nombre de sauts — fastify 5.12.5 fail-closed sur nombre
- uniquelocal sûr : API sans port publié — seuls Caddy/nginx la joignent
- liste invalide → false — fail-closed, XFF ignoré
- fastify 5.12.5 / nodemailer 9.1.1 déjà installés par T024 — 0 commande npm ici

## Hors périmètre
- npm install / audit fix ; package.json / package-lock.json (déjà modifiés par T024, ne pas toucher)
- keyGenerator custom, limites par route, Caddyfile, compose
- modifier un autre test ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules : fastify 5.12.5, nodemailer 9.1.1 (T024) ; vitest + pg-mem
- état de départ : typecheck exit 2 (server.ts:165 TS2769) ; tests 1 KO (rate-limit-proxy cas 1) — attendu, c'est ce que T029 corrige
- G sous git : HEAD 8518f4b ; diff T024 non commité sur api/ et .env.production.example ; seul agent api/

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T029
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
