---
tache: T011
statut: fait
---
## Livré
Racine = `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/`
- weather/index.tsx:6 — grid 5 6 / 5 4 / 7 7
- kpi/index.tsx:7,12,17,22 — 4 grid : 6 3/5 3/8 5 ×3, noshows 7 3/7 3/9 5
- forum/index.tsx:5 — grid 24 7 / 13 4 / 24 14
- greeting/index.tsx:6 — grid 12 3 / 5 3 / 24 5
- mascot/index.tsx:7 — grid 6 5 / 5 3 / 8 7
- tongue-twister/index.tsx:8 — grid 6 4 / 5 3 / 8 6
- weather/weather-widget.tsx:95 — shell `[container:card/size]`
- weather/weather-widget.tsx:123 — maintenant `flex flex-1 items-center justify-center`
- weather/weather-widget.tsx:139-143 — jours 3 col, 4e `hidden @[14rem]/card:flex`
- weather/weather-widget.tsx:69-71 — squelette jours : même règle 3/4
- kpi/dashboard-kpi.tsx:63,111 — carte + squelette `[container:card/size]`
- kpi/dashboard-kpi.tsx:31,50,52 — commentaires : « h3 au module de 24 px »
- greeting/dashboard-greeting.tsx:36-69 — section flex-col card/size ; grille interne `min-h-0 flex-1 items-center justify-center`
- greeting/dashboard-greeting.tsx:23 — commentaire « h3 au module de 24 px »
- mascot/mascot.tsx:23 — section `flex h-full flex-col overflow-hidden [container:card/size]`
- mascot/mascot.tsx:29,31 — bouton flex-1 centré ; visage `max-h-full max-w-full object-contain`
- forum/dashboard-forum.tsx:247 — racine `flex h-full flex-col overflow-hidden [container:card/size]`
- forum/dashboard-forum.tsx:263-291 — corps enveloppé `flex min-h-0 flex-1 flex-col overflow-y-auto`
- forum/dashboard-forum.tsx:148,224,226,246,258 — commentaires colonnes/rangées → modules/px
## Vérifié comment
`npx eslint <11 fichiers E>; echo $?` → `eslint exit=0` (0 sortie)
`npx tsc -b 2>&1 | grep -E "widget/(forum|greeting|kpi|mascot|tongue-twister|weather)/"` → ∅ (grep exit=1)
`npx tsc -b 2>&1 | grep -c "error TS"` → `0`
`npm run test:unit` → `ℹ tests 426 ℹ suites 24 ℹ pass 426 ℹ fail 0 ℹ cancelled 0 ℹ skipped 0`
Rendu navigateur : NV, pas de navigateur dans le périmètre
## Écarts
- lecture hors WL : shared/page/page.tsx:104-131 — structure PageSection pour R3
- R3 : corps du forum déjà dans le flux (enfants directs de PageSection flex-col) → seule l'enveloppe `min-h-0 flex-1 overflow-y-auto` ajoutée, + `flex flex-col` pour que flex-1 interne tienne
- greeting : `justify-center` posé (DoD) mais sans effet sur une grille 1fr/auto/1fr
- weather : squelette des jours aligné (3/4 col) — hors DoD littérale, même fichier, même silhouette
- tongue-twister : grid seul, widget hors WL
## Pour la suite
- greeting minW 5 (184 px) : 3 colonnes + bouton « Ouvrir la journée » débordent probablement → revoir minW ou masquer le texte du bouton
- forum minW 13 (≥ 504 px) : `@max-xs/dash` (flèche seule) et pager 1 carte ne se déclenchent plus → code mort probable
- mascot : saut `translateY(-10%)` peut être rogné par `overflow-hidden` à h-full (p-3 = 12 px de marge)
- seuils px (kpi 90, greeting 80, forum 150, weather 120/150) calés au module 24 ; à module 48 ils ne se déclenchent qu'à h ≤ 2
- `@[12rem]/dash`, `@min-[300px]/dash`, `@2xl/dash` dépendent du conteneur `dash` de grid.tsx (T007) : vérifier qu'il existe encore
## Retour sur le pack
- Manquait : structure de PageSection (props, classes racine) pour R3 ; sens de « hors flux » ; exigence ou non d'aligner les squelettes
- Inutile : ∅
