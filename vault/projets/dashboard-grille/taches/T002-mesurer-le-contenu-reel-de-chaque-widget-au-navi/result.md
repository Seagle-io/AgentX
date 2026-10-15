---
tache: T002
statut: fait
---
## Livré
Légende : larg.min = plus petite largeur de case testée (160/240/320/480) sans débordement horizontal ni texte tronqué (ellipsis) ; H = hauteur naturelle de la case, en-tête+corps+bordures, sans défilement ; vide = données absentes (compte de test) ; L = lignes de texte @240.
En-tête de case = 57 px (icône + titre) pour les widgets à corps ; kpi-* H=84.

widget | larg.min | H@240 | H@320 | H@480 | L | remarque
---|---|---|---|---|---|---
achievements | 240 | 195 | 195 | 195 | 10 | vide (0/13)
activity | 320 | 343 | 302 | 302 | 19 | scroll-x 1154 px @160/240 (graphe) ; titre tronqué @240
admin-time | 240 | 134 | 134 | 118 | 3 | vide
age-calculator | 240 | 258 | 188 | 188 | 5 | scroll-x @160 (167/158)
bilans | 240 | 63 | 63 | 63 | 2 | vide
birthdays | 240 | 118 | 102 | 102 | 4 | vide
calculator | 160 | 178 | 178 | 178 | 23 | ∅ tronqué dès 160
clock | 240 | 113 | 113 | 125 | 4 | titre tronqué @160
daily-anecdote | 240 | 182 | 182 | 182 | 6 |
daily-game | 320 | 89 | 89 | 89 | 5 | URL mono tronquée @240
daily-quote | 240 | 121 | 121 | 121 | 4 |
feedback | 320 | 214 | 214 | 214 | 5 | texte tronqué @240
forecast | 240 | 123 | 103 | 103 | 5 | vide
forum | 480 | 23 | 19 | 19 | 15 | H NV (corps hors flux) ; tronqué jusqu'à 320 ; données présentes
forum-notifications | 240 | 127 | 127 | 127 | 5 | vide
free-slots | 240 | 215 | 215 | 215 | 8 | scroll-x @160 (181/158)
greeting | 480 | 92 | 92 | 76 | 5 | titre h2 tronqué ≤320 ; pas de corps (H=en-tête seul)
kora-news | 160 | 127 | 127 | 127 | 5 | vide
kpi-billing | 160 | 84 | 84 | 84 | 2 | valeur "0 €"
kpi-noshows | 240 | 84 | 84 | 84 | 2 | libellé tronqué @160
kpi-patients | 160 | 84 | 84 | 84 | 2 |
kpi-sessions | 160 | 84 | 84 | 84 | 2 |
lapins | 320 | 63 | 63 | 63 | 2 | vide ; phrase tronquée @240
licence | >480 | 197 | 197 | 197 | 7 | libellé "w-[30%] max-w-24 truncate" tronqué à toute largeur ; scroll-x @160
mascot | 160 | 146 | 146 | 146 | 0 | image, aucun texte
month-calendar | 240 | 232 | 232 | 232 | 76 | grille 7 col
next-appointment | 240 | 134 | 118 | 118 | 3 | vide
onboarding | 240 | 158 | 158 | 158 | 5 | erreur "checklist n'a pas pu être chargée"
patient-search | 240 | 165 | 165 | 165 | 2 | champ + bouton
pomodoro | 160 | 145 | 145 | 145 | 4 |
reprendre | 480 | 63 | 63 | 63 | 2 | vide ; phrase tronquée ≤320
shortcuts | 240 | 169 | 124 | 124 | 3 | tronqué @160 et @320 (1 libellé)
storage | 160 | 216 | 183 | 167 | 7 |
today | 240 | 177 | 177 | 177 | 7 | vide
tomorrow | 160 | 147 | 147 | 147 | 5 | vide
tongue-twister | 240 | 130 | 130 | 130 | 7 |
useful-links | 320 | 406 | 406 | 406 | 15 | liste de 9 liens ; hint tronqué @240
weather | 160 | 98 | 98 | 78 | 5 | H@160=132 ; état "adresse du cabinet à indiquer" (pas de météo réelle)
week-grid | 320 | 128 | 128 | 128 | 12 | vide ; libellés jours tronqués @240
word-of-day | 480 | 209 | 209 | 209 | 9 | phrase mono tronquée jusqu'à 320

ABSENT du DOM (7/49 ids ; worklists exclu = groupe) : contact-code quick-reply recent-documents revenue transmissions unpaid-invoices unread-messages → NON mesurés. Cause NV (requires/optional du compte de test présumé).
H@160 hors tableau : voir /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure/out.json (clés par widget puis largeur).
PNG : /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure/png/<widget>.png (43 fichiers, pris à 240 px — pas à la largeur mini) ; weather : png/weather-{160,240,320,480}.png
Harnais : /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure/run.mjs (+ ids.txt, out.json brut).

## Vérifié comment
node run.mjs → PUT 200 {"saved":true,...} ; 42 cases présentes sur 50 ids → out.json écrit, 43 PNG
node run.mjs clear → 400 {"message":["tabs must contain at least 1 elements"]}
curl -X PUT {tabs:[{id:<uuid>,name:"Mesure",cells:[]}]} → {"saved":true,"tabs":[{"id":"82a16270-…","name":"Mesure","color":null,"cells":[]}]}
Méthode : case forcée à W px (style.width), corps (flex-1) redimensionné par dichotomie 0-3000 px → plus petite hauteur sans scrollHeight>clientHeight ; débordement-x = corps.scrollWidth>clientWidth+1 ; tronqué = descendant avec scrollWidth>clientWidth+1 (inclut ellipsis volontaires, ex. titres).

## Écarts
- PUT sans id UUID rejeté (400 "must be a UUID") → UUID aléatoires ; `y` ≤ 500 (400) → h:10 au lieu de 40, y=k*10 (cases se chevauchent, les autres masquées visibility:hidden pendant la mesure)
- DoD « remettre {tabs:[]} » non tenue : API exige ≥1 onglet → laissé 1 onglet "Mesure" sans cellule (id 82a16270-9072-4042-8aab-d6812ae3838a) ; état initial du compte non connu
- sélecteur `.dash-cell-chrome` ∅ dans le DOM ; structure réelle : div.react-grid-item > div.-mx-0.5…overflow-auto > section.h-full > [en-tête, div.flex-1 corps]
- corps et section en `container-type:size` → hauteur auto = 0 ; d'où dichotomie
- PNG à 240 px, pas à la largeur mini lisible ; 7 widgets non rendus (non mesurés)
- lectures hors WL : ∅

## Pour la suite
- Mesures sur compte vide (états « Aucun… ») : hauteurs de widgets à données (forum, activity, week-grid, useful-links, today) sous-estimées/NV ; refaire avec données avant de figer.
- Largeur min sans troncature : 160 px → 10 widgets (calculator, kora-news, kpi-billing/patients/sessions, mascot, pomodoro, storage, tomorrow, weather) ; 240 → 19 ; 320 → 6 (activity, daily-game, feedback, lapins, useful-links, week-grid) ; 480 → 4 : forum, greeting, reprendre, word-of-day ; licence jamais.
- Hauteurs naturelles @240 : 63–406 px, médiane ≈ 147 ; en-tête fixe 57 px ; activity est le seul à exiger scroll-x (1154 px de contenu) sous 320 px.
- Pièges : titres tronqués (h4 truncate) en dessous de 240 px sur la plupart → aucun test « lisible » ne les distingue du contenu ; 7 widgets absents du DOM pour ce compte ; `PUT {tabs:[]}` impossible (400), `y` ≤ 500 et ids UUID.
- Corps en `container-type:size` : le contenu ne dicte jamais la hauteur de la case → la hauteur en modules doit venir de ce tableau, pas du layout CSS.

## Retour sur le pack
- Manquait: sélecteur réel du DOM (pas de .dash-cell-chrome), contraintes API (UUID, y≤500, tabs≥1), liste des widgets masqués par `requires`/`optional` pour le compte de test, ids de worklists/kpi (bilans, lapins, reprendre, kpi-*)
- Inutile: ∅
