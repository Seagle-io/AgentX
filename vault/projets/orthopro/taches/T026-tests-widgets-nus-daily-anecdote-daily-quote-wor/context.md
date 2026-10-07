---
pack: T026
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T026 — Tests : daily-anecdote, daily-quote, word-of-day, contact-code, useful-links

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Donner un test `node:test` à `daily-anecdote`, `daily-quote`, `word-of-day`, `contact-code` et au catalogue `useful-links` : extraire la logique pure (choix du jour, formatage, résolution de catalogue) en `<nom>.util.ts`, couvrir chaque export ≥ 3 cas ; si un widget n'a aucune logique testable, le prouver (coordonnées) au lieu d'écrire un test vide.

## Definition of Done
- [ ] daily-anecdote (46 l.) : `daily-anecdote.util.ts` (sélection du jour, réglages de `.config.ts`) + test ≥ 4 cas (déterminisme même date, bascule à minuit)
- [ ] daily-quote (28 l.) + `daily-credit.tsx` (19 l.) : logique → `daily-quote.util.ts` + test ≥ 3 cas, OU preuve « 0 logique : rendu pur de ctx.data.X » (citer lignes)
- [ ] word-of-day (43 l.) : idem (`key={i}` L31 → clé stable si une liste est rendue)
- [ ] contact-code (57 l.) : formatage/copie du code → `contact-code.util.ts` + test ≥ 3 cas
- [ ] useful-links : `useful-links.catalog.test.ts` ≥ 3 cas (ids uniques, urls https, résolution config → liens par défaut `DEFAULT_LINKS`)
- [ ] `rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" <util.ts créés>` → 0 hit ; 0 changement de JSX visible
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` fichiers WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-anecdote/daily-anecdote-widget.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-anecdote/daily-anecdote.config.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-anecdote/daily-anecdote.util.ts` | E | créer (+ test même dossier) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-quote/daily-quote-widget.tsx` | E | extraire ? |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-quote/daily-credit.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-quote/daily-quote.util.ts` | E | créer si logique (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/word-of-day/word-of-day-widget.tsx` | E | extraire ?, key |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/word-of-day/word-of-day.util.ts` | E | créer si logique (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/contact-code/contact-code-widget.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/contact-code/contact-code.util.ts` | E | créer (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.catalog.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.catalog.test.ts` | E | créer |
Les fichiers de test jumeaux (même nom + .test.ts, même dossier) d'un util listé sont implicitement autorisés.

## Contrats
```ts
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts ; runner : npm run test:unit (node 24, 315 tests verts au départ)
// RÈGLE : un *.util.ts ne doit importer ni .tsx ni dashboard-widgets (rg en DoD)
// toute fonction dépendant de l'heure prend now: Date en paramètre
```

## Décisions actées
- pas de test vide ni de test de rendu React (pas de DOM sous node) — preuve « 0 logique » acceptée
- iso-fonctionnel

## Hors périmètre
- settings .tsx, index.tsx ; `useful-links.tsx` (états livrés T008/T017) ; autres widgets

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser dans `## Écarts`.
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node --test, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps ; KO test/typecheck HORS WL = à lister, pas à corriger
- lint : `npx eslint <fichiers WL>` seulement (lint global rouge préexistant, 755 jsx-quotes hors dashboard)
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T026
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
