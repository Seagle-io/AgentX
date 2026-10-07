---
pack: T015
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T015 — widget-state.ts partagé (lot 1/2)

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer `widget/widget-state.ts` (+ test) selon le contrat T010, puis supprimer les copies locales de `QueryLike`/`widgetState` dans `quick-reply`, `kora-news`, `onboarding` et y importer le module partagé.

## Definition of Done
- [ ] `widget-state.ts` créé, 0 import, signature verbatim du contrat ; `widget-state.test.ts` ≥ 9 cas : [error,loading]→error ; [loading,success]→loading ; [success,success]+empty→empty ; …+!empty→ready ; []+empty→empty ; []→ready ; [{isLoading:false,isError:false,isSuccess:false}] (inactive)→loading ; readonly array accepté ; 1 seul isError suffit
- [ ] `rg -n "QueryLike|widgetState|WidgetState" quick-reply/quick-reply.util.ts kora-news/kora-news.util.ts onboarding/onboarding.util.ts` → 0 hit (définitions supprimées) ; `quick-reply.util.ts` supprimé s'il devient vide (et son test)
- [ ] les 3 `*-widget.tsx` importent `{ widgetState } from '../widget-state'` ; aucun autre changement de JSX
- [ ] tests d'état retirés des 3 `*.util.test.ts` (ils vivent dans widget-state.test.ts)
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck` → 0 erreur dans la WL ; `npx eslint` 3 dossiers + widget-state* → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.ts` | E | supprimer copie (ou fichier) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.test.ts` | E | supprimer cas état (ou fichier) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news-widget.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.ts` | E | supprimer copie |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.test.ts` | E | retirer cas état |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | E | import |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.ts` | E | supprimer copie (L46-55) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.test.ts` | E | retirer cas état (L33-51) |

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
- module partagé, copies interdites — T010 verdict (2) KO, decisions.md#architecture
- JSX des 3 widgets déjà livré et cohérent (T007) — ne pas le retoucher
- tomorrow/week-grid/free-slots/useful-links → T017, pas ici

## Hors périmètre
- les 4 autres widgets ; changer la logique d'affichage ; `types.ts`, `widget-card.tsx`

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
tache: T015
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
