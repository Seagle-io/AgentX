---
pack: T021
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T021 — Présignature GET SigV4 directe, identique au SDK

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer, dans `presignGet` du driver S3, l'appel `getSignedUrl` du SDK (554 µs CPU/appel) par une présignature SigV4 query-string directe (node:crypto) produisant la MÊME URL octet pour octet ; repli SDK pour tout cas non couvert ; interrupteur `S3_PRESIGN_SDK=1`.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `api/src/s3Presign.ts` créé selon le contrat ; 0 dépendance hors `node:crypto` ; ≤ 120 l ; clé de signature mémoïsée par (secret, date AAAAMMJJ, région) — bornée (≤ 8 entrées)
- [ ] storage.ts presignGet (:598-612) : chemin rapide si `presignGetV4` ≠ null, sinon code SDK actuel inchangé ; quantification ttl/2 et `expiresAtMs` inchangés ; `scopedKey` toujours appliqué
- [ ] config : `s3.presignSdk: boolean` = `bool(env.S3_PRESIGN_SDK, false)` ; true → toujours SDK ; `.env.production.example` : 1 ligne commentée sous :38
- [ ] `api/test/s3-presign.test.ts` : ÉGALITÉ STRICTE `presignGetV4(...) === await getSignedUrl(sdk…)` (même signingDate) sur ≥ 24 cas : {Scaleway https DNS vhost, Scaleway path-style, MinIO public `http://82.65.97.67:34580` path-style, MinIO vhost sur IP (SDK repasse en path), `http://minio:9000`, `http://[::1]:9000`} × clés {simple, espace, `é`, `+`, `~`, `*`, `(1)`, `%41`, `a b/c d.b3dm`} × régions {fr-par, us-east-1} (combinaisons, pas forcément produit complet) + response-cache-control/content-type réels de la route
- [ ] cas non couverts → null testés : endpoint absent, credentials absents, bucket avec `.` en vhost, bucket non DNS (majuscules/underscore) en vhost ; `S3_PRESIGN_SDK=1` → URL via SDK (spy ou absence d'appel à presignGetV4)
- [ ] tests existants presign-get.test.ts (I1-I5, quantification) verts SANS modification
- [ ] micro-bench dans le test (log, pas assertion dure) : µs/op presignGetV4 vs getSignedUrl sur 2 000 ops → valeurs collées
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 100 fichiers / 894 tests) ; synthèses collées
- [ ] `git -C G status --short -- api/ .env.production.example` → seulement les fichiers WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/s3Presign.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | E | :384-445 clients, :596-612 presignGet |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :88-100 AppConfig.s3, :275-290 loadConfig s3 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :38 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/s3-presign.test.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/presign-get.test.ts` | L | modèle S3_ENV, opts, I1 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/node_modules/@aws-sdk/s3-request-presigner/dist-types/getSignedUrl.d.ts` | L | signature getSignedUrl |

## Contrats
```ts
// s3Presign.ts — cible
export interface SigV4GetInput {
  endpoint: string | undefined;      // config.s3.publicEndpoint ?? config.s3.endpoint
  region: string; bucket: string; key: string; forcePathStyle: boolean;
  accessKeyId: string | undefined; secretAccessKey: string | undefined;
  signedAtMs: number; expiresInSec: number;
  responseCacheControl?: string; responseContentType?: string;
}
/** URL GET présignée SigV4 (UNSIGNED-PAYLOAD, SignedHeaders=host) = sortie de getSignedUrl(GetObjectCommand) octet pour octet ; cas non couvert → null (l'appelant passe au SDK). */
export function presignGetV4(i: SigV4GetInput): string | null;
```
```ts
// storage.ts:598-612 actuel
    async presignGet(prefix, relPath, opts) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const client = await getPresignClient();
      const Bms = Math.floor(opts.ttlSec / 2) * 1000;
      const signedAtMs = Math.floor(opts.nowMs / Bms) * Bms;
      const url = await getSignedUrl(client, new GetObjectCommand({
        Bucket: config.s3.bucket, Key: scopedKey(prefix, relPath),
        ResponseCacheControl: opts.responseCacheControl, ResponseContentType: opts.responseContentType,
      }), { expiresIn: opts.ttlSec, signingDate: new Date(signedAtMs) });
      return { url, expiresAtMs: signedAtMs + opts.ttlSec * 1000 };
    },
// s3ClientConfig(config, endpoint) : { endpoint, region, forcePathStyle, maxAttempts: 4, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', credentials }
// AppConfig.s3 : { endpoint?, publicEndpoint?, region, bucket, forcePathStyle, accessKeyId?, secretAccessKey? }
```
Constat T009 : endpoint IP + vhost → le SDK signe en path-style (`http://82.65.97.67:34580/geolens-tuiles/…`). Le SDK ajoute `x-id=GetObject` : à reproduire tel quel (ordre et encodage = ceux du SDK, découverts par le test d'égalité).

## Décisions actées
- D20 : chemin rapide + repli SDK + `S3_PRESIGN_SDK=1` ; égalité octet pour octet = seul critère de justesse
- signUploadPart et toutes les opérations serveur restent SDK (D8)
- pas de cache d'URL, pas de N process dans ce lot

## Hors périmètre
- server.ts, route tuile, tileRedirect.ts, tileGrantCache.ts, k6
- tests existants : 0 modification
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; @aws-sdk/client-s3 + s3-request-presigner installés (import dynamique) ; HEAD G = 0e04b46 ; base 100 fichiers / 894 tests
- SigV4 query : canonical request = `GET\n<uri encodée>\n<query triée encodée>\nhost:<host>\n\nhost\nUNSIGNED-PAYLOAD` ; scope `<AAAAMMJJ>/<région>/s3/aws4_request`
- arbre G sale hors api/ (web/…, RAPPORT_*) : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T021
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
