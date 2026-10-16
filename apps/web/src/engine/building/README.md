# engine/building

Moteur canvas 2D de l'immeuble, TS pur (0 React, 0 global DOM : canvas, `frame` et `palette` injectés).

- `index.ts` : `mountBuilding(canvas, input)`, `toLogical(w,h,x,y)` · `types.ts` : contrat `contrat-front.md:127-150`
- purs (testés, `tests/`) : `iso` projection + primitives · `layout` postes, objets, tour · `arcs` relais · `hit` hit-test logique
- avec ctx (non testés) : `room` vue étage · `tower` vue immeuble · `anim` colis + cabine, boucle arrêtée au repos

← [[../README.md]]
