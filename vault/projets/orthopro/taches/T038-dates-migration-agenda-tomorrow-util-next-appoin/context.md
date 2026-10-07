---
pack: T038
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T038 — Dates : migration agenda

> Seule source de vérité de l'agent T038. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer les formateurs de date locaux par `@/shared/lib/format/date` dans `tomorrow.util.ts`, `next-appointment` (widget + util), `greeting` (tsx + util), `month-calendar.tsx` ; supprimer les helpers locaux devenus morts ; tests existants adaptés si un nom change.

## Definition of Done
- [ ] tomorrow.util.ts:22 date longue + capitalize → `capitalize(longDate(d))` (si la source capitalisait) ; helper local supprimé
- [ ] next-appointment-widget.tsx:18 hh:mm → `hhmm` ; next-appointment.util.ts:46 capitalize → `capitalize` ; L28 XhMM et L47 {day,month:long} CONSERVÉS tels quels (hors contrat)
- [ ] greeting/dashboard-greeting.util.ts:21 hh:mm → `hhmm` ; greeting/dashboard-greeting.tsx:11 date longue → `longDate`
- [ ] month-calendar/month-calendar.tsx:61 date longue → `longDate` ; L52 `key={i}` → clé stable si liste (date ISO du jour)
- [ ] `rg -n "toLocaleDateString|toLocaleTimeString|padStart\(2" <6 fichiers>` → seuls hits restants = XhMM et {day,month:long} de next-appointment.util.ts (collé)
- [ ] tests : `tomorrow.util.test.ts`, `next-appointment.util.test.ts`, `dashboard-greeting.util.test.ts` passent (adapter uniquement les imports/noms, jamais les valeurs attendues) ; +1 cas par util prouvant la sortie inchangée sur une date fixe
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.ts` | E | L22 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.test.ts` | E | imports |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/next-appointment-widget.tsx` | E | L18 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/next-appointment.util.ts` | E | L46 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/next-appointment.util.test.ts` | E | imports |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.tsx` | E | L11 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.util.ts` | E | L21 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.util.test.ts` | E | imports |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/month-calendar/month-calendar.tsx` | E | L61, L52 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | contrat |

## Contrats
```ts
// src/shared/lib/format/date.ts (commité) — .tsx : import { … } from "@/shared/lib/format/date" ; *.util.ts testé sous node : import RELATIF suffixé .ts (ex. ../../../../../shared/lib/format/date.ts)
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // fr-FR {day:numeric, month:short} → "5 oct."  (remplace aussi les 2-digit "05 oct." : voulu)
export const longDate = (d: DateLike): string        // fr-FR {weekday:long, day:numeric, month:long} → "lundi 5 octobre"
export const hhmm = (d: DateLike | number): string   // "09:05" ; number = minutes depuis minuit
export const capitalize = (s: string): string
export const plural = (n: number, singular: string, pluralForm = singular + "s"): string
// RÈGLE : sortie identique octet pour octet à l ancien appel (la lib est validée T014) sauf 2-digit → numeric ; XhMM ("9h05", next-appointment.util.ts:28) reste LOCAL ; format {day:numeric, month:long} (next-appointment.util.ts:47) reste LOCAL
// un *.util.ts ne doit importer ni .tsx ni react ni dashboard-widgets
```

## Décisions actées
- lib validée octet pour octet (T014) ; XhMM et {day,month:long} restent locaux — decisions
- `tomorrow-widget.tsx`, `free-slots-widget.tsx` → T040 (collision) ; ne pas toucher

## Hors périmètre
- tomorrow-widget.tsx, free-slots-widget.tsx (T040) ; unpaid, recent, revenue, clock (T039) ; logique métier

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser dans `## Écarts`.
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node --test, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` ; KO HORS WL = à lister, pas à corriger
- lint : `npx eslint <fichiers WL>` seulement
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T038
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
