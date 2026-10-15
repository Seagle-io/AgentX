---
pack: T012
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T012 — Correctif lot A : origine IP loguée, WEB_ORIGIN non parsable

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 2 défauts du vérificateur T009 dans G : `s3PublicOrigin` renvoie une origine fausse pour un endpoint IP en vhost ; le log de boot plante si `WEB_ORIGIN` n'est pas une URL ; tests de non-régression repris de la repro T009.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] D1 : `S3_PUBLIC_ENDPOINT=http://82.65.97.67:34580` + `S3_FORCE_PATH_STYLE=0` → `s3PublicOrigin` = `http://82.65.97.67:34580` ; idem IPv6 `http://[::1]:9000` → `http://[::1]:9000` ; nom DNS + vhost → inchangé (`https://<bucket>.<host>`)
- [ ] D1 : test « origine loguée = origine de l'URL presignGet » pour la matrice {IPv4, IPv6, DNS} × {path, vhost}
- [ ] D2 : `TILE_PRESIGN_REDIRECT=1` + `WEB_ORIGIN='127.0.0.1:5173'` → boot OK, log `{ origin, sameOrigin: false }` ; test ajouté
- [ ] les 4 cas KO de la repro T009 (`verif-t009-casse.test.ts` :87, :90, :145, :149) repris dans les tests de G et verts
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 99 fichiers / 873 tests) ; synthèse collée
- [ ] `git -C G diff --stat -- api/src/server.ts api/src/storage.ts` collé (≤ 6 lignes modifiées au total en src)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | E | :686-694 s3PublicOrigin |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :2506-2508 log de boot |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/presign-get.test.ts` | E | cas D1 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/s3-public-endpoint.test.ts` | E | cas D2 (boot) |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/test/verif-t009-casse.test.ts` | L | :80-160 repro T009 |

## Contrats
Actuel :
```ts
// storage.ts:688-694
/** Origine publique du bucket S3 (cible des GET présignés) ; driver ≠ s3 ou sans endpoint → null. */
export function s3PublicOrigin(config: AppConfig): string | null {
  const ep = config.s3.publicEndpoint ?? config.s3.endpoint;
  if (config.storageDriver !== 's3' || !ep) return null;
  const u = new URL(ep);
  return config.s3.forcePathStyle ? u.origin : `${u.protocol}//${config.s3.bucket}.${u.host}`;
}
// server.ts:2506-2508
  if (config.tilePresign.enabled) { const origin = s3PublicOrigin(config);
    app.log.info({ origin, sameOrigin: origin === new URL(config.webOrigin).origin },
      'tile presign ON — sameOrigin=false ⇒ origine requise CSP viewer + CORS bucket'); }
```
Cible :
```ts
// storage.ts — host IP (IPv4 a.b.c.d ou IPv6 entre crochets) → le SDK S3 repasse en path-style → u.origin
return config.s3.forcePathStyle || isIpHost(u.hostname) ? u.origin : `${u.protocol}//${config.s3.bucket}.${u.host}`;
// isIpHost : non exportée, ≤ 5 lignes, 0 dépendance (node:net isIP autorisé ; hostname IPv6 de URL = '[::1]')
// server.ts — WEB_ORIGIN non parsable → sameOrigin false, jamais throw
const sameOrigin = (() => { try { return origin === new URL(config.webOrigin).origin; } catch { return false; } })();
```
Constat T009 : URL présignée réelle avec IP + vhost = `http://82.65.97.67:34580/geolens-tuiles/…` (path-style forcé par le SDK).

## Décisions actées
- seul consommateur de s3PublicOrigin = log de boot (CSP manuelle) — gravité basse, corriger quand même
- `s3PublicEndpointOf` accepte port 0 et `?`/`#` vides (normalisés) : laissé tel quel
- course au 1er appel concurrent (N S3Client créés) : 0 effet observé, hors périmètre
- valider WEB_ORIGIN dans loadConfig : NON (hors lot, prod déjà contrôlée config.ts:342)

## Hors périmètre
- config.ts, getPresignClient, presignGet, signUploadPart
- route tuile, tileMetrics
- `W/` : lecture seule
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; HEAD G = 21444bb ; base 99 fichiers / 873 tests
- boot en test : `buildServer({ config, logger: true, logStream })` (BuildOptions server.ts:90-100) ; modèle dans `api/test/tile-route-logs.test.ts:31-40`
- DoD périmètre : `git -C G status --short -- api/`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T012
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
