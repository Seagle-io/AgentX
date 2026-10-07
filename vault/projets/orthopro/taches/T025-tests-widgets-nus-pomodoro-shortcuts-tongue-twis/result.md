---
tache: T025
statut: fait
---
## Livré
Racine : `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/`
- `pomodoro/pomodoro.util.ts:1-74` — créé : types, durationsOf, fresh, restore, remainingAt, started/paused, finishPhase, adoptDurations, progressOf, clock
- `pomodoro/pomodoro.util.test.ts:1-110` — créé : 14 cas
- `pomodoro/pomodoro.tsx:8-11,15-24,49-85` — importe util ; load/save/chime seuls restent ; JSX inchangé
- `shortcuts/shortcuts.util.ts:1-12` — créé : shownShortcuts(offered, value)
- `shortcuts/shortcuts.test.ts:1-42` — créé : 7 cas (config absente, [], id inconnu, doublon, ordre, module fermé, offered vide)
- `shortcuts/shortcuts.tsx:4-12` — appelle shownShortcuts ; JSX inchangé
- `tongue-twister/tongue-twister.util.ts:1-19` — créé : Skip, offsetFor, nextSkip, resetSkip, twisterParams
- `tongue-twister/tongue-twister.util.test.ts:1-35` — créé : 6 cas
- `tongue-twister/tongue-twister-widget.tsx:10,26-31,51,57` — état skip via util ; 2 onClick réécrits (même effet), 0 balise/className changée
## Vérifié comment
`npm run test:unit` → `ℹ tests 380 · ℹ pass 380 · ℹ fail 0` (base vue 353 avant mes 27 ; pack disait 315)
`npm run typecheck` → `tsc -p tsconfig.app.json … && tsc -p tsconfig.node.json --noEmit` → exit 0, 0 erreur
`npx eslint <9 fichiers WL>` → ∅ sortie, exit 0
`rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" <3 util.ts>` → ∅, exit 1
`git diff --stat` WL → `pomodoro.tsx 72 ±, shortcuts.tsx 6 ±, tongue-twister-widget.tsx 12 ±` ; `git diff -U0 | grep '<\|className'` → 2 lignes onClick tongue-twister seulement
## Écarts
- lecture hors WL: `grep tsconfig*.json allowImportingTsExtensions` + `grep from './*.ts'` dans dashboard — node exige suffixe `.ts` dans util→config imports (ERR_MODULE_NOT_FOUND) ; convention trouvée `dashboard-layout.util.ts:3`
- `shortcuts.config.ts` (L) écrasé par erreur puis restauré à l'identique — `git diff` → 0 ligne
- `shortcuts.util.ts` ne peut pas importer `shortcuts.config.ts` (sans suffixe `.ts`, L) → `chosenIds` dupliqué (1 ligne) depuis `chosenShortcuts`
- DoD 3 « choix du jour / rotation / déterminisme date » : rotation côté serveur (`api/dashboard-tongue-twister`, HP) ; widget n'a aucune logique de date → extrait le décalage « Un autre » ; test déterminisme = même séquence → même offset, pas de Date
- DoD « total ≥ 315+21 » : 380 ≥ 336 OK, mais base réelle 353 (autres agents)
## Pour la suite
- `shortcuts.config.ts:3,7` — imports sans `.ts` ⇒ intestable sous node ; `chosenShortcuts` dupliqué dans util : faire déléguer config → util (1 tâche, 2 lignes)
- `tongue-twister.config.ts` / `api/dashboard-tongue-twister.ts` HP — si rotation/jour à tester, c'est là
- `pomodoro.tsx:41-55` chime (AudioContext) et load/save (localStorage) restent non testés — effets, pas de logique
- arbre partagé : 24 autres fichiers modifiés hors WL dans `git diff` (today-widget, grid, layout-ops…) — non touchés
## Retour sur le pack
- Manquait: règle « imports relatifs dans *.util.ts avec suffixe `.ts` sinon node KO » ; DoD tongue-twister décrit une logique absente du widget ; base tests réelle (353 ≠ 315)
- Inutile: ∅
