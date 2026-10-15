---
tache: T010
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/dash.css:272-274 — `.hud` contain:size, salle fixe la rangée
- dash/dash.css:702 — ≤1240 `contain:none`, hud repasse en grille
- dash/dash.css:737-745 — ≤480 trow 3 lignes, tbtn ≥24 px
- dash/dash.css:747-758 — ≤480 barre tiroir 1 ligne, 3 boutons symbole
- dash/dash.js:337-354 — GLYPHES avis budget specs contenus risques cahier
- .cache/T010/mesure.mjs — F1-F4, avant = CSS servi sans ajouts T010
- .cache/T010/{glyphes,1600-avant,1600-apres,1600-tiroir-*,390-*,320-*}.png — captures
## Vérifié comment
`node .cache/T010/mesure.mjs avant` (banc :7803, routes api/run abort, api/term simulé) → avant.txt :
```
F1 1600x1000 40={"todo":3662,"card":3715,"room":3778,"page":6255}  4={"page":3213}  Δpage=3042
F1 1280x800  40={"todo":3662,"page":6281}  4={"page":3078}  Δpage=3203
F4 390 fermé {"tete":34,"titreH":39,"titreLignes":3,"tetteScrollW":406,"teteClientW":388,"boutons":"tiroir-btn:72x34 term-full:53x53 term-start:60x34 term-stop:66x34"}
F3 390 fermé {"tasksScrollW":488,"tasksClientW":372,"boutons":["✎ pack@394,405 43x15 KO(hors écran)","lint@435,405 KO(hors écran)","→ prêt@476,405 KO(hors écran)","abandonner@465,423 KO(hors écran)"]}  ouvert idem KO
```
`node .cache/T010/mesure.mjs apres` → apres.txt :
```
F1 1600x1000 40={"items":40,"todo":619,"todoScroll":3656,"card":672,"room":735,"hud":735,"page":3213}
F1 1600x1000  4={"items":4,"todo":619,"todoScroll":619,"card":672,"room":735,"hud":735,"page":3213}  Δpage=0 card<=room:true todo défile:true
F1 1280x800  40={"items":40,"todo":400,"todoScroll":3656,"card":453,"room":516,"hud":516,"page":3019}
F1 1280x800   4={"items":4,"todo":400,"todoScroll":428,"card":453,"room":516,"hud":516,"page":3019}  Δpage=0 card<=room:true todo défile:true
étroit 1024|720|390|320 {"todo":260,"hud":376,"scrollWidth"=clientWidth}   (= avant)
F4 390 fermé {"tete":34,"titreH":10,"titreLignes":1,"tetteScrollW":388,"teteClientW":388,"boutons":"tiroir-btn:72x24 term-full:26x24 term-start:26x24 term-stop:26x24","scrollWidth":390}  ouvert idem
F3 390 fermé {"tasksScrollW":372,"tasksClientW":372,"tiroirTop":810,"boutons":["✎ pack@179,405 49x24 OK","lint@226,405 39x24 OK","→ prêt@272,405 49x24 OK","abandonner@334,405 69x24 OK"]}
F3 390 ouvert {"tiroirTop":253,"boutons":["✎ pack@179,127 OK","lint@226,127 OK","→ prêt@272,127 OK","abandonner@334,127 OK"]}
F4 tab tiroir-btn > term-full > term-start > term-stop
F2 glyphes absents: ∅
console erreurs: ∅
```
`LARGEUR=320 node mesure.mjs` → F4 320 tete 34, titreLignes 1, scrollWidth 320 ; F3 320 4/4 OK
`node --check dash/dash.js` → rc=0 · `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ (rc 1)
`git diff --stat -- dash/` → dash.css 143 + · dash.js 185 + · index.html 12 ± — index.html déjà ` M` avant T010, 0 édition T010
capture glyphes.png : 6 neufs + resultat + pack, 64 px et 16 px, grammaire ±7, stroke 1.2-1.5, `${c}` seul
1600-avant.png / 1600-apres.png : immeuble, deck, salle identiques ; salle 3778 → 735 px (tiroir masqué pour la capture, fixe)
## Écarts
- ∅ lecture hors WL
- F3 hors `.tasks :386` : grille `.trow` ≤480 + `.tbtn` 24 px — colonne actions à x=449 > 390
- glyphes : avis = maillet, budget = pièce €, specs = presse-papiers coché, contenus = mégaphone, risques = jauge, cahier = carnet à spirale
## Pour la suite
- 320 px : panneau pack-lint coupe ses valeurs (overflow:hidden), hors T010
- `#tasks` max-height 252 à ≤480 : 3,5 lignes visibles ; à rehausser si gênant
- ≤1240 : `.todo` max-height 260 inchangé, page stable aussi
- mesure.mjs réutilisable : `node mesure.mjs <tag> [port]`, `LARGEUR=` pour F3/F4
## Retour sur le pack
- Manquait: libellés des actions de `.trow` (≤4 boutons, `ouvrirSaisie` remplace `.tact`) et textes de `#term-etat` (jusqu'à « session perdue — relance ») — lus dans dash.js
- Inutile: ∅
