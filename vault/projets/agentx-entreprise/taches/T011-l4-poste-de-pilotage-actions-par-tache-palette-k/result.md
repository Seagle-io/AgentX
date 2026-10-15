---
tache: T011
statut: fait
---
## Livré
- dash/dash.js:589-604 — rendreTaches : data-tid, rejete, .tact, gel si saisie
- dash/dash.js:976-982 — appel peuplerConsole retiré de rendre
- dash/dash.js:1045-1085 — pilote = ex-lancer, écrit #sortie/#sortie-etat
- dash/dash.js:1087-1100 — copier verbatim
- dash/dash.js:1102-1157 — brancherTodo, brancherTaches (+#pilote-barre), actionTache, SAISIE, ouvrirSaisie/fermerSaisie
- dash/dash.js:1159-1262 — PALETTE, entreesPalette, filtrer/ouvrir/fermer/executerEntree, brancherPalette (raccourcis capture)
- dash/dash.js:1264-1271 — basculerTiroir, localStorage 'agentx:tiroir', fit 50 ms
- dash/dash.js:1415-1419 — brancherTerminal : #tiroir-btn + état tiroir restauré
- dash/dash.js:1474 — amorçage §C9 verbatim
- dash/index.html:103-125 — POSTE DE PILOTAGE, #pilote-barre 6 boutons, kbd ⌘K, ACTIONS, #sortie
- dash/index.html:143-157 — #tiroir.term-panel.tiroir, #tiroir-btn, #console-out retiré
- dash/index.html:162-167 — #palette HTML §C9 verbatim
- dash/dash.css:28 — .frame padding-bottom 40px
- dash/dash.css:285 — grille tâches + colonne 172px
- dash/dash.css:427-498 — pilote-barre, kbd, tbtn, rejete, saisie, .sortie*, palette ; .console-*/.csep/.clab retirés
- dash/dash.css:510-521 — tiroir fixe translateY(100% - 34px), .ouvert, .plein
## Vérifié comment
`node --check dash/dash.js; echo rc=$?` → `rc=0`
`rg -n "peuplerConsole|brancherConsole|console-out|console-etat|console-barre" dash/; echo $?` → `1` (∅)
`rg -n "alert\(|confirm\(|prompt\(" dash/dash.js; echo $?` → `1` (∅)
`node .cache/pilote-T011.mjs` → rc=0 :
```
1. entreesPalette → board|ready|doctor|index|personnel|integrer (projet x, exe) · T009 · intégrer · T009 · ✕ virer (exe motif) · T010 · ⧉ dispatch (cmd) · T010 · lint · T010 · abandonner · /dispatch x (cmd)
2. filtre "vir" → [ 'T009 · intégrer', 'T009 · ✕ virer' ]
   filtre "INTEG" (accents/casse) → [ 'integrer', 'T009 · intégrer' ]
3. rendreTaches → tbtn: 5 · T011 sans actions → tact vide: true
4. actionTache virer → SAISIE: {"tid":"T009","k":"virer"} · input: true · prérempli: "tests non lances"
   saisie ouverte → rendreTaches ne repeint pas: html inchangé · cellule garde input: true
5. motif vide → ko: true · requêtes envoyées: 0
6. Échap → SAISIE: {"tid":null,"k":null}
7. Entrée motif → POST: {"action":"virer","tid":"T009","projet":"x","motif":"doublon de T004"} · SAISIE: {"tid":null,"k":null}
8. Ctrl+K → palette ouverte: true · hidden: false
9. entrée motif → palette-q placeholder: "motif du renvoi — Entrée" · valeur: "tests non lances" · maxLength: 200
10. Échap → palette fermée: true true
11. Ctrl+K dans xterm → ignoré: true
12. Ctrl+` dans xterm → tiroir ouvert: true · bouton: ▾ terminal
```
(1. condensé sur 1 ligne ; 2 = "vir" matche aussi sous "Virer les rôles" — filtre sur titre+sous §C9)
`git diff --stat -- dash/` → `dash.css | 123 · dash.js | 354 · index.html | 30 · 3 files, 396+ 111-` (inclut diff L3 non commité)
Navigateur : NV — pas de navigateur dans le pack
## Écarts
- ∅ lecture hors WL
- dash.css : .csep/.clab supprimés en plus — morts sans la barre console
- basculerTiroir : `TERMINAL.fit?.fit()` + focus si ouvert — xterm absent → tiroir marche quand même
- pilote : afficheur local `ecrire` (closure), plus de fonction globale
- palette entrée copie : `copier(cmd, li)` puis fermeture 600 ms — retour visuel « ✓ copié »
- tiroir z-index 39 : sous .demo-flag (40) et .toasts (41) ; en démo le drapeau chevauche ■ arrêter
## Pour la suite
- recharger :7777 → panneau « POSTE DE PILOTAGE », colonne ACTIONS, tiroir fermé en bas (bandeau 34 px)
- tâche revue → clic « ✕ virer » → champ prérempli ; vider + Entrée → bord rouge, rien parti ; motif + Entrée → #sortie `$ … virer …`
- Ctrl+K → palette ; taper « vir » ; ↓/Entrée ; entrée virer → champ devient motif ; Échap ferme
- Ctrl+` (même focus xterm) → tiroir ouvre/ferme, cols xterm intactes ; recharger → état tiroir conservé ; ⛶ plein écran + Échap OK
- todo ▶ lancer / ⧉ copier inchangés ; #pilote-barre board…intégrer → #sortie
## Retour sur le pack
- Manquait: rôle exact de `#pilote-barre` dans brancherTaches (non nommé §C9) ; comportement copie depuis palette (fermeture/retour) ; z-index tiroir vs toasts/demo-flag
- Inutile: ∅
