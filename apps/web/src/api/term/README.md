# api/term

Entité term : session terminal du chef (démon `bin/terminal.py`), POST JSON + jeton, flux SSE.

- `schema.ts` : schémas Zod du contrat `dash.py api/term/*` (`TermOpen`, `TermIn`, `TermEtat`, `TermSize`, `TermInBody`, `TermOk`), `TERM_IN_MAX`
- `crud.ts` : appels `api/term/*` (open, entrée, taille, stop, état), `EventSource` sur `api/term/stream`

S'appuie sur : zod, api/state (`ApiError`, `ApiErreurSchema`, `kindDeStatut`). Invariant : aucune donnée réseau sans parse Zod. ← [[../README.md]]
