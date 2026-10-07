---
pack: T024
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T024 — WidgetCard : activity, worklists

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer le shell recopié de `activity/activity-year.tsx` (L44) et `worklists/dashboard-worklists.tsx` (L55) par `WidgetCard` en conservant la teinte `dash-hue`/hover des worklists via `hue`, et faire passer les formats de ces fichiers par `@/shared/lib/format/date`.

## Definition of Done
- [ ] activity-year.tsx : racine `<WidgetCard>` ; L19 pluriel inline → `plural` ; `activity-widget.tsx` (26 l.) : si c'est lui qui porte le shell du chart, idem
- [ ] dashboard-worklists.tsx : racine `<WidgetCard hue=…>` ; l'effet hover de bordure (L55 `hover:border-[color-mix…]`) : conservé via `bodyClassName`/wrapper si possible, sinon noté comme perdu dans `## Écarts` (décision chef)
- [ ] dashboard-worklists.tsx:73 `day:'2-digit'` → `shortDate` (`5 oct.` au lieu de `05 oct.`) — changement voulu, noté dans result
- [ ] `rg -n "rounded-card border border-border bg-bg-panel" activity/ worklists/` → 0 hit racine
- [ ] comportement inchangé (query année, navigation, 9 branches vides des worklists) ; `git diff --stat` collé
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` fichiers WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-widget.tsx` | E | shell ? |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-year.tsx` | E | WidgetCard + plural |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-chart.tsx` | L | contenu |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/index.tsx` | L | fiche |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/dashboard-worklists.tsx` | E | WidgetCard + shortDate |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/index.tsx` | L | fiches |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | contrat (T023 y ajoute `tour?` en parallèle : ne pas l'éditer) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | contrat |

## Contrats
```ts
// widget-card.tsx — contrat actuel
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName }: { icon: IconType; emoji?: string; title: ReactNode; hue?: string; count?: number; actions?: ReactNode; footer?: ReactNode; children: ReactNode; bodyClassName?: string })
export const WidgetFooterLink = ({ icon, children, onClick }: { icon?: IconType; children: ReactNode; onClick: () => void })
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
// RÈGLE shell (T010) : shell propre autorisé ssi A (aucun titre fixe nommant le widget) ∨ B (surface entière = 1 cible de clic) ; sinon WidgetCard
// activity-year.tsx:44  <section className='flex h-full flex-col rounded-card border border-border bg-bg-panel p-5 shadow-[…]'>
// dashboard-worklists.tsx:55  'dash-hue flex h-full flex-col overflow-hidden rounded-card border border-border bg-bg-panel shadow-[…] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--hue)_45%,var(--color-border))]'
// WidgetCard pose déjà la classe dash-hue + style --module-hue via prop hue
// src/shared/lib/format/date.ts (commité d3994c9) — import { shortDate, longDate, hhmm, capitalize, plural } from '@/shared/lib/format/date'
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // fr-FR {day:numeric, month:short} → "5 oct."
export const longDate = (d: DateLike): string        // fr-FR {weekday:long, day:numeric, month:long} → "lundi 5 octobre"
export const hhmm = (d: DateLike | number): string   // "09:05" ; number = minutes depuis minuit
export const capitalize = (s: string): string
export const plural = (n: number, singular: string, pluralForm = singular + "s"): string
// ⚠ dans un *.util.ts testé sous node : import RELATIF suffixé .ts (alias @/ KO sous node --test) ; dans un .tsx : alias @/ OK
```

## Décisions actées
- WidgetCard obligatoire pour activity, worklists — T010
- shortDate numérique partout (fin du 2-digit) — T014 info, décision chef

## Hors périmètre
- today, forecast (T023) ; `widget-card.tsx` ; heatmap.util / activity-axis (déjà testés)

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
tache: T024
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
