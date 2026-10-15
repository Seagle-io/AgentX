---
pack: T064
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T064 — Tuiles L1+L3 : presignGet S3, config tilePresign, logRedact x-amz, tileRateKey, tileRedirect

> Seule source de vérité de l'agent T064. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Livrer les briques de la redirection des tuiles vers S3 et du quota par compte, sans toucher server.ts : `presignGet` (driver S3) + `s3PublicOrigin` dans storage.ts, `AppConfig.tilePresign` dans config.ts, masquage des paramètres `x-amz-*` dans logRedact.ts, modules purs NEUFS `tileRateKey.ts` et `tileRedirect.ts`, avec tests. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] storage.ts : `PresignGetOptions`, `PresignedGet`, `presignGet?` dans StorageDriver (après signUploadPart :165) ; implémentation S3 ; driver local SANS presignGet ; `s3PublicOrigin` exportée — contrat verbatim
- [ ] config.ts : `tilePresign` (contrat) ; doc de rateLimitTileMax (~:31) → « req/min PAR COMPTE (jeton vérifié) ; par IP si jeton invalide »
- [ ] logRedact.ts:7 SENSITIVE_QUERY_KEYS = contrat
- [ ] `api/src/tileRateKey.ts`, `api/src/tileRedirect.ts` NEUFS = contrat
- [ ] tests NEUFS `presign-get.test.ts`, `log-redact-s3.test.ts`, `tile-rate-key.test.ts` : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 90 / 772) — sorties collées
- [ ] `git -C G diff --stat -- api` + `git -C G status --short api` collés : 3 fichiers modifiés + 5 neufs
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | E | interface :115-185 ; S3 :380-430 (getClient :392, scopedKey :422), signUploadPart :566-573 (modèle) ; verify/signTileToken :44-60 (L) ; contentTypeFor :84 (L) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig ; bool()/intIn() ; loadConfig |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | E | :7 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRateKey.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRedirect.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/presign-get.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/log-redact-s3.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-rate-key.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/storage.test.ts` | L | modèle création driver (local/S3 factice) |

## Contrats
```ts
// ═══ storage.ts — interface StorageDriver (après signUploadPart :165)
export interface PresignGetOptions { ttlSec: number /* validité max URL = borne lecture post-révocation */; nowMs: number /* injecté */;
  responseCacheControl: string /* → ResponseCacheControl */; responseContentType: string /* → ResponseContentType */ }
export interface PresignedGet { url: string; expiresAtMs: number }
/** GET présigné. Absent ou null ⇒ l'appelant streame. Calcul local : 0 I/O, 0 test d'existence. Lève StorageError('invalid_path') hors préfixe. */
presignGet?(prefix: string, relPath: string, opts: PresignGetOptions): Promise<PresignedGet | null>;
// local : ABSENT. S3 (client = await getClient() :392, modèle signUploadPart :566-573) :
//   Bms = Math.floor(ttlSec / 2) * 1000 ; signedAtMs = Math.floor(nowMs / Bms) * Bms
//   const { GetObjectCommand } = await import('@aws-sdk/client-s3') ; const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
//   url = await getSignedUrl(client, new GetObjectCommand({ Bucket: config.s3.bucket, Key: scopedKey(prefix, relPath),
//     ResponseCacheControl: opts.responseCacheControl, ResponseContentType: opts.responseContentType }), { expiresIn: ttlSec, signingDate: new Date(signedAtMs) })
//   return { url, expiresAtMs: signedAtMs + ttlSec * 1000 }
// invariants : même (clé, fenêtre) ⇒ URL identique ; expiresAtMs − nowMs ∈ (ttl/2, ttl] s ; 0 x-amz-checksum ; 0 jeton portail
export function s3PublicOrigin(config: AppConfig): string | null;  // driver ≠ s3 ou !s3.endpoint → null ; forcePathStyle ? new URL(endpoint).origin : `${proto}//${bucket}.${host}`

// ═══ config.ts
// AppConfig : tilePresign: { enabled: boolean; ttlSec: number }
// loadConfig : tilePresign: { enabled: bool(env.TILE_PRESIGN_REDIRECT, false), ttlSec: intIn(env.TILE_PRESIGN_TTL_SEC, 300, 120, 3600) }

// ═══ logRedact.ts:7
export const SENSITIVE_QUERY_KEYS = ['token', 'x-amz-signature', 'x-amz-credential', 'x-amz-security-token'];   // insensible à la casse (déjà 'gi')

// ═══ api/src/tileRedirect.ts (NEUF, pur, 0 import runtime)
export const TILE_REDIRECT_EXT = /\.(b3dm|pnts|i3dm|cmpt|glb|bin|ktx2|jpe?g|png|webp)$/i;
export const TILE_OBJECT_CACHE = 'private, max-age=86400, immutable';   // = IMMUTABLE_CACHE server.ts:516
export function shouldRedirectTile(i: { enabled: boolean; method: string; hasRange: boolean; rel: string }): boolean;  // enabled && method === 'GET' && !hasRange && TILE_REDIRECT_EXT.test(rel)
export function redirectCacheControl(expiresAtMs: number, nowMs: number): string;  // s = Math.floor((exp − now) / 1000) − 30 ; s > 0 ? `private, max-age=${s}` : 'no-store'

// ═══ api/src/tileRateKey.ts (NEUF, pur, 0 DB) — import { verifyTileToken } from './storage.js' ; type AppConfig
export function tileRateKey(config: AppConfig, req: { params: unknown; query: unknown; ip: string }): string;
//   tok = typeof (req.query as {token?:unknown})?.token === 'string' ? token : undefined ; p = verifyTileToken(config, tok)
//   id = (req.params as {id?:unknown})?.id ; p && p.p === id ? `tu:${p.u}` : `ti:${req.ip}`
// existant storage.ts:53 : verifyTileToken(config, token: string | undefined): TileTokenPayload | null  // {p,u,exp}
```
Cas de test :
- presign-get : driver S3 avec identifiants factices (S3_ENDPOINT=https://s3.fr-par.scw.cloud, S3_REGION=fr-par, S3_BUCKET=geolens-tuiles, S3_FORCE_PATH_STYLE=0, clés bidon — 0 réseau) : host de l'URL `geolens-tuiles.s3.fr-par.scw.cloud` ; `X-Amz-Expires=300` ; contient `response-cache-control` ; URL(now) === URL(now + Bms − 1) ; URL(now + Bms) ≠ ; ∌ `checksum` ; relPath `../x` → StorageError ; s3PublicOrigin path-style / vhost / local → null ; driver local : `presignGet` undefined ; config ttl '60' → 300, '5000' → 300, '600' → 600 ; flag défaut false, '1' → true
- log-redact-s3 : `/x?X-Amz-Signature=abc&X-Amz-Credential=k%2F2026&a=1` → signature et credential `[redacted]`, `a=1` intact ; `token` toujours masqué
- tile-rate-key : jeton valide (signTileToken) avec params.id = p → `tu:<u>` ; HMAC faux / expiré / p ≠ id / absent → `ti:<ip>` ; shouldRedirectTile : GET .b3dm → true ; HEAD .b3dm → false ; GET + Range → false ; .json / project.json / .sog → false ; flag off → false ; redirectCacheControl(now+300 s, now) → 'private, max-age=270' ; (now+20 s) → 'no-store'

## Décisions actées
- D20 : 302 binaires GET sans Range, TTL 300 s quantifié ttl/2, flag défaut 0 ; quota par compte vérifié ; URL présignées jamais loggées
- 0 nouvelle dépendance (`@aws-sdk/s3-request-presigner` déjà présent, import dynamique comme :568)

## Hors périmètre
- server.ts (lot L4 suivant, seul éditeur) ; tileAuth.ts (T065 en parallèle) ; web, Caddyfile, .env (lot suivant)
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules (@aws-sdk/client-s3, s3-request-presigner) ; vitest + pg-mem ; `npm --prefix api test` ; typecheck (noUnusedLocals)
- G sous git, HEAD 120d0aa ; T065 crée api/src/tileAuth.ts + test en parallèle (fichiers disjoints)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T064
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
