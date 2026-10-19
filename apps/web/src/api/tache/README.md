# api/tache

Entité tâche : lecture seule d'un ticket (`GET api/tache?projet=&tid=`, 0 jeton).

- `schema.ts` : `TacheSchema`, type `Tache` (en-tête, `pack`, `result` null si absent)
- `crud.ts` : `fetchTache(slug, tid, signal)` ; `appeler`/`echecHttp` viennent de `api/state/crud`
- `hooks.ts` : `useTache(slug, tid, enabled)` (`staleTime` 10 s)

S'appuie sur : zod, TanStack Query, api/state. ← [[../README.md]]
