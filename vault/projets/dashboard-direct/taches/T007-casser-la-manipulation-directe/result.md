---
tache: T007
statut: fait
---
## Livré
VERDICT: DÉFAUTS
- D1 `e2e/dashboard/annulation.spec.ts:35` — `getByRole('button',{name:'Annuler'})` est une correspondance par sous-chaîne → trouve aussi dash-undo `aria-label='Annuler la dernière action'` (`tab-bar.tsx:220`) + bouton du toast (`toast.tsx:53`) → strict mode violation, test KO dès que la stack tourne — repro: `cd $SCRATCH/pw && npx playwright test -c pw.config.ts` → `strict mode violation: getByRole('button', { name: 'Annuler' }) resolved to 2 elements: 1) …dash-undo 2) <button>Annuler</button>` — correctif: `{ name: 'Annuler', exact: true }`
- D2 `use-layout-autosave.ts:44,55` — `lastSent` vaut null au départ → le 1er `schedule`/`flush` part en PUT même si la valeur n'a pas changé ; la page appelle schedule sans condition (`dashboard-page.tsx:183,185,186,275`). État : praticien neuf (`saved.saved=false`, disposition livrée) + Ctrl+Z avec historique vide, ou Ctrl+S, ou flèche contre un bord (`:215` même réf) → PUT de la disposition livrée → `saved=true` en base, on ne suit plus les mises à jour de la disposition livrée du catalogue — repro: harnais `$SCRATCH/hook` test A → `PUTs: 1 status: idle` (attendu 0)
- D3 `dashboard-page.tsx:229,253` — l'action « Annuler » du toast = `undo` global (`use-edit-history.ts:20` dépile le dernier pas). État : retirer le widget A (toast) → ArrowRight sur la case B → clic « Annuler » du toast → c'est B qui revient en arrière, A reste retiré — repro: lecture `:185`,`:253` + `edit-history.core.ts:41-45`
- D4 `tab-bar.tsx:158-161` + `dashboard-page.tsx:231` — chaque `dragover` qui réordonne fait un `commit` enregistré, sans coalesce. État : onglets [A,B,C], glisser A au-delà de B puis de C → 2 pas d'historique ([B,A,C], [B,C,A]) → 1 Ctrl+Z → [B,A,C] et non [A,B,C] ; aussi 2 schedule — repro: lecture `:161` (appel à chaque dragover sur un autre onglet), `:231` record par défaut true
- D5 `use-layout-autosave.ts:60-65` — `setError(null)` absent en cas de succès → un PUT 500 puis « Réessayer » qui passe → `{status:'idle', error: Error('500')}` (contrat `error: Error|null`) ; la page ne lit pas `error` → bénin — repro: harnais test B → `après retry: idle error= 500`
- D6 `dashboard-page.tsx:228-229` — supprimer l'onglet actif puis « Annuler » → l'onglet revient mais `?onglet=` pointe déjà sur le voisin → onglet restauré non resélectionné (déjà signalé par T004, toujours présent)
## Vérifié comment
- `npx tsc -b; echo $?` → ∅ sortie, `tsc exit 0`
- `npx tsc -p tsconfig.e2e.json` → ∅, `e2e exit 0`
- `npm run lint` → `✖ 821 problems (760 errors, 61 warnings)` exit 1 ; `grep modules/dashboard\|e2e/dashboard` → 1 seul fichier, `dashboard-widgets.tsx` (16 warnings, 0 erreur) ; 0 hit sur les 23 fichiers de `git status` → erreurs hors périmètre
- `npx eslint src/modules/dashboard e2e/dashboard` → `16 problems (0 errors, 16 warnings)` exit 0
- `npm run build` → `✓ built in 1.53s` exit 0 (avertissement chunk > 500 kB)
- `npm run test:unit` (node v24.15.0) → `ℹ tests 406 · pass 406 · fail 0` exit 0
- rg DoD (`editing|dash-edit|dash-save\b|…`) src/modules/dashboard → 1 hit `tab-bar.tsx:132 dash-save-status` (`\b` avant `-`, faux positif) ; `rg "dash-save['\"\]]|dash-save$"` → exit 1 → 0 réel
- e2e : chaque `dash-*` des specs → fichiers src : add-widget 1 · catalogue-item 1 · cell 3 · cell-chrome 2 · cell-remove 1 · grid 4 · save-status 1 → 0 sélecteur mort
- `curl -s -w %{http_code} http://127.0.0.1:5183` → `000`, exit 7 → Playwright e2e : NV — stack absente
- rejeu T003 : rg sur les noms supprimés dans grid.tsx → seul `:127 dash-grid-dropping` (déclaré) ; rg sur les classes CSS supprimées dans index.css → exit 1 ; grid.tsx 139 l. ; `handleLayoutChange` en :74-92 (déclaré :72-90, décalage de 2 lignes, sans effet)
- rejeu T004 : rg des 12 motifs sur dashboard-page.tsx → exit 1 ; 486 l. OK ; tsc 0 OK ; 406/406 OK
- rejeu T005 : rg `EditCell|EditHeader|edit-cell|edit-header` src → exit 1 (5 hits à l'époque, corrigés depuis par T004) ; `edit-cell.tsx`/`edit-header.tsx` absents de `edit/` ; `DASH_WIDGET_MIME` :10 OK
- rejeu T006 : tsc e2e 0 OK ; rg `dash-edit|…` e2e → 7 hits, tous dash-save-status OK ; curl 000 OK
- contrats : props passées à `DashboardGrid` (`:334`,`:347-362`), `CellChrome` (`:302-309`), `CataloguePanel` (`:436-446`), `DashboardTabBar` (`:374-393`) = types exportés ; `DashboardGridProps` et `LayoutAutosave` identiques au texte du contrat ; testids de la barre : les 13 sont présents
- grille : `DROPPING_ID` filtré `grid.tsx:75` ; `DRAG_CANCEL` :40 contient button/input/.dash-nodrag ; pile `<640` sans RGL :94 ; `interactive=false` → drag/resize/drop à false :111-114 OK
- autosave : harnais test C (schedule+flush pendant saving) → `max en vol: 1 PUTs: 2 status: idle` OK ; schedule pendant saving → dirty + timer, rien de perdu ; enabled=false → `:86-90` annule le timer et passe à idle OK ; écho : `:175` vérifie l'écho avant le reset, reset seulement si idle OK ; beforeunload `:93-98` actif hors idle OK
## Écarts
- lecture hors WL : `src/modules/dashboard/components/edit/use-edit-history.ts` — sémantique de undo/set (D3, ajout)
- lecture hors WL : `src/shared/ui/popover/popover.tsx` — risque de double bascule de dash-more → écarté (le clic sur le span suit le clic du bouton, état final correct)
- lecture hors WL : rg `case 'undo'` `edit-history.core.ts:41-45` — undo dépile le dernier pas
- lecture hors WL : rg `STACK_BELOW =` `dashboard-widgets.tsx:67` → 640
- lecture hors WL : rg `action` `src/shared/ui/toast/toast.tsx:52-53` — l'action du toast est un `<Button>` (D1)
- outils hors liste : `cat` au lieu de Read ; `node --import` harnais avec un faux `react` (scratchpad) ; `npx eslint` ; `npm run build` a réécrit `dist/`
## Pour la suite
- annulation.spec.ts:35 → `getByRole('button',{ name:'Annuler', exact:true })` ; ou cibler le toast par son conteneur
- autosave : initialiser `lastSent` avec la valeur au moment où `enabled` passe à true / au `reset` ; `setError(null)` en cas de succès
- toast « Annuler » : défaire la mutation précise (marqueur/index du pas), pas `undo` global ; réordonnancement des onglets : `{ coalesce: 'move-tab:'+dragId }`
- NV, à vérifier e2e : RGL 2.2.4 appelle-t-il `onLayoutChange` pendant le glisser ? Si oui, seul le 1er appel a `byUser=true` ; les suivants (`record=false`, sans schedule) ne sont pas enregistrés si le glisser dure > 800 ms ; aussi `added` (`page:259-264`) dépend du calcul anticipé de setState par React
- env : Playwright attend `chromium_headless_shell-1243`, seul 1234 est installé → `npx playwright install chromium` avant `make test-e2e`. Navigation dans l'app avec le statut 'error' : changement perdu sans demande (useBlocker retiré)
## Retour sur le pack
- Manquait: `use-edit-history.ts` (sémantique undo/coalesce, nécessaire pour l'auto-save et le toast) · `toast.tsx` (rendu de l'action, pour les sélecteurs e2e) · version du navigateur Playwright · `npm run lint` rouge à l'échelle du dépôt (760 erreurs préexistantes) : demander un lint ciblé
- Inutile: ∅
