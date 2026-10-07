---
tache: T039
statut: fait
---
## Livré
- unpaid-invoices/unpaid-invoices-widget.tsx:4 — import `plural, shortDate` lib ; helper local L14-15 supprimé
- unpaid-invoices/unpaid-invoices-widget.tsx:44 — `plural(overdueCount,'échu')`, `plural(overdueCount,'facture')`
- recent-documents/recent-documents-widget.tsx:6,56 — `dayLabel` local supprimé → `shortDate(doc.createdAt)`
- revenue/revenue-widget.tsx:4,74 — `plural(current.count,'facture')`
- clock/clock.util.ts:2,32 — import relatif `.ts` lib ; `export { longDate }` (clock-widget.tsx:14 l'importe de `./clock.util`, L)
- clock/clock.util.ts:90 — `moreLabel` → `plural(more,'autre')` (DoD rg 0 hit)
- clock/clock.util.test.ts — ∅ modif ; cas longDate conservé via ré-export
## Vérifié comment
rg -n "toLocaleDateString|toLocaleTimeString|\? 's' :" <4 fichiers> → ∅ (rc=1)
npm run test:unit → tests 395 · pass 395 · fail 0
npm run typecheck → tsc ×3 sortie vide, rc 0
npx eslint <4 WL + clock.util.test.ts> → ∅ (rc=0)
## Écarts
- ∅ lecture hors WL
- unpaid dueDate/issueDate : ancien `${iso.slice(0,10)}T00:00:00` (minuit local) → lib `new Date(iso)` ; identique sauf ISO datetime UTC proche de minuit (TZ ouest) — contrat « lib validée T014 »
## Pour la suite
- `git status` : 15 autres fichiers widget modifiés hors WL (vagues parallèles) — non touchés
- clock.util.ts garde `export { longDate }` tant que clock-widget.tsx:14 importe de `./clock.util`
## Retour sur le pack
- Manquait: clock.util.ts:90 `moreLabel` pluriel inline non listé dans DoD mais couvert par rg → traité
- Inutile: ∅
## Reprise
- T043 D1 : src/shared/lib/format/date.ts:8-15 — `toDate` : `/^\d{4}-\d{2}-\d{2}$/` → `new Date(y,m-1,d)` minuit local ; Date/ISO datetime inchangés
- src/shared/lib/format/date.test.ts:26-38 — +3 cas (shortDate/longDate/hhmm sur « 2026-10-05 » = minuit local)
- TZ=America/Martinique node --test date.test.ts → tests 17 · pass 17 · fail 0
- TZ=Europe/Paris node --test date.test.ts → tests 17 · pass 17 · fail 0
- npm run test:unit → tests 402 · pass 402 · fail 0 ; npm run typecheck → rc 0 ; npx eslint date.ts date.test.ts → ∅ (rc 0)
- Écart précédent (unpaid minuit local) → résolu
