---
tache: T020
statut: fait
verdict: DÉFAUTS
---
## Vérifié comment
- D1 écritures `rg -n "saveDashboardLayout|saveLayout.mutate|updateDashboardCellConfig|saveWhole"` → L138 L274 L293 L296 L300 L306 L422
- D1 L274 saveLayout : garde L273 `!layoutReady` → reject ; L122 layoutReady inclut `!layoutError` — OK
- D1 L422 bouton : L418 `saving = isPending || !layoutReady` → edit-header.tsx:L157-158 `disabled={saving}` (Annuler + Enregistrer) — OK
- D1 L300 saveWhole / L306 PATCH : garde L298 `!activeTab` ; L128 tabs=[] si layoutError → activeTab undefined — OK indirect, ∅ `!layoutError` explicite
- D1 L138 migration : garde L136 `migrated.current || !saved || saved.saved || !legacy` — ∅ `!layoutError` → défaut 1
- D1 B2 : L186-189 `editing && layoutError` → stopEditing + toast ; rendu intermédiaire : layoutReady faux → Enregistrer disabled — OK
- D2 sonde t020.probe.test.ts (QueryObserver, retry:false), états par notification :
`status=error isError=1 → layoutError=1 tabBar=0 emptyState=1`
`refetch: status=pending isError=0 → layoutError=1 tabBar=0 emptyState=1`
`status=error → layoutError=1 ; refetch pending → layoutError=1`
`status=success → rendu transition layoutError=1, effet L115 → layoutFailed=false → rendu suivant grille`
- D2 L424 `!layoutError && <DashboardTabBar>` ; L458 `layoutError ? EmptyState : grid` — OK
- D3 use-dashboard-activity.ts:L18 NO_APPOINTMENTS module ; L45 `data ?? NO_APPOINTMENTS` ; L47 `todayIso = isoOf(new Date())` string → Object.is stable même jour ; L49-70 + L73-75 useMemo `[appointments, todayIso]` — OK
- D3 sonde : `même ref après refetch identique: true` (structural sharing → appointments stable)
- D4 L139-152 `.then(ok, ko)` : KO → L149 migrated=false + L150 toast error ; OK → L143 setSaved + L144 `.catch` toast warning, 0 réessai (saved.saved=true → L136 return) — OK
- D4 boucle : deps L154 `[saved, legacy]` ; PUT KO → 0 setSaved → saved même ref ; sonde `même ref après refetch KO: true` → 0 boucle — OK
- régression L186-191 : lit editing, layoutError, stopEditing (3 setters stables), addToast ; manquent stopEditing, addToast ; effet exécuté = closure du rendu courant → 0 valeur périmée ; stopEditing hors deps → 0 rejeu — OK
- `npx eslint dashboard-page.tsx use-dashboard-activity.ts` → `eslint exit=0`
- `npm run typecheck` → `typecheck exit=0`
- `npm run test:unit` → `ℹ tests 330 ℹ pass 330 ℹ fail 0` (2 fail clock.probe disparus)
- sonde supprimée : `ls src/modules/dashboard/t020*` → `Aucun fichier ou répertoire`
## Défauts
- 1. dashboard-page.tsx:L136-138 — migration PUT tire sous layoutError, contredit EmptyState L462 « Rien n'est modifié »
  état : montage 1 GET OK `{saved:false}` + legacy → PUT KO (L149 migrated=false) → refetch GET KO (cache status=error, data gardée) → quitter/revenir sur la page (ref neuve)
  sonde `REMOUNT 1er rendu {"status":"error","isError":true,"hasData":true,"layoutError":true,"tabBar":false,"emptyState":true,"migrationFires":true}`
  → PUT legacy envoyé pendant écran « Disposition indisponible » ; si la base a depuis un `saved:true` (autre poste) → écrasé ; si KO → toast « Reprise impossible » sur écran d'erreur
  repro : réécrire sonde t020 (QueryObserver neuf sur cache error+data, `getOptimisticResult`) ; correctif attendu : `|| layoutError` en L136 + `layoutError` en deps L154
## Écarts
- ∅ (query-core exécuté par la sonde, non lu ; git status/diff = outils autorisés)
## Pour la suite
- 4 défauts T013 clos (D1 D2 D3 D4 OK) ; reste défaut 1 mineur (migration sans `!layoutError`) → tâche courte implementeur
- HP : save en vol + refetch GET KO → L188-189 toast « modifications abandonnées » puis L279 toast « enregistré » (L187 ignore `saveLayout.isPending`) — contradictoire, déclencheur asymétrique GET KO / PUT OK
- HP : setCellConfig L297-307 garde `!activeTab` seulement ; closure d'un widget capturée avant l'erreur (timer) → PATCH/PUT sous layoutError — non reproduit
- note : setQueryData (setSaved L108) remet status=success (sonde `SETDATA après erreur status=success`) → efface layoutFailed ; voulu si données serveur fraîches
## Retour sur le pack
- Manquait: numéros de ligne contrat décalés (migration L135-154 ≠ L137-152 ; effet L186-191 ≠ L181-190) ; scénario remontage (ref migrated neuve) absent des DoD
- Inutile: tab-bar.tsx (seul `onEdit` utile, déjà visible via L430)
