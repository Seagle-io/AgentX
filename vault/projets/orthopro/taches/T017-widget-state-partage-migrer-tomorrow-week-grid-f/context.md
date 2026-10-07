---
pack: T017
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T017 — widget-state.ts partagé (lot 2/2)

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Supprimer les copies locales de `QueryLike`/`widgetState` dans `tomorrow`, `week-grid`, `free-slots`, `useful-links` et importer `widget/widget-state.ts` (créé par T015) ; respecter I1 pour la requête `enabled:false` de tomorrow.

## Definition of Done
- [ ] `rg -n "QueryLike|widgetState|WidgetState" tomorrow/tomorrow.util.ts week-grid/week-grid.util.ts free-slots/free-slots.util.ts useful-links/useful-links.util.ts` → 0 hit ; `useful-links.util.ts` + test supprimés s'ils deviennent vides
- [ ] les 4 `*.tsx` importent `{ widgetState } from '../widget-state'`
- [ ] tomorrow : la requête avec `enabled: false` (`tomorrow-widget.tsx:30-44`) n'est PAS passée à `widgetState` tant qu'elle est désactivée (I1) ; `['agenda-event-types']` : inclure dans widgetState si son résultat conditionne l'affichage, sinon noter pourquoi
- [ ] cas d'état retirés des 4 `*.util.test.ts` ; cas `workRanges`/`fills` conservés
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck` → 0 erreur WL ; `npx eslint` 4 dossiers → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.ts` | L | module partagé (T015) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx` | E | import, I1 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.ts` | E | supprimer copie L25-33 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.test.ts` | E | retirer cas état L33-51 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid-widget.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid.util.ts` | E | supprimer copie L93-101 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid.util.test.ts` | E | retirer cas état |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots-widget.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots.util.ts` | E | supprimer copie L102-110 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots.util.test.ts` | E | retirer cas état |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.util.ts` | E | supprimer, ainsi que son fichier de test voisin (même dossier) |

## Contrats
```ts
// src/modules/dashboard/components/widget/widget-state.ts — 0 import (node:test, pas d alias @/)
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export type WidgetState = 'loading' | 'error' | 'empty' | 'ready'
export const widgetState: (queries: readonly QueryLike[], isEmpty: boolean) => WidgetState
// table : ∃ isError → error ; sinon ∃ ¬isSuccess → loading ; sinon isEmpty ? empty : ready ; [] → isEmpty ? empty : ready
// I1 n y passer que des requêtes enabled (désactivée ⇒ loading perpétuel)
// I2 0 ré-export local ; les widgets importent `from '../widget-state'`
// I4 kora-news, quick-reply : requête inactive passe de ready → loading (voulu, T010)
// test : import { widgetState } from './widget-state.ts'  (node:test + node:assert/strict, /// <reference types="node" />)
```

## Décisions actées
- module partagé, copies interdites — T010 verdict (2) KO
- JSX livré par T008 cohérent — ne retoucher que l'import et le choix des requêtes passées (I1)

## Hors périmètre
- quick-reply, kora-news, onboarding (T015) ; dédoublonner les queries agenda ×3 — plus tard

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps ; des KO test/typecheck HORS WL sont à lister, pas à corriger
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T017
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
