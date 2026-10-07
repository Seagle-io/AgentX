---
pack: T039
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T039 — Dates : migration facturation, documents, revenue, clock

> Seule source de vérité de l'agent T039. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer les formateurs locaux par `@/shared/lib/format/date` dans `unpaid-invoices-widget.tsx`, `recent-documents-widget.tsx`, `revenue-widget.tsx`, `clock.util.ts` (longDate) ; supprimer les helpers morts ; tests adaptés.

## Definition of Done
- [ ] unpaid-invoices-widget.tsx:15 date courte 2-digit → `shortDate` (« 5 oct. », voulu) ; L46 pluriel inline → `plural`
- [ ] recent-documents-widget.tsx:13 date courte 2-digit → `shortDate`
- [ ] revenue-widget.tsx:73 pluriel inline → `plural`
- [ ] clock.util.ts `longDate` local → import relatif `.ts` de la lib, export local supprimé si plus utilisé par le widget (sinon ré-export 1 ligne) ; `clock.util.test.ts` : cas longDate conservé, importe la lib si besoin
- [ ] `rg -n "toLocaleDateString|toLocaleTimeString|\? 's' :" <4 fichiers>` → 0 hit (collé)
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/unpaid-invoices/unpaid-invoices-widget.tsx` | E | L15, L46 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/recent-documents/recent-documents-widget.tsx` | E | L13 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue-widget.tsx` | E | L73 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts` | E | longDate |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.test.ts` | E | imports |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock-widget.tsx` | L | usage longDate |
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
- 2-digit → numeric voulu (T024 l'a déjà fait pour worklists)

## Hors périmètre
- autres widgets ; états L/E/V ; WidgetCard

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
tache: T039
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
