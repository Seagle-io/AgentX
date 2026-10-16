# todo — panneau « À faire »

Module sans route. `component/TodoPanel.tsx` (export défaut, props `{}`) lit
`useSalleState(slug, selectTodo)` ; `script/select.ts` : `selectTodo`, `canRun`
(`RunBodySchema.safeParse(exe)`). Boutons : ▶ si `canRun`, ⧉ si `cmd`, étage si
`projet`. i18n ns `todo` (`shared/lib/i18n/local/fr/todo.ts`). Tests :
`tests/select.ts` (sélecteurs seuls, env node).
