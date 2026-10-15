---
pack: T004
projet: geolens-charge-3d
role: architecte
cree: 2026-10-12
---

# Pack T004 — Contrat : exposer MinIO du serveur de test pour le 302

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher comment le navigateur (et k6) suit un 302 de tuile vers le MinIO du serveur de test, puis écrire le contrat de config/code dans `result.md` (Caddy, compose, env, presign, CSP, CORS) → activation `TILE_PRESIGN_REDIRECT=1`, `TILE_PRESIGN_TTL_SEC=3600` ; 0 édition.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] problème d'hôte tranché : le client S3 de l'API signe pour `S3_ENDPOINT` (interne `http://minio:9000` ?) ; l'URL présignée doit être joignable par le navigateur ET valide en SigV4 (Host + chemin signés) → solution retenue + rejetées (1 ligne chacune)
- [ ] options à comparer au minimum : (a) même origine — Caddy route `/<bucket>/*` path-style vers `minio:9000` en gardant Host, presign signé pour l'origine publique `http://82.65.97.67:34580` → 0 CSP, 0 CORS ? collisions de chemin avec `/api/*`, `/viewer.html`, assets ; (b) port dédié (ex. 34581) → redirection de port sur la box = action humaine, CSP + CORS ; (c) autre
- [ ] code : faut-il un 2ᵉ endpoint de présignature (ex. `S3_PUBLIC_ENDPOINT` lu dans config.ts) ou un 2ᵉ client S3 ? signature verbatim, défaut = comportement actuel inchangé (Scaleway), effet sur `s3PublicOrigin` (storage.ts:674) et la CSP
- [ ] diff exact Caddyfile (bloc test, pas `portail.geolens.fr`) + variables `.env` du serveur à ajouter (noms + valeurs, sans secret) + CSP `web/viewer.html:13` et `web/src/viewer/index.html:13` (identiques)
- [ ] CORS MinIO : nécessaire ou non selon option ; si oui commande `mc` exacte (humain)
- [ ] k6 dans le réseau docker (`BASE_URL=http://api:4000`) suit-il la `Location` publique ? (hairpin NAT) → parade
- [ ] sécurité : MinIO exposé n'ouvre ni ListBucket anonyme ni console :9001 ; URL présignée jamais loguée (logRedact déjà OK)
- [ ] découpage : lots d'implémentation (fichiers E, ≤ 12) + étapes humaines numérotées sur le serveur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (seul `result.md` écrit).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | :390-420 client S3, :560-600 presign, :660-708 s3PublicOrigin |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | :80-95 type s3, :215-265 TILE_*, S3_* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRedirect.ts` | L | règles du 302 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | 41 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.prod.yml` | L | 80 l, minio :25-50 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | S3_*, TILE_PRESIGN_* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | :1-20 CSP |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/DEPLOYMENT.md` | L | :140-180 CORS |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-k6/Makefile` | L | réseau docker k6, BASE_URL |

## Contrats
```
config.ts:223  tilePresign: { enabled: bool(env.TILE_PRESIGN_REDIRECT, false), ttlSec: intIn(env.TILE_PRESIGN_TTL_SEC, 300, 120, 3600) },
config.ts:252  endpoint: env.S3_ENDPOINT?.trim() || undefined,
config.ts:257  forcePathStyle: bool(env.S3_FORCE_PATH_STYLE, true),
storage.ts:168 presignGet?(prefix: string, relPath: string, opts: PresignGetOptions): Promise<PresignedGet | null>;
storage.ts:582 async presignGet(prefix, relPath, opts) { … getSignedUrl(client, new GetObjectCommand({…}), { expiresIn }) }  // signature quantifiée ttl/2
storage.ts:674 export function s3PublicOrigin(config: AppConfig): string | null  // path-style → endpoint.origin, sinon bucket.host
tileRedirect.ts:12-22 shouldRedirectTile : GET, sans Range, ext ∈ b3dm pnts i3dm cmpt glb bin ktx2 jpg png webp
302 : Cache-Control private, max-age=reste−30 ; Referrer-Policy: no-referrer
CSP viewer.html:13 : img-src … https://bucket-a-remplacer.s3.fr-par.scw.cloud ; connect-src 'self' blob: data: https://bucket-a-remplacer.s3.fr-par.scw.cloud
Caddyfile:34-39 : handle /api/* { reverse_proxy api:4000 } ; handle { reverse_proxy web:80 }
```
Serveur de test : portail `http://82.65.97.67:34580` (http, pas de nom de domaine) ; ssh :34522 ; compose `docker-compose.prod.yml` (copie plus ancienne que G, sans git) ; services api, web, caddy, db, minio ; minio ≈ 29 Go ; k6 = conteneurs `grafana/k6:0.54.0` sur réseau `geolens-web_default`.

## Décisions actées
- 302 testé sur MinIO du serveur de test, pas Scaleway — D1
- TTL présigné cible 3600 s (carte 1.1)
- CSP : origine exacte, 0 wildcard — D20 geolens-viewer
- défaut du code = comportement Scaleway inchangé (flag off)

## Hors périmètre
- serveur de test : 0 ssh, 0 commande (étapes humaines seulement, écrites)
- toute édition de G, tout commit
- bucket Scaleway, CDN, route tuile côté auth/304 (T002)

## Environnement
- @aws-sdk/s3-request-presigner (import dynamique storage.ts:584) ; SigV4 signe Host + chemin
- `node scripts/check-viewer-html-sync.mjs` impose CSP identique viewer.html ↔ src/viewer/index.html

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg:*, wc:*), Write (result.md seul)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- option retenue + rejetées · contrat code · diff Caddy · env · CSP · CORS · k6 · sécurité · lots · étapes humaines
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
