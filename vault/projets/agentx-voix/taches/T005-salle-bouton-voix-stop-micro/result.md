---
tache: T005
projet: agentx-voix
statut: revue
---
## Livré
- dash/index.html:L83-L96 — carte `#voix` dans `.hud`, entre horloge et todo, `hidden` par défaut
- dash/dash.css:L730-L759 — `.voix-*` : hauteur fixe 168 px, journal défilant, illumination 2 s, égaliseur
- dash/dash.css:L804,L812 — ≤1240 : `span 2` · ≤720 : `auto`
- dash/dash.js:L981-L1072 — `VOIX`, `heureVoix`, `majBoutonsVoix`, `majPiedVoix`, `rendreVoix`, `voixPost`, `brancherVoix`
- dash/dash.js:L1530 — `rendreVoix(s)` dans `rendre`
- dash/dash.js:L2063 — `brancherVoix()` à l'amorçage
- .cache/voix-T005/e2e.mjs — 42 vérifications Playwright, routes `ctx.route`
- .cache/voix-T005/{console-1600,console-390}.png — captures

Choix : colonne droite (`.hud`, `contain:size`) — le tiroir fermé ne montre que 34 px. Erreurs dans `#voix-etat` (pied de carte, `role=status`) — à côté des boutons. Égaliseur = `@keyframes eq` existant.

## Vérifié comment
`node .cache/voix-T005/e2e.mjs` (banc :7817, `AGENTX_VOIX_DIR=.cache/voix-T005/v`) → `42 OK · 0 KO`, rc 0. Extraits :
```
OK  1600×1000 hauteur page 0 vs 30 — h0=3269 h30=3269 carte=168
OK  1280×800 hauteur page 0 vs 30 — h0=3048 h30=3048 carte=168
OK  1600×1000 30 entrées : défilement interne — scrollHeight=1979 clientHeight=103
OK  1280×800 todo tient dans la colonne — {"hud":1512.546875,"todo":1512.546875,"todoH":275.65625}
OK  hostile : 0 exécution, 0 balise — __pwn=undefined balises=0
OK  nouvelle phrase : 1re ligne illuminée · illuminée encore à 1,5 s · éteinte après 2 s
OK  🔊 → POST mode {"on":true}, allumé — ["mode","{\"on\":true}","POST",true]
OK  ■ → POST stop {} — ["stop","{}","POST",true]
OK  🎙️ → POST micro {"on":true} · 400 → message tel quel — état inconnu — relance dictee
OK  🎙️ → focus rendu à xterm — xterm-helper-textarea
OK  parle false → 🔊 ■ désactivés + titre — parle n'est pas lancé — lance bin/parle
OK  dictee false → 🎙️ désactivé + titre — dictee n'est pas lancé — lance bin/dictee
OK  390 px scrollWidth <= 390 — scrollWidth=390 clientWidth=390
OK  320 px scrollWidth <= 320 — scrollWidth=320 clientWidth=320
OK  390 px cibles ≥ 24 px — [[27,24],[26,24],[27,24]]
OK  Tab : mode → stop → micro → journal — voix-stop,voix-micro,voix-journal
OK  voix absent → carte cachée · voix absent dès le chargement → cachée
OK  requêtes voix toutes interceptées — 5 requêtes : mode,mode,stop,micro,micro
OK  0 erreur console (hors la 400 micro voulue) · 0 alert/confirm/prompt
```
Contraste (node, WCAG) → heure #9fb0cc/#0b0d13 8.84 · texte/#0b1a10 11.80 · pied ko #ff3b5c/#0f1118 5.42 · titre #3b82f6/#0f1118 5.13 · focus cyan 11.79
`node --check dash/dash.js` → rc 0 · `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ (rc 1)
`git diff --stat -- dash/` →
```
 dash/dash.css   | 32 +++++++++++++++++++
 dash/dash.js    | 95 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
 dash/index.html | 14 +++++++++
 3 files changed, 140 insertions(+), 1 deletion(-)
```
Banc arrêté : `kill 974369` → `curl` 000.

## Écarts
- lecture hors WL : `ls .cache/` — existence de `voix-T005/` (listing, 0 fichier lu)
- bordure `.cbtn` éteinte #262c3e/#0f1118 = 1.36 — héritée du kit, glyphe = repère
- `CONSOLE VOCALE` en capitales — imposé DoD, aligné `TODO DU CHEF`

## Pour la suite
- salle réelle : micro → « état inconnu — relance dictee » tant que dictee ancien
- `dash.js/css/index.html` servis à chaque requête : rafraîchir suffit, 0 relance
- 30 phrases longues : ~1,5 visibles à 390 px (carte 168 px fixe)

## Retour sur le pack
- Manquait: Chrome logue `Failed to load resource … 400` pour la 400 micro voulue → « 0 erreur console » à préciser ; `page.route` ≠ `ctx.route` (2e page voix absente)
- Inutile: ∅
