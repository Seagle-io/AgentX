# apps/web — règles

1. `engine` est en TypeScript pur : il n'importe pas React, ne lit ni `document` ni `window`. Il reçoit un canvas et des entrées, dessine l'immeuble isométrique, émet des événements et écrit dans les stores.
2. Les modules parlent à `engine` seulement par les stores Zustand et l'interface d'entrées.
3. Un module = un dossier `src/<module>/` avec `routes.tsx`, `pages/`, `component/`, `script/`, `tests/`.
4. Les tests vivent dans `<module>/tests/`, fichiers sans suffixe, lancés par `vitest run`.
5. Aucune lib de composants. Tout composant réutilisable va dans `shared/ui`, sur le modèle `button.tsx` : unions de variantes + `Record` de classes, `const base`, `cn` avec `className` en dernier, props natives répandues, tokens seulement, état désactivé visible, choix non évidents commentés.
6. Données serveur par TanStack Query, état partagé par Zustand, état local par `useState`. Pas de données serveur recopiées dans un store.
7. `fetch` seulement dans `src/api/<entité>/crud.ts`, Zod dans les deux sens, jamais `as` sur une donnée réseau ou une URL.
8. Aucune chaîne d'interface en dur : i18n, un espace de noms par module (`shared/lib/i18n/local/fr/<module>.ts`) + `global.ts`.
9. Lint = Biome (tabulations, sans point-virgule) + `scripts/check-fetch.mjs` ; `npm run lint` vert avant de rendre.
10. Thème en CSS seulement : `data-theme` + `data-color-theme` sur `<html>`, tokens dans `index.css`, 1 déclaration par token via `light-dark()` + `color-scheme` posé par `data-theme` (light, dark, system) ; seuls les dégradés (ex. `--bg-glass`) gardent un override light.
11. Imports internes toujours par l'alias `@/…` (`@/salle/script/scene`), jamais `./` ni `../`, voisins de dossier et tests compris ; garde Biome `noRestrictedImports`.

Racine : code en anglais, commentaires et doc en français ; ≤ 400 lignes par fichier, ≤ 60 lignes par fonction ; un README par dossier ; aucune dépendance sans validation ; pas de git.
