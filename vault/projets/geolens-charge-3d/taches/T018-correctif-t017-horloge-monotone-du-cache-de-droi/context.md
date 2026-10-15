---
pack: T018
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T018 — Correctif T017 : horloge monotone du cache de droits

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre l'expiration du cache de droits de tuile insensible aux reculs de l'horloge murale : horloge par défaut monotone, et test de non-régression repris de la repro T017.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] tileGrantCache.ts:18 → `const now = opts.now ?? (() => performance.now());` (global Node, 0 import) ; reste du fichier inchangé hors commentaire :1-3 (« révocation ≤ TTL + 1 load en vol », D17)
- [ ] test ajouté dans tile-grant-cache.test.ts : sans `now` injecté, `Date.now` mocké qui recule de 600 s après le stockage (vi.spyOn) → l'entrée expire quand même après TTL (horloge monotone) ; repris de la repro T017 « horloge murale reculée »
- [ ] `npx vitest run test/tile-grant-cache.test.ts` → vert ; `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 100 fichiers / 893 tests) ; synthèses collées
- [ ] `git -C G diff --stat` → seulement les 2 fichiers WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileGrantCache.ts` | E | :1-3, :18 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-grant-cache.test.ts` | E | +1 cas, modèle :14-28 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/verif-t017-cache.test.ts` | L | cas « horloge murale reculée » |

## Contrats
```ts
// tileGrantCache.ts actuel
export function createTileGrantCache(opts: { ttlMs: number; maxEntries: number; now?: () => number }): TileGrantCache {
  const now = opts.now ?? Date.now;                       // :18
    hits.set(key, { grant, at: now() });                    // :24
        if (now() - hit.at <= opts.ttlMs) return Promise.resolve(hit.grant);   // :34
```
Constat T017 : `Date.now` recule de 600 s → positif servi 631 000 ms > TTL 30 000.

## Décisions actées
- D17 : retard max = TTL + 1 load en vol (accepté) ; `''` → 0 et `clear()`/inflight laissés tels quels
- `performance.now()` : monotone, ms flottantes — comparaison `<=` inchangée

## Hors périmètre
- config.ts / intIn, server.ts, inflight, clear()
- `W/` : lecture seule
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; HEAD G = 382ddc7
- arbre G sale hors api/ (web/…, RAPPORT_*) : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix api test|run typecheck, npx vitest, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T018
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
