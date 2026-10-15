---
pack: T037
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T037 — Correctifs API : TRUST_PROXY v4-mappé, corps non-string, jeton encodé dans les logs, bornes TTL

> Seule source de vérité de l'agent T037. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger 5 défauts API (T033 D1-D3, T034 D1-D2) dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, chacun avec un test de non-régression qui échoue sur HEAD, sans faire grossir `server.ts`.

## Definition of Done
- [ ] config.ts proxyList : `::/16`, `::ffff:0:0/96`, `::ffff:0:0/100`, `::/0` → false ; `::ffff:10.0.0.0/104`, `fd00::/8`… voir Contrats → valeurs attendues
- [ ] config.ts posInt borné : TILE_TOKEN_TTL_SEC `1e9` → 28800 ; TILE_URL_WINDOW_SEC `1.7e308` → 14400 ; `604800` / `86400` acceptés
- [ ] logRedact.ts redactUrl : `?%74oken=a`, `?tok%65n=a`, `?TOKEN=a`, `?x=1&%54OKEN=a#f` → valeur `[redacted]` ; `?mytoken=a` intact ; `?%E0=1&token=a` ne lève pas
- [ ] bodyField.ts `bodyStr` créé ; `rg -c "\?\? ''\)\.toString\(\)" api/src/server.ts` → 0 ; `rg -n "orgId \?\? ''\)\.trim" api/src/server.ts` → ∅
- [ ] POST /api/auth/login `{email:{toString:1},password:'x'}` → 400 ou 401, jamais 500 ; idem reset-password token, accept-invite password ; /api/admin/invitations et /api/admin/users `orgId:123` → jamais 500
- [ ] `api/test/hardening-t037.test.ts` : 1 cas par point ci-dessus ; vérifié KO sur HEAD (`git -C G stash` INTERDIT → le prouver en lançant le test avant d'éditer src)
- [ ] `wc -l api/src/server.ts` ≤ 3387+0 lignes nettes vs HEAD (`git -C G diff --stat -- api/src/server.ts` : insertions ≤ suppressions)
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` vert (≥ 629 + nouveaux), sortie collée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | posInt :137-140, proxyList :145-156, import :6 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | E | redactUrl :10-17 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | 19 sites `(req.body?.X ?? '').toString()` + orgId :1386, :1549 + import en tête |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/bodyField.ts` | E | NEUF, helper |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/hardening-t037.test.ts` | E | NEUF, non-régression |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv), login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/rate-limit-proxy.test.ts` | L | modèle inject remoteAddress + XFF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/log-redact.test.ts` | L | cas existants à garder verts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/final-fixes.test.ts` | L | modèle invitations/users |

## Contrats
```ts
// ═══ api/src/bodyField.ts (NEUF)
/** Champ de corps attendu chaîne : toute autre forme (objet, nombre, tableau, null) → ''. */
export function bodyStr(v: unknown): string { return typeof v === 'string' ? v : ''; }
// server.ts : (req.body?.X ?? '').toString()  →  bodyStr(req.body?.X)   (chaînages .trim().slice() conservés)
//             (req.body?.orgId ?? '').trim()  →  bodyStr(req.body?.orgId).trim()
//             req.query.search (:2135) : HP, inchangé

// ═══ config.ts — posInt borné (remplace :137-140)
function posInt(v: string | undefined, def: number, max: number): number; // n=Number(v) ; Number.isFinite(n) && n >= 60 && n <= max ? Math.floor(n) : def
//   tileTokenTtlSec: posInt(env.TILE_TOKEN_TTL_SEC, 28800, 604800)   // ≤ 7 j
//   tileUrlWindowSec: posInt(env.TILE_URL_WINDOW_SEC, 14400, 86400)  // ≤ 24 h

// ═══ config.ts — proxyList v6 : refuser tout CIDR qui recouvre l'espace v4-mappé sauf préfixe ≥ 104 (= /8 v4)
import { BlockList, isIP } from 'node:net';
const V4_MAPPED = new BlockList(); V4_MAPPED.addSubnet('::ffff:0:0', 96, 'ipv6');
function coversV4Mapped(addr: string, p: number): boolean {
  if (p > 96) return V4_MAPPED.check(addr, 'ipv6');
  const b = new BlockList(); b.addSubnet(addr, p, 'ipv6'); return b.check('::ffff:0:0', 'ipv6');
}
//   fam 6 valide ⇔ p >= 16 && p <= 128 && (!coversV4Mapped(m[1], p) || p >= 104)
//   attendus : '::/16' false · '::ffff:0:0/96' false · '::ffff:0:0/100' false · '::ffff:10.0.0.0/104' ['::ffff:10.0.0.0/104'] · 'fd00::/8' false (p<16) · 'fd00::/16' ['fd00::/16'] · '2001:db8::/32' ['2001:db8::/32'] · 'uniquelocal' ['uniquelocal']
//   BlockList vérifié chef : addSubnet('::',16) → check('::ffff:0:0') true

// ═══ logRedact.ts — redactUrl par clé DÉCODÉE (remplace :10-17, signature inchangée)
export function redactUrl(url: string): string;
//   q = url.indexOf('?') ; < 0 → url inchangée ; h = url.indexOf('#', q) ; query = url.slice(q+1, h<0 ? undefined : h)
//   pour chaque segment s de query.split('&') : rawKey = s.split('=')[0] ; key = decodeURIComponent(rawKey.replace(/\+/g,' ')) (catch → rawKey) ;
//   SENSITIVE_QUERY_KEYS.includes(key.toLowerCase()) && s.includes('=') → `${rawKey}=[redacted]` sinon s
//   reconstruit : url.slice(0,q+1) + segments.join('&') + (h<0 ? '' : url.slice(h))
```
Défauts (repro des vérificateurs) :
- T033 D1 : TRUST_PROXY=`::/16`, RATE_LIMIT=1, 11 logins remoteAddress 198.51.100.9 XFF 203.0.113.{1..11} → 11×401 0×429 (attendu 429 au 11ᵉ)
- T033 D2 : POST /api/admin/invitations et /api/admin/users `{email:'o1@x.fr', orgId:123}` → 500
- T033 D3 : POST /api/auth/login `{email:{toString:1},password:'x'}` → 500 ; idem reset-password `token`, accept-invite `password`
- T034 D1 : GET `/api/projects/<pid>/storage/tileset.json?%74oken=<jeton>` → 200 et jeton en clair dans le log pino
- T034 D2 : TILE_TOKEN_TTL_SEC=1e9 → validité 31 ans ; T=W=1.7e308 → exp Infinity → 100 % tuiles 403

## Décisions actées
- trustProxy par réseau de confiance, fail-closed — decisions.md D10
- server.ts ne grossit pas : helpers en module dédié — CLAUDE.md G règle 3
- `consumeToken` mort (tokens.ts:57) : HP, ne pas supprimer

## Hors périmètre
- login sans normalizeEmail (L293), `\u0000` vers Postgres réel, `0.0.0.0/08` — constats HP
- web/, worker/, e2e/, compose, Caddyfile ; tokens.ts ; tout autre refactor de server.ts
- push, remote, PR, commit — D5/D9 (le chef commite) ; git stash/checkout/reset/clean ; npm install

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- G git : HEAD `6e22e8c` ; arbre propre au départ ; base suite 73 fichiers 629 tests ; typecheck 0
- test ciblé : `npx --prefix api vitest run --root api test/hardening-t037.test.ts`
- inject : `app.inject({ remoteAddress: '198.51.100.9', headers: { 'x-forwarded-for': '…' } })`
- 1 autre implémenteur (T038) travaille en parallèle sur e2e/ uniquement
- regex DoD testée à blanc : `rg -c "\?\? ''\)\.toString\(\)" api/src/server.ts` → 19 sur HEAD

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, wc, node -e, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T037
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
