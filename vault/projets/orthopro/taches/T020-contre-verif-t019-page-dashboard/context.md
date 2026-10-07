---
pack: T020
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T020 — Contre-vérif T019 (page dashboard)

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Vérifier que les 4 défauts T013 sont clos dans `dashboard-page.tsx` / `use-dashboard-activity.ts`, avec la même méthode (traçage des écritures + sonde query-core), et chercher une régression introduite par T019.

## Definition of Done
- [ ] D1 : énumérer toutes les écritures (`rg -n "saveDashboardLayout|saveLayout.mutate|updateDashboardCellConfig|saveWhole"`) ; pour chacune, citer la garde incluant `!layoutError` ; état B2 (données + isError) : prouver que l'édition se termine (effet L181-190) ET que `saving`/disabled bloque Enregistrer avant le démontage
- [ ] D2 : sonde query-core (QueryObserver, retry:false, comme T013) : séquence error → refetch pending → error : `layoutFailed` reste vrai (lecture du code : L105-122) ; EmptyState rendu tout du long, TabBar absente ; après success : `layoutFailed` faux, grille rendue
- [ ] D3 : `use-dashboard-activity.ts` : `days`/`todaySlots` sous useMemo deps `[appointments, todayIso]` ; `todayIso` stable entre rendus (sinon memo inutile : citer sa définition) ; `NO_APPOINTMENTS` hors composant
- [ ] D4 : lire L137-152 : PUT KO → toast error + `migrated.current=false` ; prefs KO → setSaved conservé + toast warning + 0 réessai ; vérifier qu'un PUT KO ne déclenche pas une boucle de réessai à chaque rendu (`migrated.current=false` + effet re-exécuté ?)
- [ ] régression : `eslint-disable react-hooks/exhaustive-deps` L~190 — lister ce que l'effet lit et ce qui manque aux deps ; cas « stopEditing change » : effet rejoué à tort ? 
- [ ] `npx eslint` 2 fichiers, `npm run typecheck`, `npm run test:unit` → sorties collées (2 fail `clock.probe.test.ts` connus = HP si encore présents)
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | D1 D2 D4 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-dashboard-activity.ts` | L | D3 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | prop saving |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | Personnaliser |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t020.probe.test.ts` | E | sonde query-core, supprimer à la fin |

## Contrats
```ts
// défauts T013 à clore
// 1. layoutReady ignorait layoutError → Enregistrer actif sur données périmées (B2)
// 2. Réessayer sans données : isError repasse faux (status 'pending' si data undefined) → squelette défaut réapparaît
// 3. memo context inefficace : days/todaySlots recréés (use-dashboard-activity.ts L51, L66)
// 4. .catch unique migration : prefs KO → toast « impossible » alors que PUT OK
// livré T019
// :105-122 layoutFailed useState (vrai sur isError, faux sur isSuccess) ; layoutError = layoutFailed || isError ; layoutReady = saved != null && !layoutError
// :137-152 .then(ok, ko) ; prefs KO → .catch interne, toast warning
// :181-190 effet editing && layoutError → stopEditing() + toast
// :418 saving={saveLayout.isPending || !layoutReady}
// use-dashboard-activity.ts:1,16,43-75 NO_APPOINTMENTS ; useMemo [appointments, todayIso]
// sonde : import { QueryClient, QueryObserver } from '@tanstack/query-core' (node_modules, lecture tolérée) — reproduire la séquence et coller les états
/// <reference types="node" /> · node:test · node:assert/strict · PATH node 24
```

## Décisions actées
- sortir de l'édition sur erreur — decisions T019
- QueryClient non modifié — HP

## Hors périmètre
- corriger ; widgets ; grid.tsx ; dashboard-widgets.tsx

## Budget
- Lectures hors whitelist : **3 maximum** (node_modules/@tanstack/query-core compte pour 1), à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git diff, git status, rm de la sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T020
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
- Dn : preuve (lignes citées / sortie sonde)
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
