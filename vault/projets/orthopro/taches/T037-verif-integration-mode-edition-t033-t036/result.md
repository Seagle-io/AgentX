---
tache: T037
statut: fait
verdict: DÉFAUTS
tags: [orthopro, verif, mode-edition]
---
## Vérifié comment
- `npm run test:unit` → `tests 395 · pass 395 · fail 0`
- `npm run typecheck` → exit 0
- `npx eslint src/modules/dashboard` → `✖ 16 problems (0 errors, 16 warnings)` (react-refresh connus)
- sonde `t037.probe.test.ts` → 9 cas, 8 OK, 1 KO (P9 = défaut 1) ; P1 sameLayout 7 paires OK · P2 nudge mur ×3 + id absent → même ref OK · P3 coalesce 0/300/600 → past 1, undo → 0 OK · P4 0/900/1800 → 1 étape, 0/1500 → 2 OK · P5 clé ≠ → 2 ; `true` intercalé casse la fusion ; undo efface `last` OK · P6 même ref true/coalesce/false → même `h` OK · P7 `set(x,false)` garde past/future OK · P8 coalesce vide future OK
- P9 recopie page:232 + nudge mur → `past.length après flèche contre mur = 1` · `actual: 1, expected: 0`
- `rm` sonde ; `git status --short` → 10 ` M` + `?? use-edge-scroll.ts`, 0 trace sonde
- contrats : grid.tsx:198 `handle: '.dash-grip'` ↔ edit-cell.tsx:76 `dash-grip` OK · grid.tsx:35,223 ↔ page:468 `onCancelPlacement` OK · edit-cell.tsx:38 ↔ page:409 ; valeur page:186 `width < STACK_BELOW`, même `width` que grid.tsx:179 → pile réelle, OK · `RecordOpt` edit-history.core.ts:4 ↔ use-edit-history.ts:15 ↔ page:231,342,377,488 OK
- grille : previewPlacement → `place` sur layout courant grid.tsx:42-43 OK · `sameCells` grid.tsx:175 OK · useEdgeScroll cleanup use-edge-scroll.ts:29-32 (removeEventListener + cancelAnimationFrame, deps `[active,…]`) OK · `stopGesture` grid.tsx:201 ET :203 OK
- edit-cell : stopPropagation :17 · `tabIndex={0} role='button'` :55-56 · Entrée/Espace :58 · `right-0` si `x+w > GRID_COLS/2` :90 · `boundsOf` :52,99-100,111-112 OK
- `rg -n "12|60|MAX_H_DEFAULT" edit-cell.tsx` → 1 hit :90 `h-12` (classe Tailwind) → 0 borne littérale
- `rg -n "data-testid='dash-" …` + `'data-testid': 'dash-cell'` grid:129 + `testid='dash-cell-remove'` edit-cell:83,121 → 9 d'origine (grid, placement, edit, catalogue-item, add-widget, cancel, save, cell, cell-remove) + `dash-confirm` page:597 OK
- `rg dash-no-drag src` → edit-cell.tsx:81,90 seulement → orpheline (0 CSS, 0 cancel rgl), noté
- `rg createBrowserRouter src` → src/app/router.tsx:42 → `useBlocker` valide
## Clavier
| touche | grille | catalogue | réglages | input onglet | tablist |
|---|---|---|---|---|---|
| flèches / Maj+flèches | nudge/resize coalesce, preventDefault page:338-342 | ignoré :333 | ignoré :333 | ignoré :325 | ignoré :333 inInteractive |
| Suppr / Retour arr. | removeCell page:337 | ignoré :333 | ignoré :333 | ignoré :325 | ignoré :333 |
| Échap | pose→null / désélection / cancelEditing :328-331 | page muette :327, Dialog ferme | muette :327 | ignoré :325 | cancelEditing :331 |
| Ctrl+Z / Ctrl+Y, Maj+Z | undo/redo + désélection, preventDefault :320-321 | idem (sous la modale) | idem → ferme réglages | idem, undo natif confisqué | idem |
| Ctrl+S | preventDefault toujours, save si changes>0 :322 | idem | idem | idem | idem |
- preventDefault sur touche ignorée : flèches/Suppr/Échap jamais ; Ctrl+S à 0 modif et Ctrl+Z à past vide → preventDefault :320,322 (voulu : bloque « enregistrer la page »)
## Sorties d'édition
- Annuler (bouton / Échap) — garde page:201-209 si changes>0
- Rétablir livré — garde page:272-281 + étape annulable
- Supprimer onglet — garde page:256-263 si ≥1 widget ; onglet vide sans garde, annulable
- navigation route — garde page:213 useBlocker (pathname seul) + Dialog page:586-607
- fermeture onglet navigateur — garde page:214-219 beforeunload
- Dialog `dash-confirm` page:586-607 unique pour les 3 confirmations + blocker OK
## Défauts
- 1. dashboard-page.tsx:231-232 — no-op jamais ignoré : `d.map(…{ ...t, layout })` crée toujours une nouvelle ref → flèche contre mur, Maj+flèche à la borne = 1 modification fantôme, `dirty`, beforeunload/blocker/« Abandonner 1 modification ? », Enregistrer actif — repro : sonde P9 ; manuel : case x=0, ←
- 2. edit-cell.tsx:58 — onKeyDown racine non filtré (`e.target === e.currentTarget` absent) : Entrée/Espace sur ToolButton :82-83,120-121 bouillonne → preventDefault → click natif annulé ; Retirer/Réglages inopérants au clavier, réglages inaccessibles au clavier ; Entrée dans NumberInput aussi préventée — régression T034 (`git diff` : onKeyDown nouveau) — repro : Tab jusqu'à « Retirer X » (focus-within) → Entrée → case sélectionnée, rien retiré
- 3. dashboard-page.tsx:326-331 — Échap testé avant `inInteractive` :333, blocker ignoré : dialogue « Quitter sans enregistrer » ouvert, 0 sélection → Échap → dialog.tsx:48 `onOpenChange(false)` → blocker.reset, puis page → cancelEditing → dialogue rouvert « Abandonner N modifications ? » (écouteur Dialog posé avant celui de la page : effets enfants d'abord) ; même chemin depuis la Popover d'onglet (focus bouton « Supprimer l'onglet »/couleur) → cancelEditing, ou sortie d'édition si 0 modif
- 4. dashboard-page.tsx:96,320,283-286,199 — `settingsFor` jamais remis à null (undo, retrait de la case, stopEditing, startEditing) → Échap mort :327 ; resélectionner la case rouvre ses réglages :410 — repro : sélection A, roue, Retirer dans la barre de A → Échap sans effet
## Écarts
- lecture hors WL: src/shared/ui/dialog/dialog.tsx (rg + L40-56) — ordre/gestion Échap, défaut 3
- lecture hors WL: src/shared/ui/popover/popover.tsx (rg) — Radix ou maison : maison, useMenuClose
## Pour la suite
- HP : grid.tsx:156-162 `gesture.current` reste vrai si un geste finit sans onLayoutChange (micro-glisser rendu à sa place) → prochaine recompaction comptée geste ; NV sans navigateur
- HP : page:299-305 `added` lu après updater de `setHistory` → updater paresseux/StrictMode → focusCell possiblement sauté (préexistant)
- HP : page:223-228 abandon silencieux du brouillon sur erreur de relecture (préexistant, voulu) = 6e sortie sans garde ; page:250-254 Ctrl+Z pendant la confirmation de suppression → `rest` périmé ré-applique l'action défaite
- beforeunload page:216 : `preventDefault` seul, pas de `returnValue = ''` → navigateurs anciens NV
- souris (humain, 5 gestes) : glisser par la prise seule, ailleurs rien · redimensionner près du bord bas → défilement auto puis arrêt au relâcher · pose catalogue : aperçu = place réelle, cases poussées estompées · « Annuler » du bandeau de pose · Retirer au survol sans sélectionner
## Retour sur le pack
- Manquait: Dialog/Popover maison (Échap sur `window`, pas Radix) → coller dialog.tsx:44-51 ; contexte « Popover onglet » absent du tableau clavier ; P9 (no-op à travers `setLayout` page) absent de la sonde — le contrat no-op n'était testé qu'au core
- Inutile: index.css L1480-1510 (0 contrat croisé dedans)
