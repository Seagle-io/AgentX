---
tache: T009
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts:1-84` — créé, 15 exports purs : `handAngles` `handSegment` `tickSegment` `seconds` `longDate` `QUICK_MINUTES` `QUICK_DAYS` `quickLabel` `inDays` `alarmDate` `alarmInput` `alarmProblem` `reminderDescription` `SHOWN` `nextReminders` `moreLabel`
- `…/clock/clock.util.test.ts:1-104` — créé, 16 cas : minuit, changement de mois, passé/futur, saisie incomplète, tri+overflow+imminence
- `…/clock/clock-widget.tsx:1-168` — 261 → 168 l. ; racine `<WidgetCard icon='clock' title='Horloge' actions=… bodyClassName=…>` L127-164 ; vide → `WidgetNote` L157 ; `remove` L124-125 `.catch((e: Error) => addToast({ variant: 'error', title: 'Suppression impossible', description: e.message }))`
- `…/clock/index.tsx` — ∅ (`git diff` vide)
- `clock.util.ts:1` — import relatif `../../../../../shared/lib/reminders/reminders.ts` (alias `@/` non résolu par `node --test`) ; `allowImportingTsExtensions: true` déjà actif

## Vérifié comment
- `node --test src/…/clock/clock.util.test.ts` → `ℹ tests 16 · pass 16 · fail 0`
- `npm run test:unit` → `ℹ tests 308 · pass 306 · fail 2` ; les 2 KO = `edit/layout-ops` (`place: sur une case occupée…`, `readTabs…`, `cleanLayout…`) — hors WL, fichier `M` dans l'arbre avant moi, 0 import de clock
- `npm run typecheck` → 2 erreurs, 0 dans `widget/clock/` : `onboarding-widget.tsx(15,39) TS2305 widgetState` · `dashboard-widgets.tsx(73,37) TS2304 WidgetGrid` — fichiers hors WL, modifiés par d'autres tâches en cours
- `npx eslint src/modules/dashboard/components/widget/clock/` → ∅ (0 problème) ; `npm run lint` global → 755 erreurs `@stylistic/jsx-quotes` etc., toutes hors `clock/`
- `rg -n WidgetCard clock-widget.tsx` → L13, L127, L164
- `wc -l clock-widget.tsx` → 168 ≤ 170

## Écarts
- lecture hors WL : `tsconfig.app.json`, `package.json` (grep `paths`, `allowImportingTsExtensions`, `test:unit`) — alias `@/` KO sous node, bloquant pour le test
- lecture hors WL : `revenue/revenue.util.ts:1-5` — vérifier si précédent d'import `.ts` relatif (∅ : revenue.util sans import)
- DoD 1 : un seul `.catch(() => {})` existait (L193, `remove`) ; `add` L184-191 toastait déjà → inchangé
- DoD « test:unit fail 0 » : fail 2, hors périmètre (arbre sale, tâches parallèles) ; `clock` seul : fail 0
- `clock-widget.tsx` : lignes JSX compactées (≤ 170 imposé) ; `Dial`/`AlarmDialog` restent dans le fichier (pas de fichier WL pour les sortir)

## Pour la suite
- `clock.util.ts:1` import relatif `.ts` vers `shared/lib/reminders` : à remplacer par `@/` si un loader alias (tsx / `--import`) arrive au runner ; T006 (module dates) prendra `longDate`
- Précédent : tout `*.util.ts` important du code partagé doit utiliser un chemin relatif `.ts` pour rester testable sous `node --test`
- `edit/layout-ops.test.ts` : 2-3 KO dans l'arbre courant (hors T009) — à vérifier par la tâche propriétaire
- `clock-widget.tsx` 168 l. : si re-découpe voulue → `clock-dial.tsx` (Dial, 32 l.) + `alarm-dialog.tsx` (65 l.)
- `widget-card.tsx` : body `overflow-y-auto` + `@container/clock` posés via `bodyClassName` — vérifier visuellement l'oscillation `motion.div` dans la case

## Retour sur le pack
- Manquait : le runner `node --test` ne résout pas `@/` → consigne « imports relatifs `.ts` dans les util testés » ; état de l'arbre (tests/typecheck déjà KO hors périmètre) pour fixer la DoD « fail 0 » au périmètre
- Inutile : `types.ts`, `use-reminders.ts` en WL (0 ouverture nécessaire au-delà du contrat recopié)
