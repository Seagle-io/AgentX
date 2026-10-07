---
tache: T016
statut: fait
verdict: DÉFAUTS
---
## Vérifié comment
- `node --test …/clock/clock.util.test.ts` → `tests 16 · pass 16 · fail 0`
- `npx eslint …/clock/` → ∅ sortie, exit 0
- `git diff --stat …/clock/` → `clock-widget.tsx | 217 ++++---- · 62 insertions(+), 155 deletions(-)` ; util + test `??` (non suivis)
- `git diff …/clock/index.tsx | wc -l` → `0`
- `wc -l clock-widget.tsx` → `168` ; `git show HEAD:… | wc -l` → `261` ; HEAD L193 `.catch(() => {})` seul
- `rg -n "catch\(\(\) => \{\}\)|catch\(\(\) =>" …/clock/` → ∅, exit 1
- `npx tsc -p tsconfig.app.json --noEmit | grep -c "error TS"` → `0` ; `--listFiles` inclut clock.util.ts, clock.util.test.ts, reminders.ts ; `allowImportingTsExtensions: true`
- import relatif `.ts` L1 : node OK (16 pass) · tsc OK (0 erreur)
- sonde 14 cas `TZ=Europe/Paris node --test clock.probe.test.ts` → `pass 12 · fail 2` (P11, P12) ; idem `TZ=America/Santiago`
  - OK : handAngles 00:00:00 {0,0,0} · 12:00:00 {0,0,0} · 23:59:59 {h 359.99166, m 359.9, s 354}
  - OK : inDays/alarmDate 31/10→2026-11-01 · 31/12→2027-01-01 · DST Paris 25/10, 29/03 · DST minuit Santiago 06/09, 05/04
  - OK : alarmProblem heure vide → incomplete · date veille → past
  - OK : nextReminders tri asc, more 0/1/5, moreLabel '+ 1 autre'/'+ 5 autres' ; rappel dû non sonné → soon true
  - KO : P11 `'25:00'` → null ; P12 `'9:00'` → null
- sonde supprimée ; `git status --short …/clock` → ` M clock-widget.tsx` · `?? clock.util.test.ts` · `?? clock.util.ts`
## Défauts
- 1. clock.util.ts:59-63 — `alarmProblem` accepte une heure hors `HH:MM` — bénin, préexistant (HEAD `past = Boolean(time && date) && isInPast(...)`), inatteignable via `<input type=time>`
  - repro : `alarmProblem({ time: '25:00', label: '', repeat: 'once', date: '2026-10-06' }, new Date(2026, 9, 6, 12))` → `null` (attendu ≠ null) ; `'9:00'` → `null` à 12:00, alors que l'heure est passée
  - conséquence si atteint : `createReminder` stocke '25:00' → `readReminders` (regex TIME) l'écarte au rechargement → alarme perdue sans message
## Comportements modifiés hors extraction
- soumission quotidienne avec champ jour vidé : avant `!date` bloquait bouton + submit (HEAD `!time || !date || past`) / après autorisée (`alarmProblem` ignore date si daily) — correction de fait, à valider
- suppression KO : avant avalée `.catch(() => {})` HEAD L193 / après toast erreur L123-124 — voulu T009
- en-tête : avant pastille size-8 rounded-[10px], icône h-4, titre `span text-[13px] font-medium text-text-muted`, gap-3 sans filet / après WidgetCard : size-7 rounded-[9px], icône h-3.5, `Text h4 text-sm font-semibold`, filet border-b px-4 py-3
- corps : après `min-h-0 flex-1 overflow-y-auto` + section `overflow-hidden` + `dash-hue` (absents avant) — oscillation framer-motion ±3° et drop-shadow 14px possiblement rognés — NV visuel
- `@container/clock` : avant sur section / après sur div corps — même largeur de contenu (bordure 2 + p-4 des deux côtés)
- état vide : avant `<p pt-3 text-xs text-text-muted>` / après `div pt-1` + `WidgetNote` (`Text body-dim py-2 text-xs`) — couleur body-dim NV
- inchangés : framer-motion (mêmes animate/transition), bouton « Alarme » (aria-label idem), bouton supprimer, liste 3 + reste, aiguilles (key=length 22/32/36 distinctes), useSecond
## Écarts
- ∅
## Pour la suite
- verdict DÉFAUTS = 1 bénin préexistant ; aucune régression T009 trouvée ; DoD T009 tenue
- trancher : daily + jour vidé désormais soumissible ; rognage overflow-y-auto du cadran oscillant (NV navigateur)
- remove L124 `(e: Error) => e.message` : `Promise.reject(null).catch(e => e.message)` → TypeError non gérée ; dépend de `save` (use-reminders hors WL) — NV ; `add` L121 garde `instanceof Error`
- durcir `alarmProblem` avec la regex TIME de reminders.ts (non exportée) si saisie hors navigateur un jour
## Retour sur le pack
- Manquait: `Text` variant h4/body-dim (rendu titre, couleur WidgetNote) ; use-reminders `save` (type de rejet) | Inutile: ∅
