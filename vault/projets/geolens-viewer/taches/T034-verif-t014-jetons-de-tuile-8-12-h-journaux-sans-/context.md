---
pack: T034
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T034 — Vérif T014 : jetons de tuile 8-12 h, journaux sans jeton

> Seule source de vérité de l'agent T034. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter la validité 8-12 h des jetons de tuile et l'absence de jeton dans les journaux (T014, PT-7), y compris via config/compose et logs pino réels, sans corriger.

## Definition of Done
- [ ] A1-A8 chacun OK/KO avec preuve
- [ ] journal pino réel observé : buildServer avec logger actif, 1 requête tuile signée, sortie capturée, `rg token=` sur la capture
- [ ] `api/test/zz-verif-t034.test.ts` créé, exécuté, supprimé (`git -C G status --short` → ∅)
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution ; écriture : `result.md` + test jetable.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileExp.ts` | L | tileTokenExp |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | L | redactUrl, serializeReq, loggerOptions |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | posInt, tileTokenTtlSec, tileUrlWindowSec |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | signature/vérif jeton tuile |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg : quantizedTileExp · IMMUTABLE_CACHE :516 · Fastify( :165 · route storage |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | L | buildServer({ logger: true }) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-window.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/log-redact.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/auth-and-tiles.test.ts` | L | modèle requête tuile signée |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | TILE_* :34-35 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t034.test.ts` | E | jetable |

## Contrats
```ts
// tileExp.ts : tileTokenExp(cfg: Pick<AppConfig,'tileTokenTtlSec'|'tileUrlWindowSec'>, nowMs): number
//   now = ⌊nowMs/1000⌋ ; exp = (⌊(now + T)/W⌋ + 1)·W ; invariant T < exp - now ≤ T + W ; défauts T 28800, W 14400
// config.ts : posInt(v, def) : n = Number(v) ; Number.isFinite(n) && n >= 60 ? ⌊n⌋ : def
// logRedact.ts : SENSITIVE_QUERY_KEYS = ['token'] ; redactUrl(url) remplace ([?&]token=)[^&#]* → $1[redacted], insensible casse
//   serializeReq(req) → { method, url: redactUrl(url), hostname, remoteAddress, remotePort } ; loggerOptions(false) === false
// server.ts:165 : Fastify({ logger: loggerOptions(opts.logger ?? false), trustProxy })
// server.ts:516 : IMMUTABLE_CACHE = 'private, max-age=86400, immutable' (constat T014 : > validité jeton)
```
Affirmations à réfuter :
- A1 exp - now ∈ (T, T+W] pour T,W défaut et 3 couples config (T<W, T=W, T>W)
- A2 jeton expiré (now > exp) → 401/403 sur la route storage ; jeton valide → 200
- A3 TILE_TOKEN_TTL_SEC `'abc'`, `'30'`, `'-5'`, `'1e9'` → comportement borné (défaut ou valeur saine), jamais exp NaN/Infinity
- A4 journal pino réel d'une requête tuile signée : 0 occurrence de la valeur du jeton (url, erreurs, res)
- A5 `?Token=`, `&token=` en 2ᵉ position, `#` après token, token encodé %-escape → masqué ; `?mytoken=` intact
- A6 chemin d'erreur (404/401 tuile) : l'URL loguée par le handler d'erreur Fastify est masquée aussi
- A7 `.env.production.example`, `docker-compose*.yml`, `DEPLOYMENT.md` : aucune valeur TILE_* qui rétablit 24-48 h (`rg -n "TILE_" G --glob '!node_modules'`)
- A8 IMMUTABLE_CACHE 86400 > validité max 43200 : constat de risque (cache privé navigateur), sévérité H/M/B argumentée ≤ 15 mots

## Décisions actées
- jeton tuile non lié à session_version, validité 8-12 h — decisions.md D6
- logs : sérialiseur req masque `token`, 0 `log` Caddy — D6

## Hors périmètre
- corriger, éditer src/, un test existant, un fichier de config
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean
- npm install, npm audit fix, montée de dépendance
- web/, worker/, e2e/, Caddyfile

## Environnement
- G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · git local : base `745d46f`, HEAD `6e22e8c` · arbre propre (`git -C G status --short` → ∅)
- node v22.22.1 ; deps api, web, e2e installées ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- état connu : typecheck 0 · lint 0 err 1 warn (Admin.tsx:368, préexistant) · api 73 fichiers 629 tests · web 176 fichiers 1691 tests
- suite complète : `npm --prefix api test -- --exclude 'test/zz-verif-*'` (le test jetable d'un autre vérificateur peut exister) ; ton jetable : `npx --prefix api vitest run --root api test/<ton fichier>`
- 3 autres vérificateurs tournent en parallèle sur G : 0 écriture hors fichiers jetables listés ; ne jamais lancer `npm install`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t034.test.ts), Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, node -e, rm du seul zz-verif-t034.test.ts, git -C G diff 745d46f..HEAD, git -C G status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T034
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
