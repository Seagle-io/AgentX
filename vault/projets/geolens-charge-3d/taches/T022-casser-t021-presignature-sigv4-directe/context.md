---
pack: T022
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-13
---

# Pack T022 — Casser T021 : présignature SigV4 directe

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trouver une entrée pour laquelle `presignGetV4` renvoie une URL ≠ `getSignedUrl` du SDK (au lieu de null), ou un défaut de repli / de cache de clé ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021` (worktree détaché d15be57, `api/node_modules` → G)

## Definition of Done
- [ ] base : `npm --prefix api run typecheck` et `npm --prefix api test` dans W → synthèses collées (attendu 101 fichiers / 976 tests)
- [ ] fuzz d'égalité : ≥ 5 000 entrées aléatoires (graine fixe, loguée) — clés : unicode (é, 中, emoji/surrogates), `#?&=+%~*!'()`, espaces, `..` déjà sanitisé ou non ; régions ; dates (minuit UTC ±1 ms, 29/02, an 2099) ; ttl {1, 299, 300, 3600, 604800, 604801, 0, 1.5} ; endpoints {https:443 explicite, http:80 explicite, majuscules `HTTP://H.EXAMPLE`, host à point final, IPv6, port non standard, IP + vhost} ; buckets {3 car., 63 car., `a-b`, `xn--a`, `a..b`, `-a`, `A`} → pour chaque entrée : `v4 === null` OU `v4 === sdk` ; tout écart = défaut avec l'entrée minimale
- [ ] SDK qui LÈVE (ttl > 7 j, bucket invalide…) alors que v4 renvoie une URL → défaut
- [ ] cache de clé : 9+ secrets/régions/jours alternés → signature toujours = SDK (pas de clé périmée servie) ; changement de jour UTC entre 2 appels
- [ ] storage.presignGet : `S3_PRESIGN_SDK=1` → SDK ; presignSdk false + cas null → SDK ; quantification ttl/2 et expiresAtMs identiques à avant (presign-get.test.ts vert)
- [ ] fuite : secret jamais dans l'URL ni dans une erreur/log ; `keyCache` borné à 8
- [ ] verdict + reproductions ; tests de casse UNIQUEMENT sous `W/api/test/verif-t022-*.test.ts`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/src/s3Presign.ts` | L | 81 l, cible |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/src/storage.ts` | L | :384-445 s3ClientConfig/clients, :596-626 presignGet |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/src/config.ts` | L | :88-100, :280-290 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/test/s3-presign.test.ts` | L | 82 cas, harnais SDK |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/test/presign-get.test.ts` | L | S3_ENV, quantification |

## Contrats
```ts
export interface SigV4GetInput {
  endpoint: string | undefined; region: string; bucket: string; key: string; forcePathStyle: boolean;
  accessKeyId: string | undefined; secretAccessKey: string | undefined;
  signedAtMs: number; expiresInSec: number; responseCacheControl?: string; responseContentType?: string;
}
/** = getSignedUrl(GetObjectCommand) octet pour octet ; cas non couvert → null (l'appelant passe au SDK). */
export function presignGetV4(i: SigV4GetInput): string | null;
// SDK de référence : getSignedUrl(new S3Client(s3ClientConfig(config, endpoint)), new GetObjectCommand({ Bucket, Key, ResponseCacheControl, ResponseContentType }), { expiresIn, signingDate: new Date(signedAtMs) })
```
Implémenteur : null si endpoint non http(s), chemin ≠ `/`, userinfo, expires ∉ [1, 604800], bucket ∉ `/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/` (même en path-style) ; IPv4 ou `[…]` → path-style.

## Décisions actées
- D20 : égalité octet pour octet = seul critère ; null (repli SDK) toujours acceptable
- acceptation MinIO réelle : mesurée par le chef sur le serveur (k6, statut S3), pas ici

## Hors périmètre
- toute édition hors `W/api/test/verif-t022-*.test.ts` ; jamais G ; 0 commit ; `git` autre que status/diff/log/show
- ssh, serveur, k6 ; perf

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; @aws-sdk installés ; dans W : `npx vitest run <fichier>` depuis `W/api`
- getSignedUrl est async (import dynamique) : fuzz en boucle async, ≤ 60 s

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm/npx dans W/api, rg, git -C W show/log/diff), Write (W/api/test/verif-t022-*, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T022
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- défaut n : symptôme · repro (fichier:cas, entrée minimale) · gravité
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
