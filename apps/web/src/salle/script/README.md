# salle/script

Hooks et logique non visuelle du module salle.

- `scene.ts` — `toScene` (SalleState → BuildingScene), `deckRoles`
- `route.ts` — `parseSlug`, `neighbourFloor`, `useFloorRoute` (seul appelant de showFloor/showBuilding), `useFloorKeys`

S'appuie sur : api/state, shared/lib/store, engine/building (types)
