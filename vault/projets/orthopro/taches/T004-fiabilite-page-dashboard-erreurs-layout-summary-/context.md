---
pack: T004
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T004 — Fiabilité page dashboard

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `dashboard-page.tsx`, traiter les échecs des queries `['dashboard-layout']` et `['dashboard']` et de la migration legacy par un état visible + « Réessayer », bloquer édition/save tant que le layout n'est pas chargé, mémoïser `context`.

## Definition of Done
- [ ] `['dashboard-layout']` en erreur → `EmptyState` (ou équivalent kit UI déjà importé) titre « Disposition indisponible », bouton « Réessayer » → `refetch()` ; AUCUN repli sur `readTabs(défaut)`
- [ ] layout en erreur ou en chargement → bouton « Personnaliser »/édition désactivé, `saveLayout.mutate` impossible (garde explicite)
- [ ] `['dashboard']` (summary) en erreur → bandeau/état d'erreur avec « Réessayer » au-dessus de la grille, les widgets ne rendent pas de case vide muette
- [ ] échec de migration (L123 `.catch`) → `addToast({ variant: 'error', title: 'Reprise de la disposition impossible', description: error.message })`
- [ ] `context` (L267-276) sous `useMemo`, deps exhaustives, eslint OK
- [ ] `npm run typecheck` + `npm run lint` + `npm run test:unit` → sorties collées, 0 KO
- [ ] vérif manuelle NV acceptée MAIS décrire en 3 lignes comment reproduire l'erreur (ex. couper le back) pour le verificateur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | seul fichier modifié |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat API |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | WidgetNote |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | props grille |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | WidgetContext |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | addToast |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/layouts/empty-state.tsx` | L | EmptyState (import L10 de la page) |

## Contrats
```ts
// dashboard-page.tsx:105  (à étendre : isError, error, refetch)
const { data: saved, isLoading: layoutLoading } = useQuery({ queryKey: ['dashboard-layout'], queryFn: getDashboardLayout })
// :88-91  useQuery ['dashboard'] getDashboardSummary(30)   (idem : isError, refetch)
// :110-113
const tabs = useMemo(() => saved?.saved ? fromServer(saved, hasModule) : readTabs(legacy || undefined, hasModule), [saved, legacy, hasModule])
// :117-126 migration ; :123  .catch(() => { migrated.current = false })
// :231-239 saveLayout = useMutation({ mutationFn: (next: DashboardTab[]) => saveDashboardLayout(toServer(next)), onSuccess…, onError: (error: Error) => addToast({ variant: 'error', title: 'Disposition non enregistrée', description: error.message }) })
// :267-271 context: WidgetContext | null  (null tant que summary absent) ; :307-360 DashboardGrid (squelette L318 | EmptyState L322 | grille)
// api : getDashboardLayout(): Promise<DashboardLayout> ; DashboardLayout = { saved: boolean; tabs: DashboardTabData[] } ; throw apiError si !res.ok
// états : WidgetNote({ tone?: 'muted'|'error', children })
```

## Décisions actées
- pas de repli silencieux sur la disposition par défaut — un save écraserait la base (T001 défaut H)
- composants du kit UI uniquement, 0 nouveau composant — RULE.MD
- `dashboard-widgets.tsx` intouchable ici — T005 l'édite en parallèle ; ses exports `readTabs/fromServer/toServer` restent disponibles au même chemin

## Hors périmètre
- `grid.tsx`, `edit/*`, `dashboard-widgets.tsx`, `widget/*` — autres lots
- memo de `instanceOf`/`withBounds` dans grid.tsx — vague 3
- tests Playwright — vague 3

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, lint) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
