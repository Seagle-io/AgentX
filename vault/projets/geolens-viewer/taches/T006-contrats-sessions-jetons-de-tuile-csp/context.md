---
pack: T006
projet: geolens-viewer
role: architecte
cree: 2026-10-07
---

# Pack T006 — Contrats sessions, jetons de tuile, CSP

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire dans `result.md` les contrats exécutables de 3 lots — A2 sessions révocables (PT-2/PT-3), A2b jetons de tuile (PT-7), C1 CSP portail+viewer — plus l'ordre d'édition de `api/src/server.ts` entre lots ; 0 ligne de code de prod. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A2 : signature TS verbatim de `api/src/session.ts` (NEUF) + changement exact de `requireAuth` (auth.ts:88-95) + liste des 4 sites mdp server.ts à toucher
- [ ] A2 : schéma de révocation tranché (colonne `password_changed_at` OU `session_version`) + DDL exact + mécanisme d'application dans schema.ts (migration auto au boot ou commande humaine — dire laquelle)
- [ ] A2 : règle iat vs horodatage DB (unité, tolérance, réémission cookie au change-password) écrite en 1 bloc
- [ ] A2 : coût par requête tranché (lookup DB à chaque requête vs cache court) + chiffre de TTL si cache
- [ ] PT-3 : helper partagé org suspendue → contrat ; sites : server.ts:278-281, tenancy.ts:87-121
- [ ] A2b : formule de fenêtre de jeton corrigée (remplace server.ts:507-512) + clé config `tileUrlWindowSec` dans config.ts + règle redaction logger (`token` hors URL loggée) avec point d'accroche (index.ts ou server.ts:160)
- [ ] C1 : chaîne CSP finale verbatim (meta viewer) + en-têtes Caddyfile verbatim (CSP portail, frame-ancestors, nosniff, Referrer-Policy) ; cible = Caddy du compose scaleway
- [ ] Ordre server.ts : tableau lot → plages de lignes → rang (A1 PT-1, A2, A2b, A3 PT-4+relais, A4 PT-5/PT-6/email, X1 config prod) ; 0 chevauchement de plages dans un même rang
- [ ] pour chaque lot A2/A2b/C1 : cas de test nommés (fichier + cas) recopiables dans un pack
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule sur G. Écriture : `result.md` de ce dossier uniquement.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | requireAuth, cookie 7 j (105 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | getUserById, toSessionUser, UserRow |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject L87-121 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | DDL users/organizations, mécanisme migration |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | L40-75 seulement : sign/verifyTileToken |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | AppConfig, L140-180 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | L | logger (17 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | plages ciblées ≤ 80 l : 155-245, 270-345, 370-500, 500-545, 1360-1400, 1450-1460, 1545-1560 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | L | cible prod (42 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | frontal prod (16 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | L40-90 : consommation du jeton côté viewer |

## Contrats
```
// existant, relevé T002 — api/src
// storage.ts:47-69
export function signTileToken(config: AppConfig, payload: TileTokenPayload): string
export function verifyTileToken(config: AppConfig, token: string | undefined): TileTokenPayload | null   // payload {p,u,exp}
// auth.ts
export interface SessionUser { userId: string; orgId: string; role: 'org_admin'|'member'; email: string; isPlatformAdmin: boolean }
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>   // :88-95 = jwtVerify seul
export function setSessionCookie(reply, token, config)   // maxAge 7 j
// server.ts:304 jwtSign(toSessionUser(u), 7d) ; claims SessionUser + iat/exp
// server.ts:278
async function resolveSignedProject(payload: { u: string; p: string }): Promise<ProjectRow | null>
// tenancy.ts:87
export async function getAccessibleProject(db: Db, user: SessionUser, projectId: string): Promise<ProjectRow | null>
// repo.ts:25,30
export async function getUserById(db: Db, id: string): Promise<UserRow | null>
export function toSessionUser(u: UserRow): SessionUser
// server.ts:507
const tileUrlWindowSec = Math.max(config.tileTokenTtlSec, Number(process.env.TILE_URL_WINDOW_SEC ?? 86400));
const quantizedTileExp = (): number => (Math.floor(Date.now() / 1000 / tileUrlWindowSec) + 2) * tileUrlWindowSec;
```
```
faits T002 :
- /api/auth/me server.ts:318-343 seul à relire user (disabled, org suspendue → 401) ; figé par test/admin-console.test.ts:216-227
- sites mdp sans invalidation : server.ts:386 change · :460-466 reset self · :488-494 reset self #2 · :1458 admin reset (lignes à recouper)
- password_changed_at / session_version : ∅
- jeton tuile émis : server.ts:538,592,608-609,838-839 · geoplan/computeProxy.ts:229 ; reçu req.query.token :668,733,1173
- appelants resolveSignedProject : :670 thumbnail · :740 storage/* · :1175 objet importé
- config.ts:144 TILE_TOKEN_TTL_SEC défaut 3600 masqué par plancher 86400 ; server.ts:509 lit process.env (viole règle G)
- logger = Fastify({ logger }) server.ts:160 ; sérialiseur req défaut inclut url+query
```
```
faits T003 — CSP actuelle (viewer.html:16 = web/src/viewer/index.html:16)
default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: file: glr-file: cog: photo:; font-src 'self' data:; connect-src 'self' blob: data: glr-file: cog: photo: https://unpkg.com; worker-src 'self' blob:; frame-src file: blob: glr-file:; object-src glr-file: file: blob:;
- 1 seul script inline viewer.html:23-26 (import idleLogout) → externalisable dans boot-web.ts ; 0 on*= ; style="" ×82 → style-src 'unsafe-inline' conservé
- 'wasm-unsafe-eval' + blob: requis (draco/basis/copc/laz-perf, workers)
- décodeurs : unpkg → copie locale node_modules/three/examples/jsm/libs/{draco,basis} (three 0.184.0) servie en /draco/ /basis/
- frame-ancestors/nosniff/Referrer-Policy : en-tête frontal seulement (meta ignore)
- portail web/index.html : 0 CSP ; Caddyfile : 0 header ; build vite modulepreload inline : NV
```

## Décisions actées
- cible prod = docker-compose.scaleway.yml (Caddy) — decisions.md D2
- PT-5 réponse neutre — D3, hors ce pack
- logique dans modules NEUFS, server.ts = appels seulement — monolithe gelé (3387 l)
- process.env seulement dans config.ts — règle G
- 0 nouvelle dépendance npm — règle G
- jeton tuile hors URL (en-tête/cookie) = refonte viewer HP — trop large, lot futur
- toute route = test 401 + autre-org — règle G

## Hors périmètre
- écrire/modifier un fichier de G ; lancer quoi que ce soit (pas de Bash)
- PT-1, PT-4, PT-5, PT-6, relais upload : seulement leurs plages dans le tableau d'ordre
- XSS viewer (lots V1/V2), worker, compose prod.yml, sauvegarde
- push, remote, PR, commit — D5

## Environnement
- node v22.22.1 ; api : vitest, pg-mem en test ; ~571 tests api verts au 2026-10-07
- G sans .git ; copie de référence AgentX/.cache/geolens-baseline-2026-10-07
- hook AgentX refuse migrations TypeORM/Prisma/Alembic aux agents → si DDL exige une commande, l'écrire pour l'humain

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep (sur G/api/src, G/api/test, G/web/src/viewer), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
---
## Décisions
- choix — raison ≤ 8 mots — option écartée
## Contrats
```
A2 session.ts + requireAuth + DDL + règle iat ; PT-3 helper ; A2b fenêtre + config + redaction ; C1 CSP meta + Caddyfile — verbatim
```
## Ordre server.ts
| rang | lot | plages | dépend de |
## Tests par lot
- lot · fichier test · cas
## Vérifié comment
- lecture chemin:L1-L2 → fait
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
