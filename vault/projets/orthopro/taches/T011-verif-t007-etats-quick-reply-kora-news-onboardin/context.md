---
pack: T011
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T011 — Vérif T007 (états L/E/V)

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter chaque affirmation du lot T007 (états chargement/erreur/vide de `quick-reply`, `kora-news`, `onboarding`) : relancer les tests, construire des contre-exemples sur `widgetState` et sur le JSX, rendre `OK` ou `DÉFAUTS` avec reproduction.

## Definition of Done
- [ ] `npm run test:unit` relancé, sortie brute collée (attendu ≥ 284 pass, 0 fail)
- [ ] `npm run typecheck` relancé, sortie collée
- [ ] `npx eslint` sur les 9 fichiers WL, sortie collée
- [ ] contre-exemples `widgetState` (écrire un `*.probe.test.ts` TEMPORAIRE dans le dossier quick-reply, puis le supprimer — `git status` final collé) : [error+loading] → 'error' ; [] vide → 'empty' si isEmpty sinon 'ready' ; [loading, success] → 'loading' ; [success, success] + isEmpty → 'empty' ; 3 copies (quick-reply, kora-news, onboarding) donnent le MÊME résultat sur ces 5 entrées
- [ ] lecture JSX : pour chaque widget, la branche « vide » est inatteignable tant qu'une query n'est pas `isSuccess` — citer la ligne qui le garantit ou DÉFAUT
- [ ] quick-reply : « Réessayer » appelle bien les 2 refetch — citer lignes
- [ ] onboarding : étape `done === null` rendue « — », jamais comptée faite (`progressOf`) — citer test + ligne
- [ ] kora-news : l'affirmation « repli `latest` ne couvre plus error/loading » — vérifier qu'aucun rendu ne montre « Aucune annonce » pendant `isLoading`
- [ ] verdict final `OK` | `DÉFAUTS` (liste numérotée, chaque défaut = fichier:ligne + reproduction)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (0 édition de ces fichiers). Un seul fichier créé puis supprimé : `quick-reply/widget-state.probe.test.ts`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | L | JSX états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.ts` | L | widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news-widget.tsx` | L | JSX états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.ts` | L | widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | L | JSX états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.ts` | L | widgetState, progressOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/widget-state.probe.test.ts` | E | sonde temporaire, supprimer à la fin |

## Contrats
```ts
// attendu (pack T007)
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export const widgetState = (queries: QueryLike[], isEmpty: boolean): 'loading' | 'error' | 'empty' | 'ready'  // error > loading > empty > ready
// déclaré livré (T007 result) :
// quick-reply-widget.tsx:28-29,40-48 — error → WidgetNote error + Button Réessayer (refetch ×2) ; empty seulement si 2× isSuccess
// kora-news-widget.tsx:20-26,36-44 — Spinner / erreur+Réessayer / vide si isSuccess
// onboarding.util.ts:21-23,27-28,32,38,42-55 — done: boolean | null ; progressOf compte === true
// onboarding-widget.tsx:28-35,49-57,71-77 — refetch ×3 ; étape null → « — »
// test runner
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { widgetState } from './quick-reply.util.ts'
```

## Décisions actées
- 3 copies de widgetState acceptées cette vague, fusion vague 3 — ne pas en faire un défaut, juste constater l'équivalence
- lint global rouge hors dashboard (817) préexistant — HP, ne pas rapporter

## Hors périmètre
- corriger quoi que ce soit ; autres widgets ; style visuel ; `git commit`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx eslint, node, rg, git status, git diff, rm du probe), Write (probe + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T011
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint, probe)
## Défauts
- ∅ | n. fichier:L — défaut — reproduction (commande ou entrée → sortie)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
