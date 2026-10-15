---
tache: T004
statut: fait
---
## Livré
Contrainte qui décide : SigV4 signe `host` ; Caddy transmet Host inchangé → signer pour l'origine que le navigateur appelle.
- (a) RETENU même origine : Caddy `GET /<B>/*?X-Amz-Signature` → `minio:9000` ; 2ᵉ client de présignature `S3_PUBLIC_ENDPOINT` → 0 CSP, 0 CORS, 0 box
- (b) écarté port 34581 : box humaine, CSP test dans viewer.html prod, CORS, MinIO entier exposé
- (c) écarté signer `minio:9000` + réécrire origine + `header_up Host` : chirurgie d'URL signée
- (bête) écarté `S3_ENDPOINT=http://82.65.97.67:34580`, 0 code : tout S3 API via hairpin ; KO → stockage cassé
- coût : 3 fichiers API + 1 bloc Caddy test · 1 an : 1 env optionnelle inerte · interdit : route portail `/<B>/*` sur test
- non-retour : nom `S3_PUBLIC_ENDPOINT` (AppConfig + .env serveurs) ; `/<B>/*` réservé sur l'origine test

### Contrat lot A (G)
```ts
// config.ts — AppConfig.s3 (:81-88), après endpoint
  /** Origine joignable par le NAVIGATEUR, cible de toute URL présignée remise au client
   *  (presignGet, signUploadPart). Absent → endpoint (comportement actuel inchangé). */
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
// presignGet (:585) + signUploadPart (:577) : client → await getPresignClient(). Rien d'autre.

// storage.ts:674
export function s3PublicOrigin(config: AppConfig): string | null {
  const ep = config.s3.publicEndpoint ?? config.s3.endpoint;
  if (config.storageDriver !== 's3' || !ep) return null;
  const u = new URL(ep);
  return config.s3.forcePathStyle ? u.origin : `${u.protocol}//${config.s3.bucket}.${u.host}`;
}
// server.ts:2503
if (config.tilePresign.enabled) { const origin = s3PublicOrigin(config);
  app.log.info({ origin, sameOrigin: origin === new URL(config.webOrigin).origin },
    'tile presign ON — sameOrigin=false ⇒ origine requise CSP viewer + CORS bucket'); }
```
- I1 env absent → URL presignGet identique octet/octet à avant (même nowMs)
- I2 endpoint `http://minio:9000` + public `http://82.65.97.67:34580` + pathStyle → URL `http://82.65.97.67:34580/<B>/<prefix>/<rel>?…X-Amz-SignedHeaders=host…`
- I3 get/put/list/probe/multipart serveur → client `endpoint` (clientFactory) ; presign → jamais clientFactory
- I4 `s3PublicEndpointOf` : `'http://h:34580/'`→`'http://h:34580'` · `'  '`→undefined · `'http://h/x'` `'ftp://h'` `'http://u:p@h'` `'http://h?a=1'` → throw
- I5 `s3PublicOrigin` : avec public → `'http://82.65.97.67:34580'` ; sans → valeur actuelle
- erreurs : boot throw (env invalide) ; StorageError `invalid_path` inchangé (scopedKey avant signature)
- `.env.production.example` après :35 : `# S3_PUBLIC_ENDPOINT=   # vide Scaleway ; MinIO derrière Caddy même origine : = WEB_ORIGIN`

### Caddy — serveur de test seul (G/Caddyfile `portail.geolens.fr` inchangé)
Dans le bloc site servant :34580, avant `handle /api/*` ; `<B>` = `S3_BUCKET` du `.env` (défaut compose `geolens`) :
```caddyfile
    # T004 — GET présignés MinIO même origine. Host transmis INCHANGÉ = host signé.
    @s3_presigne {
        method GET
        path /<B>/*
        query X-Amz-Signature=*
    }
    handle @s3_presigne {
        reverse_proxy minio:9000 {
            header_up -Cookie
            header_up -Authorization
        }
    }
    @s3_autre path /<B> /<B>/*
    handle @s3_autre {
        respond 403
    }
```
- interdit : `header_up Host …`, `uri strip_prefix`, préfixe devant `/<B>` → chemin/host signés ≠ reçus → 403
- ordre : `handle` nommés gardent l'ordre écrit ; `/api/*` disjoint ; `handle {}` catch-all reste dernier

### Env serveur de test (ajouts, 0 secret)
```dotenv
S3_FORCE_PATH_STYLE=1                        # requis ; vhost <B>.82.65.97.67 impossible
S3_PUBLIC_ENDPOINT=http://82.65.97.67:34580  # = WEB_ORIGIN ; S3_ENDPOINT reste http://minio:9000
TILE_PRESIGN_REDIRECT=1
TILE_PRESIGN_TTL_SEC=3600
```
- CSP : 0 changement — 302 + cible même origine → `'self'` couvre img-src/connect-src ; viewer.html:13 ≡ src/viewer/index.html:13 intacts
- CORS : 0 — même origine, tainting basic ; 0 commande `mc`
- k6 : Location `http://82.65.97.67:34580/<B>/…` suivie nativement (maxRedirects 10) depuis `geolens-web_default` → hairpin box NV → H9
- k6 parade si H9 KO (lot B) : env `TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580` `TILE_ORIGIN_INTERNAL=http://caddy:80` ; tuiles `redirects: 0` ; 302 → GET `INTERNAL + loc.slice(PUBLIC.length)` headers `{ Host: '82.65.97.67:34580' }` ; tags `name` `tile-302`/`tile-s3` ; compteur `tile_302` ; vides → suivi natif
- sécurité : minio 0 `ports:` (compose:25-37) + Caddy → :9000 seul → console :9001 injoignable
- sécurité : sans signature → 403 Caddy ; signature bidon → 403 MinIO ; bucket privé (minio-init 0 `mc anonymous`) ; méthode ≠ GET → 403
- sécurité : clés .env = clés de signature ; défaut compose `geolens123` (compose:30) → toute personne présigne tout le bucket → H1 BLQ
- sécurité : API logRedact OK (pack) ; Caddy sans `log` → 0 URI signée journalisée ; Cookie/Authorization retirés vers MinIO
- lot A (implementeur, G) E : api/src/config.ts · api/src/storage.ts · api/src/server.ts · .env.production.example · tests storage/config existants (chemins NV)
- lot B (implementeur, si H9 KO) E : AgentX/.cache/geolens-k6/viewer-navigation.js · Makefile (`-e TILE_ORIGIN_PUBLIC=… -e TILE_ORIGIN_INTERNAL=…`)
- 0 édition : G/Caddyfile · docker-compose.prod.yml · viewer.html · src/viewer/index.html

### Étapes humaines (serveur de test, dossier du compose)
- H0 `grep -nE '\{$|handle|log' Caddyfile` → bloc site :34580, 0 `log` ; `grep -E '^(S3_BUCKET|S3_ENDPOINT|S3_FORCE_PATH_STYLE|WEB_ORIGIN|STORAGE_DRIVER)=' .env` → noter `<B>`
- H1 `grep -cE '^S3_SECRET_KEY=.+' .env` → 1 ET `grep -c '^S3_SECRET_KEY=geolens123$' .env` → 0 ; sinon STOP
- H2 `curl -s -o /dev/null -w '%{http_code}\n' http://82.65.97.67:34580/<B>/x` → noter ; portail avec route `/<B>/…` → STOP
- H3 `cp Caddyfile Caddyfile.avant-T004` ; insérer bloc ; `docker compose -f docker-compose.prod.yml restart caddy` (bind-mount fichier : inode changé ⇒ reload aveugle) ; `docker compose -f docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` → `Valid configuration`
- H4 `/<B>/` → 403 · `/<B>/?list-type=2` → 403 · `curl -X PUT '…/<B>/x?X-Amz-Signature=x'` → 403 · `curl -m5 http://82.65.97.67:9001` → échec · `docker compose -f docker-compose.prod.yml ps minio` → 0 port
- H5 copier `api/` de G ; AVANT build : migrations G ≠ serveur → STOP (BDD test intouchable, migrate() au boot)
- H6 ajouter env ; `docker compose -f docker-compose.prod.yml up -d --build api` (`restart` ne relit pas env_file)
- H7 `docker compose -f docker-compose.prod.yml logs api | grep 'tile presign ON'` → `"origin":"http://82.65.97.67:34580"` + `"sameOrigin":true`
- H8 navigateur, DevTools Network : tuile `/api/…b3dm` → 302 → `/<B>/…` → 200 ; 0 violation CSP ; 0 URL signée collée au vault
- H9 `docker run --rm --network geolens-web_default curlimages/curl -s -o /dev/null -w '%{http_code}\n' -m 5 http://82.65.97.67:34580/` → 200 ⇒ k6 natif ; timeout ⇒ lot B
- H10 retour : `TILE_PRESIGN_REDIRECT=0` + H6 ; `cp Caddyfile.avant-T004 Caddyfile` + restart caddy

### Décision (à appendre decisions.md — pack : 0 droit E)
```markdown
## 2026-10-12 — 302 tuiles test : MinIO même origine via Caddy + S3_PUBLIC_ENDPOINT
- **Contexte** : SigV4 signe host ; URL présignée valide ssi host signé = host reçu par MinIO.
- **Choix** : Caddy test `GET /<B>/*?X-Amz-Signature` → minio:9000 Host inchangé ; 2ᵉ client S3 de présignature sur `S3_PUBLIC_ENDPOINT`.
- **Écarté** : port dédié (box + CSP/CORS test en prod) ; réécriture d'URL signée (fragile) ; S3_ENDPOINT public (hairpin pour tout S3).
- **Conséquence** : 0 CSP/CORS ; défaut inerte ; `/<B>/*` réservé sur l'origine test ; UploadPart direct non routé (GET seul).
- **À revoir si** : test passe en HTTPS/nom de domaine, ou portail utilise une route `/<B>/…`.
```

## Vérifié comment
- `Grep s3PublicOrigin|presignGet\(|S3_PUBLIC|s3\.endpoint api/src` → `storage.ts:405 endpoint: config.s3.endpoint,` · `storage.ts:582 async presignGet` · `storage.ts:674-676` · `server.ts:66 contentTypeFor, s3PublicOrigin,` · `server.ts:766 await app.storage.presignGet(` · `server.ts:2503 if (config.tilePresign.enabled) app.log.info({ origin: s3PublicOrigin(config) }, …)` ; `S3_PUBLIC` ∅
- `Grep CORS|cors|mc |PRESIGN DEPLOYMENT.md` → `159:(…) **CORS** restreint à WEB_ORIGIN` seul
- NV — Caddy `query X-Amz-Signature=*`, validité SigV4 bout en bout, override `Host` k6, hairpin box : 0 accès serveur (hors périmètre) → H3/H8/H9
- NV — Caddyfile réel du test (adresse du site, `log`) : copie serveur hors WL → H0

## Écarts
- ∅ lecture hors WL ; 2 Grep dans G (`api/src`, `DEPLOYMENT.md`)
- decisions.md non écrit : pack « seul result.md écrit » ≠ consigne rôle → bloc ci-dessus pour le chef

## Pour la suite
- choix : même origine ; Caddy test `GET /<B>/*?X-Amz-Signature` → `minio:9000`, Host inchangé ; API signe via 2ᵉ client `S3_PUBLIC_ENDPOINT=http://82.65.97.67:34580`
- interdit : `header_up Host`, strip/préfixe devant `/<B>`, origine test dans CSP viewer.html (prod partagée)
- interdit : presign via clientFactory ou S3_ENDPOINT public ; get/list/put/probe restent sur `S3_ENDPOINT` interne
- lot A = config.ts · storage.ts · server.ts:2503 · .env.production.example + tests I1-I5 ; lot B (k6) seulement si H9 KO
- BLQ humains avant activation : H1 S3_SECRET_KEY ≠ défaut ; H5 0 migration nouvelle avant rebuild api

## Retour sur le pack
- Manquait: Caddyfile réel du test (site, `log`) · S3_BUCKET/S3_SECRET_KEY du test défaut ou non · chemin decisions.md + droit E · chemins des tests storage/config · état du code API déployé sur test (presign présent ?)
- Inutile: DEPLOYMENT.md (:140-180 sans CORS)
