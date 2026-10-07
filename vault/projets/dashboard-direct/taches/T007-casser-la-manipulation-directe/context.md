---
pack: T007
projet: dashboard-direct
role: verificateur
cree: 2026-10-06
---

# Pack T007 — Casser la manipulation directe

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter les livraisons T003-T006 (dashboard ortho-front en manipulation directe, sans mode édition) : compilation d'ensemble, tests unitaires, cohérence des contrats entre les 4 fichiers, contre-exemples sur l'auto-save et le DnD. Verdict `CONFORME` / `DÉFAUTS` / `NON VÉRIFIABLE`.

## Definition of Done
- [ ] `npx tsc -b` → sortie brute collée (0 erreur attendu) ; `npm run lint` → collé ; `npm run build` → collé ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → collé
- [ ] chaque ligne « Vérifié comment » des 4 result.md rejouée ; tout écart ≠ déclaré → défaut n°1
- [ ] rg `editing|dash-edit|dash-save\b|dash-placement|dash-grip|EditHeader|EditCell|useBlocker|updateDashboardCellConfig` src/modules/dashboard → 0 (sinon défaut avec lignes)
- [ ] contrats croisés : props passées par `dashboard-page.tsx` à `DashboardGrid`, `CellChrome`, `CataloguePanel`, `DashboardTabBar` = signatures exportées (tsc le dit ; confirmer à la lecture des 4 call-sites)
- [ ] auto-save : lire `use-layout-autosave.ts` et chercher : 2 PUT en vol · schedule pendant `saving` perdu · `flush` sans timer · `enabled` false → timer vivant · écho serveur qui `reset` l'historique après un geste local · beforeunload
- [ ] grille : `DROPPING_ID` filtré dans `handleLayoutChange` · `cancel` couvre input/button/`.dash-nodrag` · pile < 640 sans RGL · `interactive=false` → ∅ drag
- [ ] e2e : `npx tsc -p tsconfig.e2e.json` ; sélecteurs des specs ∈ testids réellement posés dans src (rg chaque `dash-*` des specs → ≥ 1 hit src, sinon défaut) ; exécution Playwright seulement si `curl -s http://127.0.0.1:5183` (front de test, `TEST_FRONT_PORT` du Makefile) répond, sinon `NV — stack absente`
- [ ] `result.md` : verdict en tête, défauts du plus grave au plus bénin, chacun `fichier:ligne` + scénario + commande de repro

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-direct/taches/T003-grille-directe-drag-partout-poignee-droppable/result.md` | L | affirmations à rejouer |
| `vault/projets/dashboard-direct/taches/T004-page-retrait-du-mode-edition-auto-save-undo-redo/result.md` | L | |
| `vault/projets/dashboard-direct/taches/T005-chrome-de-case-catalogue-flottant-onglets-en-pla/result.md` | L | |
| `vault/projets/dashboard-direct/taches/T006-specs-e2e-de-la-manipulation-directe/result.md` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-layout-autosave.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/autosave.core.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/cell-chrome.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/` | L | 4 specs |

## Contrats
Attendus (architecte T002) :
```ts
// grid.tsx
export type DashboardGridProps = { layout: LayoutCell[]; width: number; interactive: boolean; onLayoutChange: (layout: LayoutCell[], byUser: boolean) => void; renderCell: (cell: LayoutCell) => ReactNode; dragging?: DropCandidate | null; dragLabel?: string; onDropWidget?: (widget: string, at: DropPlace) => void; className?: string }
dragConfig = { enabled: live, cancel: DRAG_CANCEL, threshold: 6 } · resizeConfig = { enabled: live, handles: ['e','s','se'] } · dropConfig.enabled = live && !!onDropWidget
// use-layout-autosave.ts
export type LayoutAutosave = { status: 'idle'|'pending'|'saving'|'error'; error: Error | null; schedule(): void; flush(): void }
// debounce 800 · 1 PUT en vol · dirty → tir immédiat après succès · échec : 'error', ∅ retry auto · enabled false → timer annulé, 'idle'
// page : history = état affiché ; reset seulement si (tabs ≠ echo) && status==='idle' && !sameTabs(tabs, history.value)
// cell-chrome.tsx : root .dash-cell-chrome tabIndex=0 ; outils .dash-nodrag ; clavier flèches/Maj+flèches/Suppr/Entrée/Échap si e.target===currentTarget
// tab-bar.tsx : dash-tab[data-tab-id] dash-tab-add dash-tab-menu dash-tab-rename-input dash-tab-color dash-tab-remove dash-undo dash-redo dash-save-status[data-status] dash-add-widget dash-more dash-reset
```

## Décisions actées
- tu ne corriges rien ; tu rapportes avec repro — rôle
- un test vert sans sortie collée = non vérifié = défaut

## Hors périmètre
- Lancer la stack e2e (`make test-e2e`, back, DB) : interdit ; constate l'absence.
- Style, préférences, « on pourrait aussi ».

## Budget
- Lectures hors whitelist : **5 maximum**, chacune journalisée dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, `Bash(npx tsc:*)`, `Bash(npm run lint:*)`, `Bash(npm run build:*)`, `Bash(npm run test:unit:*)`, `Bash(npx playwright test:*)`, `Bash(rg:*)`, `Bash(curl -s http://127.0.0.1:*)`, `Bash(git diff:*)`, `Bash(git status:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T007
statut: fait | bloque
---
## Livré
VERDICT: CONFORME | DÉFAUTS | NON VÉRIFIABLE
- D1 (grave→bénin) fichier:ligne — scénario entrée/état → sortie fausse — repro: commande
## Vérifié comment
commande → sortie brute (tsc, lint, build, test:unit, rejeu des 4 result.md)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : ce qu'une tâche de correction doit recopier dans ses Contrats
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
