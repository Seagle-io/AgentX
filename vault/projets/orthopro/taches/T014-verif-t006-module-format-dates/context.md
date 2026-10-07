---
pack: T014
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T014 — Vérif T006 (format dates)

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter `src/shared/lib/format/date.ts` : égalité octet pour octet avec les 4 formats existants des widgets sur ≥ 20 dates (dont changement d'année, DST mars/octobre, 00:00, 23:59, 1er du mois), via une sonde `node:test` temporaire.

## Definition of Done
- [ ] `npm run test:unit` → ligne `# pass/# fail` collée ; `npx eslint src/shared/lib/format/` collée
- [ ] sonde `date.probe.test.ts` (créer puis supprimer, `git status src/shared/lib/format` final collé) : pour 20 dates, `shortDate(d) === d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})`, `longDate(d) === d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})`, `hhmm(d)` === `String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')` ; `hhmm(minutes)` pour 0, 59, 60, 1439 ; ISO string vs Date même résultat ; chaîne ISO sans fuseau (`'2026-10-05'`) → noter le jour obtenu (piège UTC)
- [ ] `capitalize('')`, `capitalize('éa')` → 'Éa' ; `plural(0,'séance')`, `plural(1,…)`, `plural(2,…)`, `plural(2,'cheval','chevaux')`
- [ ] écart déclaré : `dashboard-worklists.tsx:73` utilise `day:'2-digit'` — confirmer par lecture, et relever si d'autres appelants listés divergent du contrat (`rg -n "toLocaleDateString|toLocaleTimeString" src/modules/dashboard/components/widget` : coller les options de chaque hit)
- [ ] 0 import dans date.ts (`rg -n "^import" date.ts` → vide)
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.probe.test.ts` | E | sonde, supprimer à la fin |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/dashboard-worklists.tsx` | L | L73 2-digit |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | L | L23, L118 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/next-appointment.util.ts` | L | L28 XhMM, L46 |

## Contrats
```ts
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // fr-FR {day:'numeric',month:'short'}
export const longDate = (d: DateLike): string        // fr-FR {weekday:'long',day:'numeric',month:'long'}
export const hhmm = (d: DateLike | number): string   // 'HH:MM' ; number = minutes depuis minuit
export const capitalize = (s: string): string
export const plural = (n: number, singular: string, pluralForm = singular + 's'): string
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shortDate, longDate, hhmm, capitalize, plural } from './date.ts'
```

## Décisions actées
- fr-FR en dur, iso-fonctionnel — decisions.md#2026-10-05
- aucun appelant migré cette vague — divergences = info pour vague 3, pas défaut T006 (sauf si le contrat lui-même est faux)

## Hors périmètre
- corriger ; i18n ; migrer un appelant

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git status, git diff), Write (result.md + sonde temporaire si prévue)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T014
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
