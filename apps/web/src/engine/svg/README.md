# engine/svg

SVG de la salle v1 en chaînes, TS pur (règle 1). Une source pour la galerie (`showcase/component/salle`) et la salle (`salle/component/ImmeubleGrand`, `ImmeublePlat`). Rendu par `dangerouslySetInnerHTML` : tout texte venu des données passe par `esc`.

- `iso.ts` — iso, boite, ombrer, esc, étiquette, couleurs de rôle
- `fantome.ts` — mascotte (frange b2, yeux rouges glow), équipe, bureau, `GLOW_DEFS`
- `objets.ts` — rack, fusée F1, poubelle
- `props.ts` — props de décor (T084), lampe d'alerte (T086), aquarium A1 à couvercle et bocal A2 (T089)
- `coupe.ts` — tour en coupe : coque d'un niveau, poste, toit, cabine, plaque, gyro
- `meuble.ts` — props d'un niveau, tirage déterministe par slug (T090), tour meublée
- `plaque.ts` — plaques d'étage, chef, sous-sol ; gaine + cabine ; sous-sol
- `tour.ts` — `tourImmeuble(TourVue)` : l'immeuble v2 (1 fantôme par type d'agent)
- `style.ts` — règles et keyframes `v1-*`, portée `.v1-scene`, injectées 1× par page
- `plat.ts` — immeuble à plat (coupe frontale) : `niveauPlat`, `immeubleGrand`, `sousSolPlat`, `salleSousSol`, `PF_CSS`
