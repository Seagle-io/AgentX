---
pack: T025
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T025 — Tests : pomodoro, shortcuts, tongue-twister

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Donner un test `node:test` à `pomodoro`, `shortcuts`, `tongue-twister` : extraire la logique pure des `.tsx` vers `<nom>.util.ts` (0 import React/.tsx), couvrir chaque export ≥ 3 cas, sans changer le comportement.

## Definition of Done
- [ ] pomodoro : `pomodoro.util.ts` (durées, transitions travail/pause, formatage mm:ss, bornes des réglages de `pomodoro.config.ts`) ; `pomodoro.tsx` l'importe ; `pomodoro.util.test.ts` ≥ 10 cas
- [ ] shortcuts : `shortcuts.util.ts` (résolution catalog × config → liste affichée, filtres, ordre) ; `shortcuts.test.ts` ≥ 6 cas dont config vide, id inconnu, doublon
- [ ] tongue-twister : `tongue-twister.util.ts` (choix du jour / rotation, réglages) ; `tongue-twister.util.test.ts` ≥ 5 cas dont déterminisme pour une même date
- [ ] `rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" <3 util.ts>` → 0 hit
- [ ] widgets : `git diff` montre uniquement des déplacements de logique + imports ; 0 changement de JSX visible
- [ ] `npm run test:unit` → fail 0, total ≥ 315+21 ; `npm run typecheck` → 0 ; `npx eslint` fichiers WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/pomodoro.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/pomodoro.config.ts` | L | bornes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/pomodoro.util.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/pomodoro.util.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.catalog.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.config.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.util.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tongue-twister/tongue-twister-widget.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tongue-twister/tongue-twister.util.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tongue-twister/tongue-twister.util.test.ts` | E | créer |

## Contrats
```ts
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts ; runner : npm run test:unit (node 24, 315 tests verts au départ)
// RÈGLE : un *.util.ts ne doit importer ni .tsx ni dashboard-widgets (rg en DoD)
// exemple de référence dans le repo : widget/revenue/revenue.util.ts + revenue.util.test.ts (hors WL, ne pas ouvrir : pattern = exports purs, Date injectée en paramètre )
// toute fonction dépendant de l'heure prend now: Date en paramètre — déterminisme des tests
```

## Décisions actées
- tests node:test, fichier à côté, import relatif .ts — convention repo
- 0 refonte visuelle — iso-fonctionnel

## Hors périmètre
- settings .tsx et index.tsx ; tongue-twister.config.ts, api/dashboard-tongue-twister.ts ; autres widgets

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
tache: T025
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
