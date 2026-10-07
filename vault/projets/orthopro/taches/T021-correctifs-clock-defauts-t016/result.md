---
tache: T021
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts:58-70` — C1 C2 — `TIME` recopiée ; `alarmProblem(input, now, date = input.date)` : heure hors `HH:MM` ou `date` vide → `'incomplete'` (daily inclus)
- `…/clock/clock-widget.tsx:63` — C1 — `alarmProblem(input, new Date(), date)` : champ jour du formulaire passé → daily + jour vidé bloque bouton + submit (= HEAD `!date`)
- `…/clock/clock-widget.tsx:124` — C3 — `.catch((e: unknown) => … e instanceof Error ? e.message : undefined)`
- `…/clock/clock.util.test.ts:57-68` — +4 cas : daily sans date → incomplete ; `'25:00'`, `'9:00'` → incomplete ; `'09:00'` → null ; 2 cas daily existants reçoivent `date` explicite (L60, L75)
## Vérifié comment
`node --test …/clock/clock.util.test.ts` → `tests 17 · pass 17 · fail 0`
`npx eslint …/clock/` → ∅ sortie, exit 0
`npm run typecheck` → tsc ×3 sans erreur, exit 0
## Écarts
- signature `alarmProblem` +1 param optionnel `date` (ReminderInput daily n'a pas de date ; seul moyen de voir le champ vidé sans toucher reminders.ts) — pack « C1? » le permettait
- tests existants L60/L75 modifiés (daily → `date` passée) : sémantique « daily sans 3e arg → incomplete » assumée
- lectures hors WL : ∅
## Pour la suite
- `clock.util.ts` + `clock.util.test.ts` untracked (`??`) : à `git add` avec clock-widget.tsx
- `'25:00'` impossible depuis `<input type=time>` ; garde utile seulement hors navigateur
## Retour sur le pack
- Manquait: précision que `alarmInput` écarte `date` en daily (impose le 3e param ou un refactor) | Inutile: ∅
