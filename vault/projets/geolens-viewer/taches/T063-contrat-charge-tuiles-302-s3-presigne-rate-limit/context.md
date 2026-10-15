---
pack: T063
projet: geolens-viewer
role: architecte
cree: 2026-10-08
---

# Pack T063 — Contrat charge tuiles : 302 S3 présigné, rate-limit par compte, Caddy sans encode tuiles, 1 SELECT/tuile

> Seule source de vérité de l'agent T063. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire dans `result.md` les contrats exécutables pour que 10-30 comptes ouvrent le même modèle 3D sans saturer l'API : (B) redirection 302 des tuiles vers une URL S3 présignée courte (driver S3 seulement), (D) clé de rate-limit des tuiles par utilisateur vérifié, (C) tuiles exclues de `encode` Caddy, (Q) auth tuile en 1 SELECT au lieu de 2 sans affaiblir la révocation immédiate (D6) ; + CSP/CORS induits, ordre d'édition et tests. 0 code de prod. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] B : signature d'une méthode presign GET dans l'interface StorageDriver (local → `null` = stream inchangé) ; route storage (server.ts:729-800) : ordre exact jeton → auth → 302 `Location` ; TTL présigné (secondes, config) ; `Cache-Control` de la 302 (le navigateur peut-il la réutiliser sans revenir à l'API ? borne < TTL) ; cas exclus du 302 (project.json no-store, Range ? petites tuiles ? HEAD) ; ETag/304 : conservé avant le 302 ou supprimé — trancher
- [ ] B sécurité : effet sur T009 (jeton limité à l'origine API — l'URL S3 est une autre origine, sans jeton portail) ; durée de lecture après révocation (= TTL) ; journaux (l'URL présignée ne doit jamais être loggée : vérifier logRedact)
- [ ] B navigateur : CSP viewer (`connect-src`, `img-src` pour textures) — origine(s) S3 exactes à ajouter dans la meta (statique : viewer.html:12 = src/viewer/index.html:12) et éventuellement Caddyfile ; CORS du bucket (règle exacte à poser par l'humain : origines, méthodes, en-têtes exposés) ; fetch de 3d-tiles-renderer suit-il une 302 cross-origin (mode cors, credentials) ?
- [ ] D : `keyGenerator` de la route tuile : clé = `u` du jeton APRÈS vérification HMAC (fallback req.ip si jeton invalide) ; plafond par compte (valeur) ; 304 compté ou non
- [ ] C : Caddyfile : `encode` restreint (matcher exact excluant `/api/projects/*/storage/*` ou par Content-Type) — bloc verbatim
- [ ] Q : une requête SQL unique (users ⋈ organizations ⋈ projects [⋈ project_access/project_orgs]) qui rend exactement la même décision que resolveActiveUser + getAccessibleProject (lister les cas : désactivé, pending, org suspendue, projet d'une autre org partagé via project_orgs, accès membre via project_access, admin plateforme cross-org) — ou trancher que ce n'est pas rentable (justifier par la mesure T062 : 2 SELECT ~ ? ms)
- [ ] ordre d'édition server.ts + lots parallélisables ; tests nommés par lot ; mesure de contrôle (même protocole que T062, K=1/10/50 + 2 comptes derrière une IP)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule sur G. Écriture : result.md seul.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :260-280 resolveSignedProject, :500-530 jeton/ETag, :720-800 route storage |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | StorageDriver :115-135, local :205-240, S3 :380-420, :560-610 presign/GetObject |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | loadUserAccessState, checkUserAccess |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject :87-121 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | rateLimitTileMax, s3, AppConfig |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | L | masquage des URL loggées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | encode, en-têtes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | meta CSP :12 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | makeSignUrl (T009) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | fetch des tuiles, :280-340 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_FORCE_PATH_STYLE |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/taches/T062-reco-charge-tuiles-n-comptes-sur-un-meme-modele-/result.md` | L | chemin, mesures, leviers |

## Contrats
```
faits T062 (coordonnées au 2026-10-08, HEAD 120d0aa) :
- jeton tuile {p,u,exp} HMAC (storage.ts:44-51), URL stable 4 h par user ; vérif server.ts:736 (0 DB)
- auth tuile : resolveSignedProject server.ts:270-274 = loadUserAccessState (session.ts:19, users⋈organizations) + getAccessibleProject (tenancy.ts:87) → 2 SELECT/tuile, 304 compris
- ETag sha1(prefix/rel) server.ts:516-523,752 ; 304 avant stockage, après les 2 SELECT ; Cache-Control 'private, max-age=86400, immutable' :782
- rate-limit tuile server.ts:734 max=rateLimitTileMax (5000/min, clé req.ip) ; Villelaure ≈ 2500 req/chargement ; 304 comptés
- S3 : GetObject stream storage.ts:601 ; client singleton :391-420 ; getSignedUrl déjà importé dynamiquement :568-572 (UploadPart seulement)
- local : existsSync/statSync sync + createReadStream storage.ts:215-229
- Caddyfile:5 `encode zstd gzip` global ; .b3dm/.pnts = application/octet-stream, .glb = model/gltf-binary
- mesures loopback : K=50 → 972 req/s p95 94 ms ; fichier 10,8 Mo K=50 → p95 1047 ms, 628 Mo/s ; 304 seul 1290 req/s
- CSP viewer actuelle : default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'
```

## Décisions actées
- D19 : cible 10-30 comptes ; levier principal 302 S3 présigné ; CDN plus tard ; lecture possible pendant le TTL après révocation = accepté
- D6 : révocation immédiate côté API conservée (0 cache d'auth, 0 jeton partagé entre comptes)
- 0 nouvelle dépendance npm ; logique en modules neufs, server.ts = appels
- CORS du bucket et éventuelle config console = action humaine (le contrat donne la règle exacte)

## Hors périmètre
- CDN, cache partagé Caddy, jeton par projet (leviers a/f écartés) ; écrire du code
- push, remote, PR, commit

## Environnement
- prod : 1 service api, Caddy devant, Scaleway Object Storage (fr-par) ; dev/tests : stockage local + pg-mem
- suite api 90 fichiers / 772 tests verts ; G sous git HEAD 120d0aa

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep (sur les dossiers api/src, web/src du dépôt), WebSearch (CORS Scaleway Object Storage, presign + redirect, comportement fetch/3d-tiles-renderer), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T063
statut: fait | bloque
---
## Décisions
- choix — raison ≤ 8 mots — option écartée
## Contrats
```
B · D · C · Q · CSP · CORS (règle humaine) — signatures, config, blocs verbatim
```
## Ordre et lots
| lot | fichiers | dépend de | parallèle avec |
## Tests par lot
- lot · fichier · cas
## Mesure de contrôle
- protocole exact (commande, K, critère de succès chiffré)
## Vérifié comment
- lecture chemin:L → fait
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
