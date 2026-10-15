---
tache: T012
statut: fait
---
## Livré
- src/components/ui/mega-menu.tsx:79-87 — li : onBlur hors li (hors survol) ferme ; Échap → focus déclencheur
- src/components/ui/mega-menu.tsx:108-113 — bouton type/aria-expanded/haspopup/controls ; Entrée/Espace bascule
- src/components/ui/mega-menu.tsx:137 — panneau `id="mega-menu-{id}"`
- src/components/Header/header.tsx:1,158,189-193 — burgerRef ; Échap sur header ferme tiroir, focus burger
- src/components/Header/header.tsx:237,241-242 — burger aria-expanded + aria-controls="mobile-drawer"
- src/components/Header/header.tsx:252-254 — tiroir id + `inert=""` fermé (cast `as object`)
- src/components/ToogleLanguage.tsx:24-35,51-60,66 — Échap ferme + focus bouton ; aria-label « Langue : Français »
- src/components/Header/layout.tsx:3,27,34-39,41 — lien d'évitement kit ; `<main id="main">`
- src/lib/local/{fr,en,de,es,it}/Navbar.ts:+2 — `skipToContent`, `language: "Langue : {{lang}}"`
- T012/audit.mjs — copie T003 : BASE env ; sélecteurs langue/menu/inert corrigés
- T012/shots.mjs — tests clavier ciblés + captures avant/après
## Vérifié comment
- `npx tsc --noEmit -p .` → tsc=0
- `git diff --stat -- <9 chemins E>` → 9 files changed, 64 insertions(+), 6 deletions(-)
- `BASE=…:4407 node audit.mjs kbd` avant → `langue: échap→true` · `megaMenu: expandedAttr null, linksVisibleAfterEnter 0` · `menuMobile aria_expanded null` · count 9
- idem après → `langue: échap→false` · `megaMenu: expandedAttr "false", linksVisibleAfterEnter 8, tabNext "Application sur-mesure"` · `menuMobile aria_expanded "true"` · count 10 (seq0 "ALLER AU CONTENU") · noFocusStyle [] · hiddenFocus []
- `node audit.mjs extra` avant → `megaMenu {clavierEntrée 0, souris 8}` · `drawerFermé 7` · `drawer {hauteurAprèsÉchap 384, ariaExpanded null, ariaControls null}` · homeTab distinct 43
- idem après → `megaMenu {clavierEntrée 8, clavierEspace 0, souris 8}` · `drawerFermé 0` · `drawer {hauteurAprèsÉchap -1, ariaExpanded "false", ariaControls "mobile-drawer"}` · homeTab distinct 44, footer true
- `node shots.mjs apres kbd` → premierTab "ALLER AU CONTENU" · skipPuisTab "DÉMARRER UN PROJET ∈main" · menuÉchap {focus "Services", expanded false, liens 0} · menuEspace 8 · menuSortieTab {focus "Toggle theme", expanded false} · langueNom "Langue : Français" · langueÉchap {expanded false, focus bouton} · tiroirFermé 0 · tiroirÉchap {expanded false, focus "Toggle menu", inert true}
- captures T012/ : apres-menu-clavier-1440, apres-skip-1440, apres-tiroir-clavier-390 ; survol avant/après 1440 + clic tiroir 390 : diff pixel = canvas ASCII animé seul (bbox x≥771 / fond), menu identique à l'œil
- prérendu → NV — prérendu réservé au chef
## Écarts
- clavierEspace 0 (extra) — Entrée ouvre puis Espace referme : bascule voulue ; Espace seul → 8 (shots)
- kbd `linksVisibleAfterEsc` 8 — sortie AnimatePresence 0.3 s ≥ attente 300 ms ; à 500 ms → 0
- kbd `menuMobile après_échap` 11 — métrique compte liens rognés ; fermeture prouvée par extra (-1) + inert
- kbd `trap` CTA adjacents — faux positif connu T003, inchangé
- audit T003 original : sélecteur `text=` focus le `<span>` → copie T012 corrigée (L124)
## Pour la suite
- tiroir mobile `max-h-96` (384px) rogne la ligne langue + CTA (préexistant, header.tsx:256) — max-h plus grand ou auto
- `inert` : React 18.3 + @types/react 19 → `{ inert: "" } as object` ; passage React 19 → `inert={!open}`
- libellés tiroir mobile codés en dur FR (header.tsx:138-147) — non traduits
- lien d'évitement absent si `/lab/*` ? non : hors Header, présent partout ; à vérifier au prérendu
- bouton langue : nom « Langue : Français » ≠ visible « FR » (WCAG 2.5.3 tolérable, à arbitrer)
## Retour sur le pack
- Manquait: audit.mjs BASE codé en dur et sélecteur `text=` du menu inopérant ; @types/react 19 (inert boolean) non signalé
- Inutile: ∅
