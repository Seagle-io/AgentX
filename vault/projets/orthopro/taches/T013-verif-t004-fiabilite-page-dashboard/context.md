---
pack: T013
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T013 — Vérif T004 (fiabilité page)

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le lot T004 sur `dashboard-page.tsx` : par lecture ligne à ligne, prouver qu'aucun chemin ne peut enregistrer une disposition par défaut quand le layout n'est pas chargé, et que chaque état d'erreur déclaré est atteignable et visible.

## Definition of Done
- [ ] `git diff --stat src/modules/dashboard/dashboard-page.tsx` collé ; `npx eslint src/modules/dashboard/dashboard-page.tsx` collé
- [ ] traçage « layout en erreur » : lister TOUS les appels à `saveDashboardLayout`/`saveLayout.mutate`/`updateDashboardCellConfig` (`rg -n`) et pour chacun citer la garde (`layoutReady`/`saved`) ou DÉFAUT
- [ ] traçage « layout en chargement » (`saved == null`, pas d'erreur) : même exercice ; vérifier que la migration legacy (L~125-133) ne s'exécute pas sur `saved == null`
- [ ] `tabs = []` si erreur : prouver que la grille n'affiche PAS `readTabs(défaut)` et que `EmptyState « Disposition indisponible »` est rendu — citer lignes ; vérifier qu'aucun `shownTabs[0]` ne plante sur tableau vide (`activeTab` undefined → accès `.layout`/`.id` ?)
- [ ] « Réessayer » → `refetch` de `['dashboard-layout']` — citer
- [ ] `context` `useMemo` : deps exhaustives (eslint react-hooks silencieux) ; aucun objet recréé à chaque rendu dans les deps (ex. `displayEuros` inline ?) — sinon DÉFAUT « memo inefficace »
- [ ] écart déclaré « Personnaliser non désactivé visuellement » : confirmer no-op sans crash — citer
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | tout le lot |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat API |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | « Personnaliser » |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | props reçues |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/layouts/empty-state.tsx` | L | EmptyState props |

## Contrats
```ts
// déclaré livré T004 (dashboard-page.tsx)
// :105-112 query layout isError/refetch/isFetching ; layoutReady = saved != null
// :117-120 tabs = [] si layoutError, 0 repli readTabs
// :130-133 .catch migration → toast « Reprise de la disposition impossible »
// :153-162 startEditing garde layoutReady + useCallback
// :243-247 saveLayout.mutationFn rejette si !layoutReady
// :269-271 setCellConfig return si !saved
// :282-286 context useMemo
// :396 TabBar masquée si layoutError ; :430-442 EmptyState « Disposition indisponible » + « Réessayer »
export async function getDashboardLayout(): Promise<DashboardLayout>   // { saved: boolean; tabs: DashboardTabData[] }
export async function saveDashboardLayout(tabs: DashboardTabData[]): Promise<DashboardLayout>
export async function updateDashboardCellConfig(cellId: string, config: Record<string, unknown>)
```

## Décisions actées
- vérif manuelle navigateur NV acceptée — pas de stack lancée ; preuve par lecture + lint
- erreurs typecheck d'autres lots (T005) — HP

## Hors périmètre
- corriger ; `dashboard-widgets.tsx` ; widgets ; tests e2e

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git status, git diff), Write (result.md + sonde temporaire si prévue)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T013
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
