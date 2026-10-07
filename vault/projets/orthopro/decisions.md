# Decisions — OrthoPro — front et back

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-05 — vague « widgets du dashboard »
- périmètre: qualité des widgets existants · mode édition/grille · performance/données — choix humain
- HP: nouveaux widgets — reporté
- curseur: solide — tests unitaires + recette Playwright par lot
- juge: verificateur puis humain (captures + compte rendu)
- commits: 1 commit local par lot sur `Ultime` · push interdit · migrations interdites

## 2026-10-05 — vague 2 (reco T001/T002 intégrée)
- node: 24 requis (`~/.nvm/versions/node/v24.15.0`) — test:unit KO sous node 22 système → `.nvmrc` + `engines`
- typecheck: `tsc --noEmit -p .` ne vérifie rien (`files: []`) → corriger en premier lot, en parallèle des autres
- états widget: `WidgetNote tone='error'` + `Spinner` existants — pas de nouveau composant, pas de hook partagé
- parsing layout: extraire `dashboard-widgets.tsx:217-343` en module pur `dashboard-layout.util.ts`, ré-exporter depuis `dashboard-widgets.tsx` — testable sous node:test sans .tsx
- format dates: module partagé `src/shared/lib/format/date.ts` créé vague 2, migration des 14 appels dans les lots widgets vague 3 — évite collisions
- commits: les implémenteurs ne committent pas ; le chef commit par lot (`git add` WL du lot) après verificateur — 7 lots parallèles, index git partagé
- e2e dashboard + migration WidgetCard (10) + tests des 16 widgets nus → vague 3

## 2026-10-05 — architecture (T010)
- **Contexte** : `widgetState` copié ×6 a déjà 2 sémantiques (requête inactive → `loading` vs `ready`) ; WidgetCard ne sait pas faire une carte entièrement cliquable.
- **Choix** : `widgetState` partagé, pur, 0 import → `components/widget/widget-state.ts` ; requête non réussie = `loading`. Supersède « reste local » (vague 2).
- **Choix** : shell propre autorisé ⇔ (A) aucun titre fixe nommant le widget ∨ (B) surface entière = 1 cible de clic. Sinon WidgetCard.
- **Choix** : extraction util/core + ré-export depuis `dashboard-widgets.tsx` OK ; modules purs (`*.util.ts`, `*.core.ts`, `widget-state.ts`) n'importent jamais `dashboard-widgets`.
- **Choix** : `shared/lib/format/date.ts` OK si affichage seul ; arithmétique de dates reste dans `agenda.dates`.
- **Écarté** : WidgetCard imposé aux 10 parce que kpi (bouton étiré) et greeting/mascot (sans titre) cassent.
- **Écarté** : copies locales ×7 parce que divergence déjà prouvée par les tests.
- **Conséquence** : e2e lit position via `data-x/y/w/h` sur la case, pas en pixels ; WidgetCard gagne `tour?` (data-tour).
- **À revoir si** : un widget passe une requête `enabled:false` à `widgetState` (loading perpétuel) ou un 3e motif de shell apparaît.

## 2026-10-05 — vague 3 (humain)
- `cleanLayout([])` → `[today]` : corriger — un onglet vide reste vide (doc util.ts:110-111 fait foi)
- e2e dashboard : stack front+back+ortho_test disponible sur la machine → lot F dispatché
- stash@{0} ortho-front droppé — redondant avec les 6 commits
- Réessayer sans retour visuel pendant refetch → lot vague 3

## 2026-10-05 — mode édition (humain)
- priorité absolue : mode édition « terrible » — déplacer, redimensionner, ajouter/placer, sélection/outils/réglages, + lenteur/saccades
- enregistrer/annuler/undo : pas de plainte
- juge : humain à la souris après chaque lot ; vérificateur sur le code
- vague 3b (dates, Réessayer, e2e) passe après
- vague 4 contrats : poignée de drag = élément `.dash-grip` (edit-cell pose la classe, grid pose draggableHandle) · historique `set(update, record: boolean | { coalesce: string } = true)` (core+hook par T036, consommé par T035) · aperçu de dépôt = place() sur le layout courant · autoscroll = hook `useEdgeScroll(active)` nouveau fichier · rgl conservé
- push : autorisé par l'humain le 2026-10-05 pour la branche Ultime, une fois le lot mode édition commité (« Ok commit et push une fois tout fini »)

## 2026-10-05 — vague 3b (humain « ok »)
- `make test-e2e` autorisé : exécute `migration:run` + `seed` sur la base de test `ortho_test` uniquement ; tue les ports 3000/5183 avant de lancer back+front de test
- lots : C1 dates agenda (util+tsx hors tomorrow/free-slots .tsx) · C2 dates facturation/documents/clock · G Réessayer retour visuel (+ hhmm tomorrow/free-slots) · H divers (activity-chart WidgetCard, fitCell maxH, toast action) · F e2e dashboard 3 specs
- base e2e = `orthoworkspacev2` (humain) → `make test-e2e TEST_DB=orthoworkspacev2` ; migrations + seed autorisés sur cette base, jamais sur orthoworkspacev2_forumx (dev)
