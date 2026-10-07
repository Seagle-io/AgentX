---
pack: T009
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T009 — Clock : util extrait, tests, erreurs, WidgetCard

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réduire `clock/clock-widget.tsx` (261 l., 0 test) : extraire la logique pure dans `clock.util.ts` testé, remplacer les `.catch(() => {})` (L177-193) par un toast d'erreur, et habiller le widget avec `WidgetCard` au lieu du shell recopié.

## Definition of Done
- [ ] `clock.util.ts` créé : toute logique sans React (calcul heure affichée, libellé date longue L221, tri/filtre des rappels, validation du formulaire de rappel) ; `clock-widget.tsx` ≤ 170 lignes
- [ ] `clock.util.test.ts` ≥ 10 cas : chaque export, minuit, changement de jour, rappel passé/futur, saisie invalide
- [ ] L177-193 : chaque `.catch(() => {})` → `.catch((e: Error) => addToast({ variant: 'error', title: '<action> impossible', description: e.message }))` via `useToast()` déjà importé L9
- [ ] rendu racine = `<WidgetCard icon=… title=… …>` ; `rg -n "WidgetCard" clock-widget.tsx` ≥ 1 ; aspect visuel équivalent (en-tête, corps défilant)
- [ ] comportement inchangé : mêmes props, même `index.tsx` (fiche widget : id, grid) — `git diff clock/index.tsx` vide
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck`, `npm run lint` → sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock-widget.tsx` | E | réduire, WidgetCard, erreurs |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/index.tsx` | L | fiche widget, ne pas changer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | WidgetCard/WidgetNote |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | DashboardWidget, WidgetContext |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/reminders/reminders.ts` | L | createReminder, dayKey, hhmm, isInPast, untilLabel, upcoming, Reminder, ReminderInput |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/reminders/use-reminders.ts` | L | useReminders |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | useToast / addToast |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue-widget.tsx` | L | exemple widget sous WidgetCard |

## Contrats
```ts
// clock-widget.tsx imports L1-12 (verbatim)
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '@/shared/ui/button/bouton'
import Input from '@/shared/ui/input/input'
import { Dialog } from '@/shared/ui/dialog/dialog'
import ChoiceChip from '@/shared/ui/choice-chip/choice-chip'
import SegmentedControl from '@/shared/ui/segmented-control/segmented-control'
import { Icon } from '@/shared/ui/icon/icon'
import { useToast } from '@/shared/ui/toast/toast'
import { cn } from '@/shared/lib/utils'
import { createReminder, dayKey, hhmm, isInPast, untilLabel, upcoming, type Reminder, type ReminderInput } from '@/shared/lib/reminders/reminders'
import { useReminders } from '@/shared/lib/reminders/use-reminders'
// WidgetCard
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName }: { icon: IconType; emoji?: string; title: ReactNode; hue?: string; count?: number; actions?: ReactNode; footer?: ReactNode; children: ReactNode; bodyClassName?: string })
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
// addToast({ variant: 'error' | 'success', title: string, description?: string })
// pattern test existant (revenue.util.test.ts:1-5)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts obligatoire
// runner : "test:unit": "node --test 'src/**/*.test.ts'"  (node 24 ; 243 tests verts au départ)
```
Dates : utiliser `hhmm` de reminders.ts, et pour la date longue `toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})` tel quel — un module partagé arrive (T006), ne pas l'anticiper.

## Décisions actées
- WidgetCard obligatoire, shell recopié interdit — RULE.MD kit UI
- erreurs jamais avalées — T002 top 10 H
- ne pas toucher reminders.ts (partagé avec ReminderWatcher) — HP

## Hors périmètre
- `src/shared/lib/reminders/*` (lecture seule) ; autres widgets ; nouvelle fonctionnalité d'horloge ; `framer-motion` retiré ou ajouté

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, lint) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
