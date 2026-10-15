---
pack: T009
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-12
---

# Pack T009 — Casser lot A : présignature sur S3_PUBLIC_ENDPOINT

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer le lot A (commit 77ecdcd : `S3_PUBLIC_ENDPOINT` + client de présignature) dans le worktree figé W ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007` (worktree détaché sur 77ecdcd, `api/node_modules` = lien vers G)

## Definition of Done
- [ ] base : `npm --prefix api run typecheck` et `npm --prefix api test` dans W → synthèses collées (attendu 99 fichiers / 869 tests)
- [ ] non-régression Scaleway : env sans `S3_PUBLIC_ENDPOINT`, vhost (`S3_FORCE_PATH_STYLE=0`) et path-style → URL presignGet identique octet pour octet à celle du commit d2a7eab (calculer la référence en important `storage.ts` de d2a7eab via `git -C W show d2a7eab:api/src/storage.ts` dans un fichier temporaire sous `W/api/test/`)
- [ ] I2 : public `http://82.65.97.67:34580` + endpoint `http://minio:9000` → host signé = `82.65.97.67:34580`, chemin `/<B>/<prefix>/<rel>`, `X-Amz-SignedHeaders=host` seul ; vérifier qu'aucun en-tête autre que host n'est signé (sinon le navigateur ne peut pas le reproduire)
- [ ] séparation : get/put/list/probe/multipart/signUploadPart → jamais le client public ; presignGet → jamais clientFactory ; 2 drivers / 2 configs → pas de singleton partagé à tort (`_presignClient` au niveau module ou par driver ?)
- [ ] `s3PublicEndpointOf` : entrées hostiles (`http://h:34580/?`, `HTTP://H`, `http://h:0`, IPv6 `http://[::1]:9000`, espaces, `javascript:`, `http://h:34580//`) → origine ou throw cohérent avec le contrat
- [ ] boot : `S3_PUBLIC_ENDPOINT` invalide → `loadConfig` throw avec le message du contrat ; `tilePresign.enabled` → log `{ origin, sameOrigin }` exact (sameOrigin true si public = WEB_ORIGIN)
- [ ] fuite : URL présignée ou clés jamais loguées (`logRedact` x-amz-*) dans le log de boot et le warn `tile presign failed`
- [ ] verdict + reproductions ; tests de casse écrits UNIQUEMENT sous `W/api/test/verif-t009-*.test.ts`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/src/storage.ts` | L | :380-445 clients, :590-610 presign, :685-695 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/src/config.ts` | L | :80-90, :195-215, :265-280 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/src/server.ts` | L | :2500-2510 log de boot |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/src/logRedact.ts` | L | masquage x-amz-* |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/test/presign-get.test.ts` | L | I1-I3, I5 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/test/s3-public-endpoint.test.ts` | L | I4 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/.env.production.example` | L | :30-37 |

## Contrats
```ts
// config.ts
publicEndpoint: string | undefined;   // AppConfig.s3, après endpoint
publicEndpoint: s3PublicEndpointOf(env.S3_PUBLIC_ENDPOINT),
/** absent/blanc → undefined ; URL http(s) sans userinfo, chemin '/' seul, 0 query, 0 hash → u.origin ;
 *  sinon throw new Error('S3_PUBLIC_ENDPOINT invalide : origine http(s) sans chemin attendue (ex. http://82.65.97.67:34580)') */
export function s3PublicEndpointOf(raw: string | undefined): string | undefined;
// storage.ts
function s3ClientConfig(config: AppConfig, endpoint: string | undefined): S3ClientConfig; // options partagées, 0 divergence
/** publicEndpoint absent → getClient() (même singleton). Sinon singleton paresseux
 *  new S3Client(s3ClientConfig(config, config.s3.publicEndpoint)) ; jamais clientFactory ; 0 I/O. */
const getPresignClient: () => Promise<S3Client>;
// presignGet → getPresignClient() ; signUploadPart → getClient() (inchangé, D8)
export function s3PublicOrigin(config: AppConfig): string | null {
  const ep = config.s3.publicEndpoint ?? config.s3.endpoint;
  if (config.storageDriver !== 's3' || !ep) return null;
  const u = new URL(ep);
  return config.s3.forcePathStyle ? u.origin : `${u.protocol}//${config.s3.bucket}.${u.host}`;
}
// server.ts:2506
if (config.tilePresign.enabled) { const origin = s3PublicOrigin(config);
  app.log.info({ origin, sameOrigin: origin === new URL(config.webOrigin).origin }, 'tile presign ON — …'); }
```
Usage cible (serveur de test) : Caddy route `GET /<B>/*` signé → minio:9000 en gardant Host `82.65.97.67:34580` ; MinIO valide SigV4 avec ce Host.

## Décisions actées
- présignature publique pour presignGet seul ; signUploadPart sur client interne — D8
- défaut sans env = comportement actuel octet pour octet — D5
- fail-fast au boot si env invalide : voulu, pas un défaut

## Hors périmètre
- toute édition hors `W/api/test/verif-t009-*.test.ts` (et le fichier de référence temporaire sous W/api/test/, à supprimer) ; jamais G
- commit ; `git` autre que `show`/`status`/`diff`/`log` dans W
- test SigV4 bout en bout contre un vrai MinIO : images `minio/minio` et `quay.io/minio/minio` non pullables (chef, 2026-10-12) → NV, couvert par l'étape humaine H8
- route tuile, tileMetrics (T008), k6

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; @aws-sdk/client-s3 + s3-request-presigner (import dynamique)
- dans W : `npm --prefix api test` · `npm --prefix api run typecheck` · `npx vitest run <fichier>` depuis `W/api`
- un autre vérificateur (T008) travaille dans `AgentX/.cache/wt-charge3d-T006` : ne pas y toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm/npx dans W/api, rg, git -C W show/log/diff), Write (W/api/test/verif-t009-*, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- défaut n : symptôme · repro (fichier:cas ou commande) · gravité
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
