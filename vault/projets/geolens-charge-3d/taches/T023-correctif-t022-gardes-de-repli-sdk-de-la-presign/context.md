---
pack: T023
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T023 — Correctif T022 : gardes de repli SDK de la présignature directe

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire renvoyer `null` (repli SDK) à `presignGetV4` pour les 8 classes d'entrées où T022 a montré une URL ≠ SDK ou un SDK qui lève ; 0 changement pour les cas déjà égaux.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] s3Presign.ts, gardes en tête de `presignGetV4` → null si :
  - D1-D3 région : `region === 'aws-global'` OU `/fips/i.test(region)` OU région ∉ `/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/`
  - D4-D5 bucket : `bucket.startsWith('xn--')` OU `/--x-s3$|--xa-s3$/.test(bucket)`
  - D7 endpoint : `u.port === '0'`
  - D8 date : année UTC de `signedAtMs` ∉ [1970, 9999] (ou `signedAtMs` non fini)
- [ ] D6 config.ts:287 : `presignSdk: bool(env.S3_PRESIGN_SDK, false) || bool(env.AWS_USE_FIPS_ENDPOINT, false) || bool(env.AWS_USE_DUALSTACK_ENDPOINT, false)` ; commentaire 1 ligne
- [ ] s3-presign.test.ts : cas D1-D8 repris de `verif-t022-casse.test.ts` (:39-52, :101) → v4 null ; + config : `AWS_USE_FIPS_ENDPOINT=true` → presignSdk true
- [ ] repro T022 : `npx vitest run` du fichier `verif-t022-casse.test.ts` COPIÉ temporairement sous `G/api/test/` puis SUPPRIMÉ → 16/16 verts collé (le fichier ne reste pas dans G)
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 101 fichiers / 976 tests) ; synthèses collées
- [ ] `git -C G status --short -- api/` → seulement s3Presign.ts, config.ts, s3-presign.test.ts
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/s3Presign.ts` | E | :43-53 gardes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :97-98, :287 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/s3-presign.test.ts` | E | + cas D1-D8 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T021/api/test/verif-t022-casse.test.ts` | L | repro :1-110 |

## Contrats
```ts
// s3Presign.ts:43-53 actuel
export function presignGetV4(i: SigV4GetInput): string | null {
  if (!i.endpoint || !i.accessKeyId || !i.secretAccessKey) return null;
  if (!DNS_BUCKET.test(i.bucket)) return null;
  if (!Number.isInteger(i.expiresInSec) || i.expiresInSec < 1 || i.expiresInSec > MAX_EXPIRES_SEC) return null;
  let u: URL;
  try { u = new URL(i.endpoint); } catch { return null; }
  if ((u.protocol !== 'http:' && u.protocol !== 'https:') || u.pathname !== '/' || u.search || u.hash || u.username || u.password) return null;
// config.ts:162 / :287
function bool(v: string | undefined, def: boolean): boolean;
      presignSdk: bool(env.S3_PRESIGN_SDK, false),
// storage.ts:607 (inchangé) : if (!config.s3.presignSdk) { const v4 = presignGetV4(…); if (v4) return … } → sinon SDK
```
T022 : fuzz 16 000 entrées → seuls KO = ces classes ; tout le reste = SDK octet pour octet.

## Décisions actées
- D20 : null = repli SDK toujours acceptable ; mieux vaut trop de repli qu'une URL fausse
- `ttlSec < 2` → NaN dans storage.presignGet : préexistant, hors lot (ttl borné [120, 3600] par config)

## Hors périmètre
- storage.ts, route tuile, tests existants hors s3-presign.test.ts
- `W/` : lecture seule ; commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; HEAD G = d15be57 ; base 101 fichiers / 976 tests
- arbre G sale hors api/ (web/…, RAPPORT_*) : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(cp/rm du seul fichier de repro, npm --prefix api test|run typecheck, npx vitest, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T023
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
