---
tache: T025
projet: seagle-pilotage
statut: revue
---
## Livré
- dash/dash.js:74-92 — bandeau produits_erreur (gabarit registre_erreur)
- dash/dash.js:631-638 — etiquetteEtage(s, cle, projet), data-projet
- dash/dash.js:1078-1112 — IMMEUBLE.projet, etageDemande→{etage,projet}, allerEtage(cle,projet), surHash
- dash/dash.js:1130-1175 — rendreImmeuble : couleur, selectionnable, sous-sol→produit/projet
- dash/dash.js:~1180-1215 — sonnerEtages e.etage||e.projet ; clics avec data-projet
- dash/dash.js:~1330-1440 — construireTour/rendreTour : --c, archive, sig produit/projets
- dash/dash.js:~1450-1475 — rendrePuces (#pa-label + #pa-projets), majVue, brancherTour
- dash/dash.js:~1615-1640 — charger : etage=/projet=, périmée, refus, hash réécrit
- dash/dash.js:~1710,1790-1830,1880 — pilote, todo, palette, Alt+↑/↓
- dash/index.html:29 — conteneur #pa-projets
- dash/dash.css:42-48 — .pa-puce, .archive
## Vérifié comment
node --check dash/dash.js → ∅ (exit 0)
node .cache/seagle-T025/e2e.mjs (Chromium, salle réelle :7777, GET seul) →
étages → ["É4 Kora","É3 Geolens","É2 AgentX","É1 Seagle"] ; direction → "É5 · CHEF…"
clic Kora → hash "#/kora/orthopro"
clic AgentX → "#/agentx/agentx-immeuble" ; label "ÉTAGE AgentX" ; puces [entreprise,voix,serveur,immeuble*]
clic puce → projet agentx-immeuble→agentx-entreprise ; hash "#/agentx/agentx-entreprise" ; #tasks changé true
#/orthopro → "#/kora/orthopro" ; #/zz → "" ; sous-sol dashboard-grille → "#/kora/dashboard-grille"
palette ⌘K ouverte true, entrées « ⇅ étage Kora/Geolens/AgentX/Seagle/… » ; Alt+↑ → #/kora/dashboard-grille ; Alt+↓ → #/geolens/geolens-charge-3d
tiroir (clic direction) → true ; registre_erreur serveur "" → .deck-erreur 0 ; pageerrors []
scrollWidth 390 → 390 (immeuble) ; 390 (étage)
PNG : /home/jdrac/Documents/Workspace/AgentX/.cache/seagle-T025/{immeuble-1280,etage-1280,immeuble-390,etage-390}.png ; script e2e.mjs même dossier
git diff --stat -- dash/ → dash.css 7 ++++ · dash.js 128 (+95/-41 total) · index.html 1 +
## Écarts
- écart au contrat: §C3 #pa-label — puces dans #pa-projets (nouveau, sous .pa-ligne), pas dans #pa-label (texte vertical-rl) ; label = 'ÉTAGE <titre>'
- écart au contrat: allerEtage/charger — hash complété en #/<cle>/<projet> après réponse (exigé par DoD « clic Kora → #/kora/<projet> »), pas seulement ancien hash
- non observé: produits_erreur / registre_erreur réels non déclenchés (serveur sain, produits.json intouchable) ; seul « absent quand vide » vu
- non observé: mode "projets" (repli) non exercé ; 0 lecture hors WL
## Pour la suite
- dash.js : IMMEUBLE ~1078 · etageDemande ~1091 · allerEtage ~1104 · charger ~1614 · rendrePuces ~1450 · palette ~1780
- sous-sol : data-slug = cle produit, data-projet = projet ; étage non selectionnable = <li> sans data-slug
## Retour sur le pack
- Manquait: emplacement des puces (pa-label vertical) ; Inutile: ∅
