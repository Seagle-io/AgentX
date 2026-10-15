---
pack: T011
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T011 — Stabiliser tile-route-logs sous charge + gitignore .env.k6

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `api/test/tile-route-logs.test.ts` déterministe sous charge (seuil lent 50 ms ≈ durée SQL pg-mem chargée → faux `tile slow`) et ignorer `tools/load/.env.k6` dans `.gitignore` de G ; 0 code de production.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] tile-route-logs.test.ts:37 `TILE_SLOW_MS: '500'` ; cas :84 `delay(600)`, titre et assertions `≥ 500` (ms et storage) ; reste du fichier inchangé
- [ ] `.gitignore` : ligne `tools/load/.env.k6` ajoutée sous le bloc « Secrets / env » (:12-15)
- [ ] stabilité : `npx vitest run test/tile-route-logs.test.ts` ×10 depuis `G/api` → 10/10 verts, ET pendant ce temps une charge CPU parallèle (`npm --prefix api test` lancé en même temps 1 fois) → sortie (compte vert/rouge) collée
- [ ] `npm --prefix api test` → tout vert (base 99 fichiers / 873 tests) ; synthèse collée
- [ ] `git -C G status --short -- api/ .gitignore` → seulement ces 2 fichiers
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-logs.test.ts` | E | :37, :84-97 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.gitignore` | E | :12-15 |

## Contrats
Actuel :
```ts
// :37
      TILE_SLOW_MS: '50',
// :84-97
  it('tuile lente (≥ TILE_SLOW_MS=50) → warn tile slow avec storage ≥ 50', async () => {
    raw.length = 0;
    const get = app.storage.get;
    app.storage.get = async (prefix, rel, range) => { await delay(80); return get.call(app.storage, prefix, rel, range); };
    …
    expect(ls[0].ms as number).toBeGreaterThanOrEqual(50);
    expect(ls[0].storage as number).toBeGreaterThanOrEqual(50);
```
```gitignore
# Secrets / env (on garde les fichiers *.example)
.env
.env.local
.env.*.local
```
Cible : `TILE_SLOW_MS: '500'` (= défaut de prod) ; `delay(600)` ; seuils d'assertion 500.

## Décisions actées
- seuil de test = défaut prod 500 ms — marge ×10 sur SQL pg-mem chargé (≈ 50 ms)
- `.env.k6` jamais commité — D3

## Hors périmètre
- `api/src/**`, autres tests ; injecter une horloge dans buildServer
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; pg-mem ; machine chargée (load avg 24-28 constaté T010) → instabilité 3/9 runs à 50 ms
- HEAD G = 3490795

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix api test, npx vitest, git -C G status/diff)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T011
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
