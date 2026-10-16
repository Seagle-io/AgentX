# showcase — vitrine du kit `shared/ui`

Route `/showcase` (`routes.tsx`, agrégée dans `main.tsx` par le module racine).
`pages/ShowcasePage.tsx` : titre, sommaire (`scrollIntoView`, routeur hash) et sections empilées.
`component/*Section.tsx` : une section par composant du kit (toutes variantes, tailles, états),
plus `IconsSection` (26 noms, 3 tailles, repli inconnu) et `TokensSection` (20 couleurs, classes littérales).
Libellés : `shared/lib/i18n/local/fr/showcase.ts` (ns `showcase`) ; les valeurs d'API affichées sont des données.
Aucune logique : pas de `script/`, pas de `tests/`, 0 `fetch`, 0 store, 1 seul `Badge pulse`.
