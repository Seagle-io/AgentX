# showcase/component/salle

Vitrine « Salle vivante » : SVG et animations de la salle v1, pour valider à l'œil. Le dessin vit dans `@/engine/svg`
(partagé avec l'immeuble v2) ; ici, seulement les vignettes.

- `samples.ts` — catalogue des vignettes (nom v1 · état · emprise), appels `@/engine/svg/*`
- `galerie/` — 1 fichier par vignette : `fusee-1-{calme,active}`,
  `poubelle-p1-{vide,pleine}` (T132 : corbeille grillagée ; n = 0 et 29),`salle-{calme,chargee}`,
  `salle-s{1,2}` (T128 : S1 « atelier » appliquée, S2 « studio » ; S2 reprend la `vue` de S1),
  `arc-b-{actif,bloque}` (T118 : échanges impulsion, scène commune `arc-scene.ts`),
  `tour-t1` (T130 : immeuble, `tourImmeuble(vue)`),
  `signal-lampe-{calme,alerte}` (T100 : gyrophare mural L1)
- `Vignette.tsx` — cadre, ×1/×3, fond sombre et clair, case « validé pour GIF »
- `useValidated.ts` — cases cochées, `localStorage` `agentx:showcase:valide`
