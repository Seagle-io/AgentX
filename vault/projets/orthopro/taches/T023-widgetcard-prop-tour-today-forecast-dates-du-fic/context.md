---
pack: T023
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T023 — WidgetCard : tour, today, forecast

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter `tour?: string` à `WidgetCard` (→ `data-tour` sur la `<section>`), puis remplacer le shell recopié de `today-widget.tsx` (L108, `tour='dash-today'`) et `forecast/previsionnel-card.tsx` (L21) par `WidgetCard` ; au passage, les formats de date de ces deux fichiers passent par `@/shared/lib/format/date`.

## Definition of Done
- [ ] `widget-card.tsx` : prop `tour?: string` ; `<section … data-tour={tour}>` ; seul ajout, props existantes intactes
- [ ] today-widget.tsx : racine `<WidgetCard icon=… title=… tour='dash-today' …>` ; `rg -n "rounded-card border border-border bg-bg-panel" today-widget.tsx` → 0 hit sur le shell racine (L196 bouton interne : toléré) ; `data-tour='dash-today'` toujours présent dans le DOM (via prop)
- [ ] today-widget.tsx : L23 formateur hh:mm → `hhmm` ; L118 date longue → `longDate` (+ `capitalize` si la source capitalisait) ; L119 `restant${remaining > 1 ? 's' : ''}` → `plural(remaining, 'restant')` ; sortie identique octet pour octet (la lib est validée)
- [ ] previsionnel-card.tsx : racine `<WidgetCard>`, en-tête = titre actuel du widget ; corps identique
- [ ] comportement inchangé : mutations, liens, états loading/erreur de today ; `git diff --stat` des 2 fichiers collé
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` 3 fichiers → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | E | prop tour |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | E | WidgetCard + dates |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-rail.util.ts` | L | logique today |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forecast/previsionnel-card.tsx` | E | WidgetCard |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forecast/index.tsx` | L | fiche |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue-widget.tsx` | L | exemple WidgetCard + actions |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | contrat |

## Contrats
```ts
// widget-card.tsx — contrat actuel
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName }: { icon: IconType; emoji?: string; title: ReactNode; hue?: string; count?: number; actions?: ReactNode; footer?: ReactNode; children: ReactNode; bodyClassName?: string })
export const WidgetFooterLink = ({ icon, children, onClick }: { icon?: IconType; children: ReactNode; onClick: () => void })
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
// RÈGLE shell (T010) : shell propre autorisé ssi A (aucun titre fixe nommant le widget) ∨ B (surface entière = 1 cible de clic) ; sinon WidgetCard
// cible : + tour?: string → <section data-tour={tour} …>
// today-widget.tsx:108  <section data-tour='dash-today' className='flex h-full flex-col overflow-hidden rounded-card border border-border bg-bg-panel shadow-[…]'>
// previsionnel-card.tsx:21  <section className='flex h-full flex-col rounded-card border border-border bg-bg-panel p-5 shadow-[…]'>
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
- WidgetCard obligatoire pour today, forecast (ni A ni B) — T010
- greeting, kpi, mascot, weather gardent leur shell — HP ici
- `activity`, `worklists` → T024 en parallèle ; ne pas toucher

## Hors périmètre
- autres widgets ; `types.ts` ; redécoupe de today (266 l.) ; tests Playwright

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
tache: T023
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
