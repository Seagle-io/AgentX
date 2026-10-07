---
pack: T016
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T016 — Vérif T009 (clock)

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le lot T009 (`widget/clock/`) : tests relancés, contre-exemples sur `clock.util.ts` (minuit, fin de mois, DST, saisie invalide), iso-fonctionnalité du refactor 261 → 168 lignes par comparaison avec `git diff`, erreurs plus jamais avalées.

## Definition of Done
- [ ] `node --test src/modules/dashboard/components/widget/clock/clock.util.test.ts` → sortie collée ; `npx eslint …/clock/` collé ; `git diff --stat …/clock/` collé ; `git diff …/clock/index.tsx` vide
- [ ] sonde `clock/clock.probe.test.ts` (créer, lancer, supprimer, `git status …/clock` final collé) ≥ 8 cas : `handAngles` à 00:00:00, 12:00:00, 23:59:59 (valeurs attendues calculées à la main) ; `alarmDate`/`inDays` au 31/10 → 01/11 et 31/12 → 01/01 ; `alarmProblem` sur heure vide, '25:00', date passée ; `nextReminders` tri + `moreLabel` avec 0/1/5 restants
- [ ] `rg -n "catch\(\(\) => \{\}\)|catch\(\(\) =>" …/clock/` → 0 hit, sinon DÉFAUT
- [ ] iso-fonctionnel : lire `git diff …/clock/clock-widget.tsx` ; lister chaque comportement supprimé ou modifié qui n'est PAS « extraction vers util » ni « WidgetCard » (ex. animation framer-motion, bouton, classe `@container/clock`) — chaque item = DÉFAUT potentiel à trancher par le chef
- [ ] `clock.util.ts:1` import relatif `../../../../../shared/lib/reminders/reminders.ts` : vérifier qu'il se résout sous node ET sous tsc (typecheck filtré clock → 0 erreur)
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock-widget.tsx` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.probe.test.ts` | E | sonde, supprimer à la fin |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/index.tsx` | L | inchangé attendu |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | WidgetCard props |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/reminders/reminders.ts` | L | hhmm, Reminder, ReminderInput |

## Contrats
```ts
// déclaré livré T009
// clock.util.ts:1-84 — 15 exports : handAngles, handSegment, tickSegment, seconds, longDate, QUICK_*, quickLabel, inDays, alarmDate, alarmInput, alarmProblem, reminderDescription, nextReminders, moreLabel
// clock-widget.tsx:1-168 — racine <WidgetCard> L127-164 ; remove L124-125 .catch((e: Error) => addToast({ variant: 'error', title: 'Suppression impossible', description: e.message })) ; vide → WidgetNote
// avant : 261 lignes, 1 seul .catch(() => {}) (ex-L193), add toastait déjà
// git diff disponible : HEAD c3f94ed = version d'origine (git show HEAD:src/modules/dashboard/components/widget/clock/clock-widget.tsx)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handAngles } from './clock.util.ts'
```

## Décisions actées
- test:unit global peut avoir 2 KO (layout-ops, T005 en cours) et typecheck 2 erreurs hors clock — HP
- redécoupe clock-dial/alarm-dialog proposée par T009 — HP, ne pas juger

## Hors périmètre
- corriger ; visuel navigateur (NV accepté) ; reminders.ts

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
tache: T016
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Comportements modifiés hors extraction
- ∅ | description — avant L / après L
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
