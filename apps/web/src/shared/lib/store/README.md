# shared/lib/store

Stores Zustand partagés entre modules et engine.

- `salle.ts` : `useSalleUi` (`view`, `selectedFloor`, `hoveredDesk` ; `showFloor` `showBuilding` `hoverDesk`), sélecteurs `selectView selectFloor selectHoveredDesk`

S'appuie sur : zustand. Invariant : 0 donnée serveur dans un store ; la route est la source, le store son miroir.

← [[../README.md]]
