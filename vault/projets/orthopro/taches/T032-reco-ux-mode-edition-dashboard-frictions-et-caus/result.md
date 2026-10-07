---
tache: T032
statut: fait
---
## Parcours
Racine = ortho-front/src/modules/dashboard (DB). rgl = react-grid-layout ^2.2.4 (package.json).
- 1. entrée — DB/components/tab-bar.tsx:64 bouton `dash-edit` → dashboard-page.tsx:431 onEdit → startEditing L173-181 (reset historique, catalogue fermé)
- 2. sélection — DB/components/edit/edit-cell.tsx:55 onPointerDown+onClick → dashboard-page.tsx:331 setSelectedId; halo L61; badge w×h L113
- 3. déplacement souris — grid.tsx:127 dragConfig{enabled:editing,cancel:'.dash-no-drag'} ; pas de draggableHandle → toute la carte (edit-cell.tsx:58 cursor-grab)
- 4. déplacement clavier — dashboard-page.tsx:251-269 effet window keydown sans deps ; flèches → nudge (layout-ops.core.ts:36)
- 5. redimensionnement — poignées rgl grid.tsx:128 (nw ne sw se e s), visibles si `.dash-selected` index.css:1486 ; NumberInput edit-cell.tsx:87-105 ; Maj+flèches L125 → resize (core:46)
- 6. ajout — edit-header.tsx:146 `dash-add-widget` → Dialog dashboard-page.tsx:477 → pickWidget L101-109 → PlacementOverlay grid.tsx:41 → clic → place (core:61) L383-388
- 7. réglages — edit-cell.tsx:74/109 roue → dashboard-page.tsx:332 setSettingsFor → FlyingModal L490-501 (340px, x24 y120)
- 8. suppression — edit-cell.tsx:75/110 `dash-cell-remove` ; clavier Suppr/Backspace dashboard-page.tsx:259 → removeCell L92
- 9. undo/redo — edit-header.tsx:148-149 boutons seuls ; dashboard-page.tsx:415-416 ; use-edit-history.ts ; MAX_STEPS 100 (edit-history.core.ts:110)
- 10. enregistrer/sortir — edit-header.tsx:157-158 `dash-cancel`→stopEditing L422/L182 ; `dash-save`→saveLayout L423/L371-381 onSuccess stopEditing+toast
## Frictions
Format : fichier:L — symptôme — cause — correctif — gravité. NV = mécanisme prouvé par code, effet runtime non exécuté.
### Perte de travail / irréversibilité
- edit-header.tsx:157 + dashboard-page.tsx:422 — « Annuler » jette tout sans demander, même `changes`>0 — onCancel=stopEditing direct — confirm si changes>0 (Dialog existant) — H
- dashboard-page.tsx (rg beforeunload|useBlocker → ∅) — quitter la page/onglet navigateur en édition perd le brouillon sans alerte — aucun garde de navigation — useBlocker + beforeunload quand changes>0 — H
- dashboard-page.tsx:259 — Backspace/Suppr supprime le widget sélectionné sans confirmation ni toast « Annuler » — removeCell direct — toast avec action Annuler (history.undo) — M
- edit-header.tsx:150 + dashboard-page.tsx:86-90 — « Rétablir par défaut » écrase tous les onglets en un clic ; libellé voisin de « Rétablir » (L149 = redo) — pas de confirm, 2 sens de « Rétablir » — confirm ; renommer « Revenir à la disposition livrée » — M
- edit-header.tsx:130 + dashboard-page.tsx:71-77 — « Supprimer l'onglet » détruit ses widgets sans confirm — removeTab direct — confirm si layout.length>0 — M
### Clavier / accessibilité
- dashboard-page.tsx:254-269 — aucun Ctrl/Cmd+Z / Ctrl+Y (rg ctrlKey|metaKey modules/dashboard → seul calculator.tsx:36) — undo/redo boutons uniquement — ajouter Z/Y/Shift+Z dans onKey — H
- dashboard-page.tsx:254 — flèches/Suppr actifs pendant Dialog catalogue, FlyingModal réglages, onglets role=tab, SegmentedControl : déplacent le widget au lieu de naviguer, `preventDefault` L263 bloque la nav native — isTyping ne couvre que INPUT/TEXTAREA/SELECT/contentEditable (L44-45) — ignorer si catalogueOpen, settingsFor, ou cible dans [role=dialog|tablist|slider|radiogroup|menu] — H
- edit-cell.tsx:49-55 — carte non focalisable (∅ tabIndex/role, rg tabIndex → ∅) : sélection impossible au clavier ; seul détour : catalogue « Sur la page » (widget-panels.tsx:136) — sélection = pointerdown souris — tabIndex=0 + role=button + Entrée/Espace=onSelect + focus-visible ring — H
- dashboard-page.tsx:255 — Échap désélectionne/annule la pose mais ne quitte pas l'édition ; aucun raccourci Enregistrer — non câblé — Ctrl+S → save ; Échap sans sélection → Annuler (avec confirm) — B
- dashboard-page.tsx:263-266 — chaque flèche = 1 étape d'historique (cap 100) — set(record=true) par appui — fusionner les appuis consécutifs <500 ms — B
### Sélection / outils de la carte
- edit-cell.tsx:55,72-77 — clic sur Réglages/Retirer d'une carte NON sélectionnée peut être perdu : pointerdown remonte à onPointerDown→onSelect, le bloc `!selected` (L72) se démonte avant le click (stopPropagation L17 n'agit qu'au click, `.dash-no-drag` n'arrête que rgl) — NV, e2e `dash-cell-remove` à rejouer sur carte non sélectionnée — stopPropagation sur onPointerDown des ToolButton — H
- edit-cell.tsx:81 — barre flottante `-top-14 left-0 whitespace-nowrap` (~400px) déborde à droite sur carte en colonnes 9-12 et recouvre la carte du dessus — ancrage fixe left-0, pas de collision — ancrer right-0 si x+w>6 ; ou barre dans l'en-tête — M
- edit-cell.tsx:68 — poignée de déplacement `aria-hidden` décorative : toute la carte déclenche le drag, donc un geste de sélection de 3 px peut déplacer — pas de draggableHandle (grid.tsx:127 ∅) — draggableHandle='.dash-grip' (le Grip) ; clic carte = sélection seule — M
- edit-cell.tsx:65 — contenu `pointer-events-none` : aucun lien/survol utile mais pas de prévisualisation des interactions ; choix voulu — B (aucune action)
### Redimensionnement
- index.css:1481-1487 — poignées invisibles tant que la carte n'est pas sélectionnée : redimensionner = 2 gestes — display:none hors `.dash-selected` — afficher des poignées discrètes au survol — M
- index.css:1493-1504 — angles 12×12 px, barrettes 6×24 : cible tactile/souris trop fine — tailles fixes — zone de saisie ≥24 px (pseudo-élément ::before) — M
- edit-cell.tsx:87-105 — NumberInput : bornes min/max recopiées à la main (`widget.grid.minW`, `Math.min(maxW??12,12)`, `maxH??MAX_H_DEFAULT`) au lieu de boundsOf (core:17) — duplication, risque de dérive ; ex. `minH` sans `?? 1` — utiliser boundsOf(widget.grid) — M
- dashboard-page.tsx:125/333 — `resize(l,id,w,h)` appelé sans `gridOf` alors que le contrat core:46 l'exige : passe par un wrapper layout-ops.ts (9 L, hors WL, NV) — contrat divergent — vérifier le wrapper — B
### Compaction / placement
- layout-ops.core.ts:25-31 settle — gravité verticale forcée : on ne peut laisser un trou ; la carte déposée en bas d'une zone vide remonte, les voisines se décalent — verticalCompactor imposé ; rgl `compactor` voir Structurant #1 — M
- grid.tsx:57-59,70-79 vs core:61-65 — l'aperçu pointillé du dépôt est à (x,y) visé, le résultat est compacté/poussé : aperçu ≠ résultat — l'overlay ignore settle — calculer l'aperçu via place() sur le layout courant — M
- grid.tsx:62-68 + dashboard-page.tsx:412 — widget « en main » : aucun bouton pour annuler à la souris (Échap seul, L255) ; indice `HINTS.dropping` masqué <1280 px (edit-header.tsx:142 `hidden xl:block`) — overlay z-20 capte tout clic grille (L68) — bandeau visible « Cliquez pour poser · Échap » + bouton Annuler dans l'overlay — H
- grid.tsx:68 — overlay : clic sur zone occupée pose quand même, poussant les voisines, sans aperçu de poussée — onClick inconditionnel — surligner cartes déplacées / refuser si hors grille — B
- core:36-43 / core:57 + edit-history.core.ts:125 — flèche contre un mur, ou ↓ sur la dernière carte, rend un nouveau tableau (settle recrée les objets) → `Object.is` faux → +1 « modification » et étape undo sans effet — settle sans comparaison structurelle — comparer layouts, retourner `layout` si identique — M
- grid.tsx:131-146 — glisser de quelques px qui ne change rien : onLayoutChange(byUser=true) → toCells recrée → étape d'historique vide (NV : dépend du déclenchement rgl) — même cause — même correctif (comparaison structurelle) — M
- grid.tsx:107-121 — <640 px (largeur du conteneur, pas du viewport) : pile non éditable, ni déplacer ni redimensionner ; barre d'outils (edit-cell.tsx:84-106) montre « Colonnes » sans effet visuel ; réordonner impossible — STACK_BELOW=640 — masquer « Colonnes » en pile ; ajouter ↑/↓ « monter/descendre » — M
- dashboard-page.tsx:101-106 — en pile, pickWidget ajoute en fin sans sélection ni scroll : rien ne se passe à l'écran — addToLayout sans setSelectedId — sélectionner + scrollIntoView la nouvelle case — M
### Catalogue / réglages / onglets
- dashboard-page.tsx:484 — catalogue masque les widgets déjà posés (`!onPage.has`) alors que le modèle admet des exemplaires multiples (dashboard-layout.util.ts:97) — filtre — option « ajouter un autre exemplaire » ou doc — B
- dashboard-page.tsx:487 — « Sur la page » sélectionne et ferme sans faire défiler jusqu'à la carte (∅ scrollIntoView, rg scroll → ∅) — onSelectCell — scrollIntoView sur `[data-cell-id]` — M
- widget-panels.tsx:81 + dashboard-page.tsx:477-481 — catalogue = Dialog modal : grille masquée pendant le choix, on ne voit pas l'espace libre — décision actée (hors reco) — B
- dashboard-page.tsx:160 — chaque modif de réglage = 1 étape (history.set record par défaut) : slider/toggle rafale → évince l'historique des positions (cap 100) — pas de coalescence — record=false pour frappes continues, ou fusion par clé — M
- edit-header.tsx:63 + dashboard-page.tsx:408 — renommer un onglet : 1 étape + « 1 modification » par caractère — onChange direct vers history.set — sérialiser à onBlur ou fusionner — M
- dashboard-page.tsx:490-496 — FlyingModal réglages non modale posée en (24,120) : recouvre les cartes de gauche, et les flèches continuent de déplacer la carte (cf. clavier) — position fixe — position près de la carte sélectionnée ; bloquer onKey — M
- edit-header.tsx:109-112 — réordonnancement d'onglets HTML5 drag : pas de tactile, échange à chaque dragOver (instable) — API dnd native — boutons ←/→ dans TabMenu — B
### Enregistrement / feedback
- edit-header.tsx:158 — « Enregistrer » actif avec 0 modification ; succès ferme l'édition et perd le contexte (sélection, onglet reste) — pas de `disabled={changes===0}` — désactiver ou libeller « Terminer » — B
- edit-header.tsx:152 — compteur « N modifications » = étapes d'historique, pas de changements réels (cf. no-op, frappes) — `changes=past.length` (use-edit-history.ts:98) — compter diff vs sauvegardé — B
- grid.tsx:119-146 + grid.tsx (rg autoScroll|scroll → ∅) — glisser près du bas d'un tableau long : aucun défilement automatique côté code ; en-tête sticky z-30 (edit-header.tsx:94) masque ~60 px haut — rgl v2 sans autoscroll (NV, node_modules non lu) — wrapper rAF qui scrolle window près des bords pendant onDrag — M
## Structurant
- rgl : drag = toute la carte (pas de draggableHandle) → conflit sélection/drag/outils ; adopter handle = Grip + `onPointerDown` sélection seule (grid.tsx:127, edit-cell.tsx:49-70)
- rgl : compaction verticale imposée (verticalCompactor, core:27) → trous impossibles, aperçu≠résultat ; évaluer `compactor` « sans gravité » (rgl v2 gridConfig) NV, ou aperçu via place()
- rgl : pas d'autoscroll pendant drag/resize → petit hook rAF `useEdgeScroll(active)` branché sur onDragStart/Stop (grid.tsx:129-130)
## Vérifié comment
- `rg '"react-grid-layout"' package.json` → `"react-grid-layout": "^2.2.4"`
- `rg 'ctrlKey|metaKey' modules/dashboard` → seul widget/calculator/calculator.tsx:36
- `rg 'scroll|autoScroll|tabIndex|beforeunload|useBlocker|confirm' dashboard-page.tsx grid.tsx edit/*.tsx` → 2 hits overflow-x-auto seulement
- lecture complète : dashboard-page.tsx L140-510 + L44-45, grid.tsx, edit-cell/header/panels, layout-ops.core, use-edit-history, edit-history.core, tab-bar, index.css:1441-1525
- 0 exécution navigateur : items NV = mécanisme code seul
## Écarts
- lecture hors WL: edit-history.core.ts — importé par use-edit-history (reducer, Object.is L125)
- lecture hors WL: dashboard-layout.util.ts:91-124 (rg) — addToLayout/multi-instances
- lecture hors WL: ../../../node_modules/react-grid-layout/package.json (rg, 0 hit utile) — autoscroll
## Pour la suite
- Lot A (dashboard-page.tsx seul) : onKey gardé (dialog/settings/rôles) + Ctrl+Z/Y/S + Échap ; garde navigation (useBlocker/beforeunload) ; confirm Annuler/Reset/Supprimer onglet ; toast Annuler à la suppression
- Lot B (edit-cell.tsx) : tabIndex/role/Entrée ; stopPropagation pointerdown sur ToolButton (e2e dash-cell-remove carte non sélectionnée à rejouer d'abord) ; boundsOf à la place des bornes recopiées ; barre ancrée selon x ; draggableHandle avec grid.tsx:127
- Lot C (layout-ops.core.ts + edit-history.core.ts) : settle rend `layout` si identique (no-op ≠ étape) ; tests core existants layout-ops.core.test.ts / edit-history.core.test.ts
- Lot D (grid.tsx + index.css) : bandeau/annulation de pose visible <xl, aperçu via place(), zones de saisie poignées ≥24 px, edge-scroll
- Contrat à recopier : boundsOf défauts 1,1,12,60 ; resize(layout,id,w,h,gridOf) ; historyReducer set record=false remplace present sans empiler
## Retour sur le pack
- Manquait: chemin du pack tronqué (dossier réel `…-et-caus`) ; layout-ops.ts (wrapper resize) et dashboard-layout.util.ts hors WL ; sortie « fichier:L » sans préfixe racine
- Inutile: tab-bar.tsx (seule entrée, 1 ligne utile), grid.constants.ts (déjà dans Contrats)
