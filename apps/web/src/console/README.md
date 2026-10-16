# console — barre pilote, actions de tâche, sortie de commande

- `component/ConsolePanel.tsx` : 6 boutons pilote + liste `taches` de l'étage + journal + `RunOutput`
- `component/TaskActions.tsx` : 1 bouton ghost par `tache.actions[*]`, saisie motif inline
- `component/RunOutput.tsx` : dernière commande via `useLastRun()` (0 store)
- `script/actions.ts` : `toRun`, `pilotActions`, `selectConsole` (purs, testés dans `tests/`)
- données serveur (`libelle`, `cmd`, `out`, `err`) affichées telles quelles ; i18n ns `console`
