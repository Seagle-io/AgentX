---
pack: T022
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T022 — Vérif états widgets (T007/T008/T015/T017)

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le lot « états chargement/erreur/vide » : `widget-state.ts` (table de vérité) et son usage dans 7 widgets — chaque branche vide inatteignable avant succès, chaque erreur visible avec « Réessayer » qui refetch toutes les requêtes passées, aucune requête `enabled:false` passée à `widgetState` (I1).

## Definition of Done
- [ ] `npm run test:unit`, `npm run typecheck`, `npx eslint` (8 fichiers WL) → sorties collées
- [ ] sonde `widget/widget-state.probe.test.ts` (créer, lancer, supprimer, `git status widget/` collé) : table de vérité exhaustive sur 1 et 2 requêtes × {loading, error, success, inactive} × isEmpty ∈ {0,1} = 8 + 64 cas, chaque sortie vérifiée contre la règle « ∃ isError → error ; sinon ∃ ¬isSuccess → loading ; sinon isEmpty ? empty : ready » ; `[]` → isEmpty ? empty : ready
- [ ] par widget (7) : tableau `widget | requêtes passées à widgetState (L) | refetch dans Réessayer (L) | branche empty gardée par state==='empty' (L) | requête enabled:false exclue (L ou n/a)` ; toute requête utilisée pour le rendu mais absente de widgetState = DÉFAUT ; tout refetch manquant = DÉFAUT
- [ ] `rg -n "QueryLike|widgetState" /home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget --glob '!widget-state*'` → uniquement des imports `from '../widget-state'` + appels ; 0 définition locale
- [ ] `rg -n "<Text" <7 fichiers>` : tout `<Text>` servant d'état L/E/V = DÉFAUT (états hors L/E/V tolérés, les citer)
- [ ] onboarding : `progressOf` ne compte que `done === true` ; étape `null` rendue « — » — citer test + ligne
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.ts` | L | module |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.probe.test.ts` | E | sonde, supprimer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.ts` | L | progressOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx` | L | I1 L37-46 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | WidgetNote |

## Contrats
```ts
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export type WidgetState = 'loading' | 'error' | 'empty' | 'ready'
export const widgetState: (queries: readonly QueryLike[], isEmpty: boolean) => WidgetState
// inactive = { isLoading: false, isError: false, isSuccess: false } → loading
// I1 : requête enabled:false jamais passée (tomorrow : appointmentsEnabled, queries = [settings] tant que désactivée)
// ['agenda-event-types'] (tomorrow) volontairement hors widgetState — couleur seulement, HP
// week-grid : isEmpty=false par construction (workingWeek replie lun-ven) — branche empty absente voulue
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
/// <reference types="node" /> · node:test · node:assert/strict · import { widgetState } from './widget-state.ts'
```

## Décisions actées
- module unique, copies interdites — T010
- requête inactive → loading — T010 I4

## Hors périmètre
- corriger ; visuel ; autres widgets ; HEAD/historique

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git status, rm de la sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T022
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (sonde : n cas, n OK)
## Tableau widgets
| widget | requêtes→widgetState | refetch | empty gardé | enabled:false |
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
