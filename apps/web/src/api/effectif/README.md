# api/effectif

Recruter / licencier un poste de rôle sur un étage (salle-recrutement).

- `schema.ts` : action, corps (étage + rôle), réponse `{ ok, etage, postes }`.
- `crud.ts` : `changerEffectif` → `POST api/effectif/{recruter,licencier}` avec le jeton ; 400 ⇒ `erreur` du corps via `echecHttp`.
- `hooks.ts` : `useEffectif(slug)` mutation ; relit `["state"]` en fin d'appel.
- Plafonds et postes courants : `etage.effectif` de l'état (`api/state`), jamais recopiés.
