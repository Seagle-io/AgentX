---
pack: T027
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T027 — Tests : forum, kpi, storage, mascot

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Donner un test `node:test` à `forum` (112 l.), `kpi`, `storage`, `mascot` : extraire la logique pure en `<nom>.util.ts` et la couvrir ≥ 3 cas par export ; faire passer les formats de ces fichiers par `@/shared/lib/format/date` (forum L15 shortDate, kpi pluriel). Shell propre de kpi et mascot CONSERVÉ (règle A/B).

## Definition of Done
- [ ] forum/dashboard-forum.tsx : logique (tri/filtre des sujets, libellés, date L15) → `forum.util.ts` + test ≥ 6 cas ; L15 → `shortDate`
- [ ] kpi/index.tsx + dashboard-kpi.tsx : calculs/libellés → `kpi.util.ts` + test ≥ 5 cas ; pluriel inline → `plural` ; shell inchangé (bouton étiré L44-57)
- [ ] storage-widget.tsx (42 l.) : ratio/quota/libellé → `storage.util.ts` + test ≥ 4 cas (0, seuil 90 %, > 100 %, quota null)
- [ ] mascot (43 l.) : preuve « 0 logique » (citer lignes) ou util + test ≥ 3
- [ ] `rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" <util.ts créés>` → 0 hit ; 0 changement de JSX visible hors formats
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` fichiers WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/dashboard-forum.tsx` | E | extraire + shortDate |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/forum.util.ts` | E | créer (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/index.tsx` | E | plural, extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/dashboard-kpi.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/kpi.util.ts` | E | créer (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/storage/storage-widget.tsx` | E | extraire |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/storage/storage.util.ts` | E | créer (+ test) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/mascot/mascot.tsx` | E | si logique |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/mascot/index.tsx` | L | fiche |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | contrat |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/licence-quota.ts` | L | si storage s'en sert |
Les fichiers de test jumeaux (même nom + .test.ts, même dossier) sont implicitement autorisés.

## Contrats
```ts
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts ; runner : npm run test:unit (node 24, 315 tests verts au départ)
// RÈGLE : un *.util.ts ne doit importer ni .tsx ni dashboard-widgets (rg en DoD)
// src/shared/lib/format/date.ts (commité d3994c9) — import { shortDate, longDate, hhmm, capitalize, plural } from '@/shared/lib/format/date'
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // fr-FR {day:numeric, month:short} → "5 oct."
export const longDate = (d: DateLike): string        // fr-FR {weekday:long, day:numeric, month:long} → "lundi 5 octobre"
export const hhmm = (d: DateLike | number): string   // "09:05" ; number = minutes depuis minuit
export const capitalize = (s: string): string
export const plural = (n: number, singular: string, pluralForm = singular + "s"): string
// ⚠ dans un *.util.ts testé sous node : import RELATIF suffixé .ts (alias @/ KO sous node --test) ; dans un .tsx : alias @/ OK
// RÈGLE shell (T010) : kpi = B (surface = bouton), mascot = A∧B → shell propre conservé, 0 WidgetCard
```

## Décisions actées
- kpi, mascot, greeting, weather gardent leur shell — T010
- iso-fonctionnel ; formats via la lib validée

## Hors périmètre
- WidgetCard sur ces widgets ; greeting, weather ; forum/index.tsx ; messaging

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
tache: T027
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
