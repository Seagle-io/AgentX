---
pack: T007
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T007 — Lot A : S3_PUBLIC_ENDPOINT, client de présignature

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter `S3_PUBLIC_ENDPOINT` à G : les URL présignées de tuile (`presignGet`) sont signées pour l'origine publique via un 2ᵉ client S3, le reste du S3 de l'API reste sur `S3_ENDPOINT` ; env absente → URL identique octet pour octet à avant.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `api/src/config.ts` : `AppConfig.s3.publicEndpoint` + `s3PublicEndpointOf()` exporté, selon contrat
- [ ] `api/src/storage.ts` : `s3ClientConfig()` extrait de :404-425 (options partagées, 0 divergence) ; `getPresignClient()` ; `presignGet` (:582) l'utilise ; `signUploadPart` (:574) INCHANGÉ ; `s3PublicOrigin` (:674) selon contrat
- [ ] `api/src/server.ts:2506` : log de boot selon contrat (1 ligne remplacée) ; `git -C G diff --stat -- api/src/server.ts` collé
- [ ] `.env.production.example` : 1 ligne commentée après `S3_FORCE_PATH_STYLE` (≈ :35)
- [ ] tests I1-I5 ajoutés (presign-get.test.ts et/ou config dans un test existant ou neuf `api/test/s3-public-endpoint.test.ts`) ; I1 compare l'URL presignGet avant/après à `nowMs` égal
- [ ] test : `signUploadPart` avec publicEndpoint défini → URL sur l'endpoint INTERNE (D8)
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 98 fichiers / 854 tests) ; synthèse collée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :75-95 AppConfig.s3, :245-265 loadConfig s3 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | E | :380-430 client, :570-600 sign/presign, :670-708 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :2500-2510 log de boot seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | 1 ligne |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/presign-get.test.ts` | E | I1-I3, I5 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/s3-public-endpoint.test.ts` | E | neuf si besoin, I4 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/presign-checksum.test.ts` | L | modèle signUploadPart |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp |

## Contrats
Verbatim architecte T004 (seul écart : signUploadPart hors périmètre, D8) :
```ts
// config.ts — AppConfig.s3 (:81-88), après endpoint
  /** Origine joignable par le NAVIGATEUR, cible des URL présignées de tuile (presignGet).
   *  Absent → endpoint (comportement actuel inchangé). */
  publicEndpoint: string | undefined;
// config.ts — valeur (:251-258), après endpoint
  publicEndpoint: s3PublicEndpointOf(env.S3_PUBLIC_ENDPOINT),
/** absent/blanc → undefined ; URL http(s) sans userinfo, chemin '/' seul, 0 query, 0 hash → u.origin ;
 *  sinon throw new Error('S3_PUBLIC_ENDPOINT invalide : origine http(s) sans chemin attendue (ex. http://82.65.97.67:34580)') */
export function s3PublicEndpointOf(raw: string | undefined): string | undefined;

// storage.ts — options extraites de :404-425, partagées par les 2 clients (0 divergence)
function s3ClientConfig(config: AppConfig, endpoint: string | undefined): import('@aws-sdk/client-s3').S3ClientConfig;
// createS3Driver : getClient() → new S3Client(s3ClientConfig(config, config.s3.endpoint)), sinon inchangé
let _presignClient: import('@aws-sdk/client-s3').S3Client | null = null;
/** publicEndpoint absent → getClient() (même singleton). Sinon singleton paresseux
 *  new S3Client(s3ClientConfig(config, config.s3.publicEndpoint)) ; jamais clientFactory ; 0 I/O. */
const getPresignClient: () => Promise<import('@aws-sdk/client-s3').S3Client>;
// presignGet (:582) : client → await getPresignClient(). signUploadPart (:574) : inchangé.

// storage.ts:674
export function s3PublicOrigin(config: AppConfig): string | null {
  const ep = config.s3.publicEndpoint ?? config.s3.endpoint;
  if (config.storageDriver !== 's3' || !ep) return null;
  const u = new URL(ep);
  return config.s3.forcePathStyle ? u.origin : `${u.protocol}//${config.s3.bucket}.${u.host}`;
}
// server.ts:2506 (remplace la ligne actuelle :
//   if (config.tilePresign.enabled) app.log.info({ origin: s3PublicOrigin(config) }, 'tile presign ON — origine requise CSP viewer + CORS bucket');)
if (config.tilePresign.enabled) { const origin = s3PublicOrigin(config);
  app.log.info({ origin, sameOrigin: origin === new URL(config.webOrigin).origin },
    'tile presign ON — sameOrigin=false ⇒ origine requise CSP viewer + CORS bucket'); }
```
Tests :
- I1 env absent → URL presignGet identique octet/octet à avant (même nowMs)
- I2 endpoint `http://minio:9000` + public `http://82.65.97.67:34580` + pathStyle → URL commence par `http://82.65.97.67:34580/<B>/<prefix>/<rel>?` et contient `X-Amz-SignedHeaders=host`
- I3 get/put/list/probe/multipart serveur → client `endpoint` (clientFactory) ; presignGet → jamais clientFactory
- I4 `s3PublicEndpointOf` : `'http://h:34580/'`→`'http://h:34580'` · `'  '`→undefined · undefined→undefined · `'http://h/x'` `'ftp://h'` `'http://u:p@h'` `'http://h?a=1'` `'http://h#x'` → throw
- I5 `s3PublicOrigin` : avec public + pathStyle → `'http://82.65.97.67:34580'` ; sans → valeur actuelle
`.env.production.example` (après S3_FORCE_PATH_STYLE) :
```
# S3_PUBLIC_ENDPOINT=   # vide Scaleway ; MinIO derrière Caddy même origine : = WEB_ORIGIN
```

## Décisions actées
- MinIO test servi même origine via Caddy, présignature sur l'origine publique — D5
- signUploadPart reste sur le client interne — D8
- défaut = comportement Scaleway inchangé octet pour octet — D5
- `process.env` lu seulement dans config.ts

## Hors périmètre
- route tuile :733-830, tileMetrics.ts (T006, commité) ; 304 / tileEtag (D7 reporté)
- Caddyfile, docker-compose*.yml, web/viewer.html, web/src/viewer/index.html : 0 édition (étapes humaines)
- serveur de test : 0 ssh
- web/, tools/, fichiers sales de web/ (mission D24)
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; pg-mem ; @aws-sdk/client-s3 + s3-request-presigner (import dynamique storage.ts:576,584)
- HEAD G = 038120d (T006) ; base api 98 fichiers / 854 tests verts
- `npm --prefix api test` · `npm --prefix api run typecheck`
- un vérificateur lance les tests d'un worktree séparé (`AgentX/.cache/wt-charge3d-T006`) : ne pas y toucher
- règles G : fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`
- DoD périmètre : `git -C G status --short -- api/ .env.production.example`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T007
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
