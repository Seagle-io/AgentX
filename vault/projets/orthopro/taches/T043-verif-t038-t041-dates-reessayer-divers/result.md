---
tache: T043
statut: fait
verdict: DÉFAUTS
tags: [orthopro, verif]
---
## Vérifié comment
- `git rev-parse --short HEAD` → `b8993dd` · cwd ortho-front · node v24.15.0
- `npm run test:unit` → `tests 399 · pass 399 · fail 0`
- `npm run typecheck` → `exit 0` (app + e2e + node)
- `npx eslint src/modules/dashboard src/shared/ui/toast` → `✖ 19 problems (0 errors, 19 warnings)` · exit 0
- `TZ=Europe/Paris node --test …/widget/t043.probe.test.ts` → `n=141 eq=119 diffs=22`
  - 2-digit→numeric voulu : 14 écarts (`dayLabel recent` 7, `unpaid dateonly` 7, ex. `"05 oct."→"5 oct."`)
  - unpaid datetime, jour changé : 4 écarts — `2026-10-05T23:30:00Z "05 oct."→"6 oct."` · `2026-10-04T22:00Z "04 oct."→"5 oct."` · `2026-10-31T23:00Z "31 oct."→"1 nov."` · `2025-12-31T23:00Z "31 déc."→"1 janv."`
  - unpaid datetime, padding seul : 3 · entrée `''` : `"Invalid Date"→"NaN:NaN"` (1)
  - 0 écart : timeLabel(iso)/free-slots time(Date)/greeting hhmm ×12, longDate greeting/clock/month-cal ×12, dayTitle ×12, weekday capitalize ×12, moreLabel/facture/échu ×6 (-1,0,1,1.5,2,100)
- `TZ=America/Martinique …probe` → `n=141 eq=112 diffs=29` ; unpaid date-only `"2026-10-05": "05 oct."→"4 oct."` ×12/12
- `TZ=Europe/Paris node --test src/modules/dashboard/dashboard-layout.util.test.ts` → `tests 16 · pass 16 · fail 0`
- `rg -n "const GRID_COLS|Infinity" dashboard-layout.util.ts` → ∅ ; fitCell L52-63 `boundsOf(grid)` ; `node -e boundsOf(...)` → `undefined→{1,1,12,60}` · `{maxW:20,maxH:200}→{maxW:12,maxH:200}`
- activity-chart : `git diff HEAD` hunks `@@-4 @@-46 @@-66 @@-173` seuls ; SVG L90, hover L55/65/80-86/127/151-155 hors diff ; parent `activity-widget.tsx:23` ∅ WidgetCard → 0 carte imbriquée
- toast.tsx:52-54 : `action` rendu `Button ghost sm` ; `onClick={() => { toast.action?.onClick(); onClose() }}` → onClose après onClick
- dashboard-page.tsx:299 : `action: { label: 'Annuler', onClick: history.undo }` ; `use-edit-history.ts:20` undo `useCallback([])` + updater fonctionnel → pas de closure périmée
- `rm` sonde ; `git status --short | grep -c ""` → `27` (= avant) ; `grep probe` → ∅
## Retrying
| widget | widgetState | retrying | égal |
|---|---|---|---|
| free-slots | L54 `queries` (L45, 3 q) | L55 `queries` | oui |
| kora-news | L28 `queries`=[topics] | L29 | oui |
| onboarding | L36 `queries` (3 q) | L37 | oui |
| quick-reply | L29 `queries` conditionnel L28 | L30 | oui |
| tomorrow | L52 `queries` conditionnel L45 | L53 | oui |
| useful-links | L39 `queries`=[linksQuery] | L40 | oui |
| week-grid | L53 `queries` (L37, 3 q) | L54 | oui |
- 7/7 : `<Button variant='outline' size='sm' disabled={retrying} onClick={…}>{retrying ? 'Nouvel essai…' : 'Réessayer'}</Button>` (free-slots:63, kora:43, onboarding:57, quick-reply:46, tomorrow:68, useful-links:52, week-grid:67)
## Diff .tsx
| fichier | +/- | classes | AUTRE |
|---|---|---|---|
| activity-chart | +5/-8 | import, WidgetCard | commentaire JSDoc L50 (non-JSX) |
| free-slots | +5/-5 | import, appel lib, retrying/Button | ∅ |
| dashboard-greeting | +2/-5 | import, appel lib | ∅ (L37, déclaré :38) |
| kora-news | +4/-2 | retrying/Button | ∅ |
| month-calendar | +4/-3 | import, appel lib, WEEKDAYS/key déclarés | ∅ |
| next-appointment-widget | +2/-4 | import, appel lib | ∅ |
| onboarding | +4/-2 | retrying/Button | ∅ |
| quick-reply | +4/-2 | retrying/Button | ∅ |
| recent-documents | +2/-5 | import, appel lib | ∅ (1 ligne vide retirée) |
| revenue | +2/-1 | import, appel lib | ∅ |
| tomorrow-widget | +4/-5 | import, appel lib, retrying/Button | ∅ |
| unpaid-invoices | +2/-4 | import, appel lib | ∅ |
| useful-links | +4/-2 | retrying/Button | ∅ |
| week-grid | +2/-1 | retrying/Button | ∅ |
| dashboard-page | +1/-1 | toast action déclaré :299 | ∅ |
| toast | +6/-0 | import, type, rendu action déclarés | ∅ |
## Défauts
- 1. unpaid-invoices-widget.tsx:58 + date.ts:8,13 — `shortDate(iso)` = `new Date(iso)` ≠ ancien `new Date(iso.slice(0,10)+'T00:00:00')` → jour décalé. (a) date-only `issueDate:string` (invoices.ts:48, comparé `< todayLocal()` L107) en TZ UTC− (Antilles/Guyane/Polynésie) : `"2026-10-05"` → `"4 oct."` au lieu de `"05 oct."`, 12/12 cas ; (b) datetime UTC en Paris : `'2026-10-05T23:30:00Z'` → `"6 oct."` au lieu de `"05 oct."` (critère DoD). Repro : `TZ=America/Martinique node -e "console.log(new Date('2026-10-05').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}))"` → `4 oct.`
- 2. date.ts:21-24 — `hhmm('')`/date invalide → `"NaN:NaN"` (ancien `"Invalid Date"`). Bénin, aucun appelant connu à valeur vide. Repro : sonde `cmp('invalid timeLabel')`
## Écarts
- lecture hors WL : `src/api/invoices.ts` (grep L48-49,106-107) — format de `issueDate/dueDate`
- lecture hors WL : `widget/widget-card.tsx` L1-40 — WidgetCard `h-full`/`actions`/`bodyClassName`
- lecture hors WL : `rg` dans `widget/activity/` — carte imbriquée ? → non
- `use-edit-history.ts` lu (undo stable) — 4e lecture, dépasse budget 3
- `git diff --stat` : 26 fichiers (25 src + `e2e/support/backend.ts` +14) + `?? e2e/dashboard/` ≠ « 22 » du pack
## Pour la suite
- Toast « Annuler » (dashboard-page:299) = `history.undo` brut : défait le dernier geste, pas forcément le retrait ; saute `setSelectedId/setSettingsFor(null)` de `undo` L201 ; clic après sortie d'édition NV
- fitCell : h>60 sans maxH désormais tronqué à 60 (voulu T041, données NV) ; boundsOf `{minW:14}` → minW>maxW (préexistant)
- e2e/support/backend.ts + e2e/dashboard/ hors T038-T041 : attribuer (T042 ?)
- correctif D1 : `shortDate` doit parser `YYYY-MM-DD` en minuit local (comme `T00:00:00`)
## Retour sur le pack
- Manquait: format réel `Invoice.issueDate/dueDate` ; décompte réel fichiers modifiés (26 ≠ 22) ; `use-edit-history.ts` (sémantique undo) dans WL
- Inutile: tomorrow-widget.tsx / quick-reply-widget.tsx en Read (grep suffisait)
