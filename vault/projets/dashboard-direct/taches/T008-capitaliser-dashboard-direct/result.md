---
tache: T008
statut: fait
---
## Livré
- note créée : `vault/connaissances/rgl-v2-api-reelle.md` — dragConfig/resizeConfig/dropConfig/droppingItem, isDroppable legacy, .d.ts:lignes
- note créée : `vault/connaissances/ortho-front-dashboard-carte.md` — fichiers, testids, classes, clavier, mimes, pièges regex
- note créée : `vault/connaissances/autosave-debounce-historique.md` — 1 vérité locale, PUT 800 ms, écho, lastSent, toast≠undo
- note créée : `vault/connaissances/playwright-getbyrole-sous-chaine.md` — name=sous-chaîne → exact:true ; limite 2 toasts
- note créée : `vault/connaissances/ortho-front-outillage.md` — node 24, tsc -b, lint ciblé, chromium 1243≠1234, stack 5183
- brief.md : DoD 1 cochée (T007 rg → 0) ; 2-8 non cochées avec preuve/NV ; hypothèses invalidées (6) ; questions refermées ; carte du terrain réécrite (créés/supprimés)
- plan.md : statuts réels T001-T012 ; T009-T012 ajoutées ; vagues V1-V6
- non capitalisé (reste dans result.md) : récit D1-D6 ; D4+/D3+ = backlog T012 (ouverts)
## Vérifié comment
python3 bin/vx.py index → index ecrit : vault/INDEX.md (2 projet(s))
python3 bin/vx.py doctor → vault coherent.
wc -l connaissances/*.md → 35 · 40 · 31 · 28 · 33 (≤ 40)
## Écarts
- lecture hors WL : ∅ (Bash cat/ls/sed utilisé en lecture, WL respectée ; ≠ outils listés)
- T012 sans result.md à l'écriture : D3+ non capitalisé
- DoD 2-8 non cochées : e2e NV (stack 5183 absente), validation humaine ∅
## Pour la suite
- (4×) packs d'implémentation : WL oubliait les fichiers voisins qui portent la sémantique (`use-edit-history.ts` T004 T007 T011 · `grid.tsx` T011 · `tab-bar.tsx` T006) → gabarit : section « Dépendances de comportement » = fichiers que le code modifié appelle, en L
- (4×) fichiers en E/L jamais exploités (`autosave.core.test.ts` T009 T011 · `tab-bar.tsx` T009 · `edit-history.core.test.ts` T004 · `index.css` T005) → gabarit : justifier chaque ligne WL par une ligne de DoD, sinon retirer
- (3×) API de dépendances non recopiée : Popover, icônes, FlyingModal, toast, palette (T002 T005 T007) ; .d.ts RGL (T002) → gabarit Contrats : « signatures externes consommées » à recopier (règle 3)
- (3×) env/outillage absent : navigateur Playwright 1243, lint global rouge, stack e2e, `dist/` réécrit, bornes de lignes CSS (T003 :1539≠1535) → skill chef : ajouter une section « Environnement » depuis [[ortho-front-outillage]] ; DoD lint = ciblé ; DoD e2e = « NV si stack » explicite
- (2×) regex de DoD à faux positif (`dash-save\b` T006 T007) + e2e dépendent d'un comportement UI non dit (où vit Réessayer, texte du toast) → tester les regex à blanc avant dispatch ; contrat testids = lieu + rôle ARIA
## Retour sur le pack
- Manquait: result.md T012 (en-cours) ; table de correspondance DoD→preuve dans le brief
- Inutile: `LANGAGE.md` en L (règles déjà dans le system prompt)
