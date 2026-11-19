# salle/pages

Pages routées du module salle, rendues dans l'Outlet de SalleLayout.

- `DecisionsPage.tsx` — route index et `floor/:slug` : BarreEtage + BoiteDecisions + ConsolePanel
- `BuildingPage.tsx` — canvas immeuble + FloorList (navigation vers `/floor/:slug`)
- `FloorPage.tsx` — canvas étage + Deck + PipelinePanel/ConsolePanel
- `BasementPage.tsx` — sous-sol : archives des projets clos

S'appuie sur : salle/component, pipeline, console

← [[../README.md]]
