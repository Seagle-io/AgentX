---
pack: T014
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T014 — Jetons de tuile 8-12 h + journaux sans jeton (PT-7, LOG-3)

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ramener la validité des jetons de tuile de 24-48 h à (T, T+W] = 8-12 h via un module pur NEUF `api/src/tileExp.ts`, rapatrier `TILE_URL_WINDOW_SEC` dans `config.ts`, et masquer `token=` dans les URL journalisées via `api/src/logRedact.ts` branché sur `Fastify({ logger })`. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `api/src/tileExp.ts` NEUF = contrat verbatim
- [ ] `api/src/logRedact.ts` NEUF = contrat verbatim
- [ ] `api/src/config.ts` : AppConfig + `tileUrlWindowSec` ; `posInt` local ; défauts 28800 / 14400 (contrat)
- [ ] `api/src/server.ts` : bloc `tileUrlWindowSec`/`quantizedTileExp` (baseline :507-512) → 1 ligne contrat ; commentaire C-02 (baseline :497-506) « validité (T, T+W] » ; `Fastify({ logger: … })` (baseline :160) → contrat ; 0 autre ligne
- [ ] `rg -n "process\.env" api/src --glob '!config.ts'` → ∅ (sortie collée)
- [ ] `api/test/tile-window.test.ts` NEUF + `api/test/log-redact.test.ts` NEUF : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix api test` → tous verts, compte collé
- [ ] `git -C G diff --stat -- api` collé : 0 fichier api hors WL (session.ts/auth.ts/repo.ts/schema.ts = T007, déjà livrés)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileExp.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig :15-30, loadConfig :130-150 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | 3 sites, recouper par rg (T007 a décalé les lignes) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-window.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/log-redact.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/auth-and-tiles.test.ts` | L | non-rég tuiles, ETag/304 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/boot.test.ts` | L | modèle loadConfig(env) |

## Contrats
```ts
// ═══ api/src/tileExp.ts (NEUF), PURE. import type { AppConfig } from './config.js';
//   now = Math.floor(nowMs / 1000) ; W = cfg.tileUrlWindowSec ; T = cfg.tileTokenTtlSec ; return (Math.floor((now + T) / W) + 1) * W
//   invariant : T < exp - now ≤ T + W ; exp constant sur W s consécutives
export function tileTokenExp(cfg: Pick<AppConfig, 'tileTokenTtlSec' | 'tileUrlWindowSec'>, nowMs: number): number;

// ═══ server.ts — baseline :507-512 ACTUEL
const tileUrlWindowSec = Math.max(
  config.tileTokenTtlSec,
  Number(process.env.TILE_URL_WINDOW_SEC ?? 86400),
);
const quantizedTileExp = (): number =>
  (Math.floor(Date.now() / 1000 / tileUrlWindowSec) + 2) * tileUrlWindowSec;
// → CIBLE (appelants quantizedTileExp() inchangés) :
const quantizedTileExp = (): number => tileTokenExp(config, Date.now());
// commentaire C-02 au-dessus : « défaut 24 h … entre 1 et 2 fenêtres » → « fenêtre W (défaut 4 h) … validité (T, T+W], défaut 8-12 h »

// ═══ config.ts
//   AppConfig : tileTokenTtlSec: number;  /** durée MIN garantie (s) */
//               tileUrlWindowSec: number; /** quantification exp (s) */
//   loadConfig ACTUEL : tileTokenTtlSec: Number(env.TILE_TOKEN_TTL_SEC ?? 3600),
//   → tileTokenTtlSec: posInt(env.TILE_TOKEN_TTL_SEC, 28800),
//     tileUrlWindowSec: posInt(env.TILE_URL_WINDOW_SEC, 14400),
//   local (à côté de bool(), config.ts ~:125) :
function posInt(v: string | undefined, def: number): number; // n = Number(v) ; Number.isFinite(n) && n >= 60 ? Math.floor(n) : def

// ═══ api/src/logRedact.ts (NEUF)
export const SENSITIVE_QUERY_KEYS: readonly string[] = ['token'];
// par clé k : url.replace(new RegExp(`([?&]${k}=)[^&#]*`, 'gi'), '$1[redacted]') ; reste de l'URL identique
export function redactUrl(url: string): string;
export interface LoggableReq { method?: string; url?: string; ip?: string; hostname?: string; socket?: { remotePort?: number } }
export function serializeReq(req: LoggableReq): { method?: string; url: string; hostname?: string; remoteAddress?: string; remotePort?: number };
export function loggerOptions(enabled: boolean): false | { serializers: { req: typeof serializeReq } };
// server.ts baseline :160 ACTUEL : const app = Fastify({ logger: opts.logger ?? false });
//   → const app = Fastify({ logger: loggerOptions(opts.logger ?? false) });   index.ts INCHANGÉ (buildServer({ config, logger: true }))
```
Cas de test :
- tile-window : T 28800 W 14400 → exp-now ∈ (28800, 43200] sur 10 000 now aléatoires · 2 now même fenêtre → même exp · now+W → exp+W · loadConfig({}) → 28800/14400 · TILE_TOKEN_TTL_SEC 'abc' → défaut · '30' → défaut · '7200' → 7200
- log-redact : '/p/storage/x.b3dm?token=a.b' → '?token=[redacted]' · '?x=1&token=a&y=2' → x,y gardés · '?TOKEN=a' masqué · '?mytoken=a' et '?tokens=a' intacts · sans query identique · loggerOptions(false) === false · serializeReq({ url: '/x?token=secret' }).url ∌ 'secret'
- non-rég : auth-and-tiles.test.ts (ETag/304) vert

## Décisions actées
- T 28800, W 14400 → validité 8-12 h — decisions.md D6
- jeton reste en query, non lié à sv — refonte viewer = lot futur
- redaction par sérialiseur req, pas pino redact — url seule concernée
- process.env seulement dans config.ts — règle G
- logique dans modules neufs, server.ts = appels — monolithe gelé

## Hors périmètre
- session.ts, auth.ts, repo.ts, schema.ts (T007, livré) ; les 7 sites session de server.ts
- rate-limit/trustProxy, sidecars, PT-5/PT-6, relais upload, garde de config prod
- index.ts, Caddyfile, nginx.conf, .env*
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules installé ; vitest + pg-mem (USE_MEM_DB=1)
- `npm --prefix api test` ; `npm --prefix api run typecheck` (tsc -p tsconfig.test.json)
- G sous git, baseline 745d46f ; lignes server.ts décalées par T007 → `git -C G show HEAD:api/src/server.ts` donne la baseline
- seul agent api/ pendant cette tâche

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git show, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T014
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
