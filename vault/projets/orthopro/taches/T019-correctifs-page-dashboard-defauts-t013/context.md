---
pack: T019
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T019 — Correctifs page dashboard (T013)

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger dans `dashboard-page.tsx` (et `use-dashboard-activity.ts` pour le memo) les 4 défauts du vérificateur T013, sans rouvrir le reste du lot T004.

## Definition of Done
- [ ] D1 : `layoutReady = saved != null && !layoutError` ; en édition quand `layoutError` devient vrai → `stopEditing()` + toast erreur « Disposition indisponible, modifications abandonnées » ; « Enregistrer » jamais actif si `layoutError`
- [ ] D2 : état local `layoutFailed` (useState) mis à vrai sur `isError`, remis à faux seulement sur `isSuccess` ; EmptyState « Disposition indisponible » reste affiché pendant le « Réessayer » (`isFetching` → bouton `disabled` + libellé « Nouvel essai… ») ; jamais de `readTabs(défaut)` ni de TabBar tant que `layoutFailed`
- [ ] D3 : `use-dashboard-activity.ts` L51 `days` et L66 `todaySlots` sous `useMemo` avec deps exhaustives ; `context` useMemo de la page devient effectif (vérif : eslint react-hooks silencieux)
- [ ] D4 : migration L129-133 → 2 `.catch` distincts : PUT KO → toast « Reprise de la disposition impossible » + `migrated.current = false` ; PUT OK mais `updatePreferences` KO → `setSaved(next)` conservé, toast warning « Disposition reprise, ancienne préférence non vidée », pas de nouvel essai
- [ ] `npx eslint` 2 fichiers → 0 ; `npm run typecheck` → 0 erreur WL ; `npm run test:unit` → fail 0 ; sorties collées
- [ ] `result.md` : section « Repro pour vérif » 4 lignes (1 par défaut : comment déclencher, résultat attendu)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | D1 D2 D4 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-dashboard-activity.ts` | E | D3 L51, L66 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | « Personnaliser » |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | bouton Enregistrer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/layouts/empty-state.tsx` | L | props |

## Contrats
```ts
// défauts T013 (verbatim)
// 1. dashboard-page.tsx:L112,L245,L394,L430 — layoutReady ignore layoutError. état B2 : données périmées + erreur (refetch KO après succès, ex. focus fenêtre). « Disposition indisponible » affiché mais « Enregistrer » actif → PUT du brouillon périmé.
// 2. dashboard-page.tsx:L118,L396,L430-438 — Réessayer sans données : isError repasse à faux (query-core : status 'pending' si data === undefined) → EmptyState démonté, TabBar + squelette readTabs(défaut) réapparaissent.
// 3. dashboard-page.tsx:L282-286 — memo context inefficace : days / todaySlots recréés à chaque rendu (use-dashboard-activity.ts:L51, L66, 0 useMemo).
// 4. dashboard-page.tsx:L129-133 — .catch unique : PUT OK + updatePreferences rejeté → toast « Reprise impossible » alors que la reprise est faite.
// état actuel (T004)
// :105-112 const { data: saved, isLoading: layoutLoading, isError: layoutError, refetch: refetchLayout, isFetching } = useQuery({ queryKey: ['dashboard-layout'], queryFn: getDashboardLayout }) ; layoutReady = saved != null
// :117-120 tabs = [] si layoutError ; :126 !saved bloque migration ; :155 startEditing garde layoutReady ; :245 mutationFn rejette si !layoutReady ; :270 setCellConfig return si !saved
// :396 TabBar masquée si layoutError ; :430-441 EmptyState + Réessayer → refetchLayout
// addToast({ variant: 'error' | 'success' | 'warning', title, description? })  — si 'warning' n'existe pas dans toast.tsx : 'error' et le noter
```

## Décisions actées
- aucun repli sur la disposition par défaut, jamais — decisions.md#2026-10-05
- sortir de l'édition sur erreur plutôt que garder un brouillon — brouillon fondé sur données périmées
- QueryClient (refetchOnWindowFocus/staleTime) non modifié — HP

## Hors périmètre
- `grid.tsx`, `dashboard-widgets.tsx`, `edit/*` (lecture seule) ; widgets ; config QueryClient ; tests e2e

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Bash(npm run, npx eslint, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T019
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — Dn — fait (≤ 8 mots)
## Repro pour vérif
- Dn : déclencheur → attendu
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
