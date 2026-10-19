# api/state

Entité state : lecture de `/state.json`, envoi de `api/run`, hooks TanStack.

- `schema.ts` : schémas Zod (strip, `.catch()` sur les énumérations), types `SalleState Role Tache Etage Flux TodoItem Action RunBody RunResult`
- `crud.ts` : `fetchState`, `runCommand`, `ApiError(kind, status, message)`, `kindDeStatut`, `stateKey` ; seul appel réseau du front
- `hooks.ts` : `useSalleState(slug, select?)` (poll 2 s), `useRunCommand(slug)`, `useLastRun()`
- `fixture.ts` : relevé réel tronqué, parsé par `tests/schema.ts`

S'appuie sur : zod, TanStack Query. Invariant : aucune donnée réseau sans parse Zod, aucun `as`. ← [[../README.md]]
