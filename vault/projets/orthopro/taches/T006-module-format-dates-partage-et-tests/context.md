---
pack: T006
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T006 — Module format dates partagé

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer `src/shared/lib/format/date.ts` (+ test) qui unifie 4 formats dupliqués dans 14 widgets ; ne migrer AUCUN appelant (vague 3).

## Definition of Done
- [ ] `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` exporte exactement : `shortDate`, `longDate`, `hhmm`, `capitalize`, `plural` (contrat ci-dessous)
- [ ] résultats identiques octet pour octet aux appels existants : `shortDate(new Date(2026,9,5))` === `new Date(2026,9,5).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})` ; idem `longDate` avec `{weekday:'long',day:'numeric',month:'long'}` ; `hhmm` = `HH:MM` zéro-paddé 24 h
- [ ] `date.test.ts` ≥ 12 cas : chaque fonction, entrées `Date` et ISO string, minuit, 23:59, pluriel 0/1/2, capitalize chaîne vide
- [ ] si `src/shared/lib/i18n/i18n.ts` expose déjà un formateur de date : l'utiliser à l'intérieur, ne pas dupliquer — noter la décision dans result
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck`, `npm run lint` → sorties collées
- [ ] `result.md` : `## Pour la suite` = tableau des 14 appelants (recopié ci-dessous) avec la fonction cible — pour les packs de migration
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/i18n/i18n.ts` | L | ne pas dupliquer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | L | L23 hhmm, L118 longue — référence |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/dashboard-worklists.tsx` | L | L73 courte — référence |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.ts` | L | L22 longue + capitalize |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/next-appointment.util.ts` | L | L28 XhMM, L46 capitalize |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.util.ts` | L | L21 hhmm |

## Contrats
```ts
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // '5 oct.'           fr-FR {day:'numeric',month:'short'}
export const longDate = (d: DateLike): string        // 'lundi 5 octobre'  fr-FR {weekday:'long',day:'numeric',month:'long'}
export const hhmm = (d: DateLike | number): string   // '09:05' ; number = minutes depuis minuit
export const capitalize = (s: string): string        // 1er caractère majuscule, reste intact
export const plural = (n: number, singular: string, pluralForm = singular + 's'): string  // n>1 → pluralForm
// appelants (ne pas modifier) :
// courte ×4 : worklists/dashboard-worklists.tsx:73, unpaid-invoices/unpaid-invoices-widget.tsx:15, recent-documents/recent-documents-widget.tsx:13, forum/dashboard-forum.tsx:15
// hhmm ×5 : today/today-widget.tsx:23, tomorrow/tomorrow-widget.tsx:18, next-appointment/next-appointment-widget.tsx:18, free-slots/free-slots-widget.tsx:21, greeting/dashboard-greeting.util.ts:21 (+ XhMM next-appointment.util.ts:28)
// longue ×5 : clock/clock-widget.tsx:221, today/today-widget.tsx:118, greeting/dashboard-greeting.tsx:11, tomorrow/tomorrow.util.ts:22, month-calendar/month-calendar.tsx:61
// capitalize ×2 : next-appointment.util.ts:46, tomorrow.util.ts:22 ; pluriel inline ×4 : kpi/index.tsx, unpaid-invoices-widget.tsx:46, revenue-widget.tsx:73, activity-year.tsx:19
// pattern test existant (revenue.util.test.ts:1-5)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts obligatoire
// runner : "test:unit": "node --test 'src/**/*.test.ts'"  (node 24 ; 243 tests verts au départ)
```

## Décisions actées
- module créé seul, migration en vague 3 — 7 lots parallèles touchent widget/*
- locale fr-FR codée en dur comme les appelants — iso-fonctionnel
- euros : `ctx.displayEuros` existe, HP

## Hors périmètre
- modifier un widget ; `Intl.NumberFormat` ; i18n multi-locale

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
tache: T006
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
