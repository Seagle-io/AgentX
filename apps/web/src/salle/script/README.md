# salle/script

Hooks et logique non visuelle du module salle.

- `deck.ts` — `deckRoles` (rôles à tâche + chef + vault)
- `route.ts` — `parseSlug`, `neighbourFloor`, `useFloorRoute` (seul appelant de showFloor/showBuilding), `useFloorKeys`

S'appuie sur : api/state, shared/lib/store
