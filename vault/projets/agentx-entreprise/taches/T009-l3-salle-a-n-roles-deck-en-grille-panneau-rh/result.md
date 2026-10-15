---
tache: T009
statut: fait
---
## Livré
- dash/dash.js:7-19 — COULEUR_ROLE vide, majRegistre, statuts rejete/abandonne
- dash/dash.js:44-80 — deck rebâti si registre change ; .deck-erreur
- dash/dash.js:277-292 — let POSTES, postesSalle formule §C9
- dash/dash.js:318-331 — GLYPHES verdict, revue, tests, maquette, audit, build
- dash/dash.js:446-470 — pipeline mural pas=5.4/n ; bureaux bouclés ; fusée/radar déplacés
- dash/dash.js:561-585 — tableRH + rendreRH (— si null, .ko ≥ 0.5)
- dash/dash.js:897 — toast suffixe `verdict : <v>`
- dash/dash.js:956,964-965,975 — majRegistre 1re ligne ; sig + cle+couleur ; rendreRH
- dash/index.html:92-96 — section #rh verbatim §C9
- dash/dash.css:69-72,269-280,562 — #deck auto-fill 150px, .deck-erreur, .rh-* ; media .deck retirés
## Vérifié comment
AVANT `rg -c "alert\(|confirm\(|prompt\(" dash/dash.js` → (vide) rc=1 ; APRÈS → (vide) rc=1
`rg -n "bureau\('(eclaireur|architecte|implementeur|verificateur|scribe|chef)'" dash/dash.js` → (vide) rc=1
`node --check dash/dash.js` → rc=0
`python3 bin/dash.py --json > .cache/etat-T009.json` → rc=0 ; `node .cache/rendu-T009.mjs` (code réel dash.js en vm) →
```
source: etat.roles ancien format (7 rôles, sans couleur/affectable) → 13 rôles depuis contrat §C1
postes: 12 distincts: 12
chef [9.9,0.7] x 546..642 y 250..338 OK · eclaireur [1.2,2] x 226..322 y 132..219 OK
implementeur [7.95,2] x 442..538 y 240..327 OK · securite [1.2,6.4] x 86..182 y 202..290 OK
scribe [5.7,6.4] x 230..326 y 274..362 OK · (7 autres OK)
hors viewBox: 0
construireSalle desks: 12 eclaireur,testeur,architecte,securite,devops,designer,evaluateur,verificateur,implementeur,chef,scribe,relecteur
COULEUR_ROLE: 13 GLYPHES: pack,carte,contrat,diff,defauts,notes,verdict,revue,tests,maquette,audit,build,resultat,question
tableau pipeline barres: 7 pour 7 statuts
```
`node .cache/rh-T009.mjs` → vide : `<tr><td class="rh-vide">aucune tâche livrée</td></tr>` meta "" ; rempli : `2 projet(s) · 1 archive(s)`, `<td class="ko">50 %</td>`, `<td class="">—</td>`
`git diff --stat -- dash/` →
```
 dash/dash.css   |  20 ++++++++--
 dash/dash.js    | 120 +++++++++++++++++++++++++++++++++++++++++++-------------
 dash/index.html |   5 +++
 3 files changed, 115 insertions(+), 30 deletions(-)
```
rendu navigateur NV — hors pack, vérif suivante
## Écarts
- écart au contrat: §C9 deck — .deck-erreur ajouté en tête, cartes gardées ; contrat flou sur « affiche »
- écart au contrat: §C9 deck — cartes rebâties si cle+couleur changent ; sinon registre figé
- ajout CSS hors lettre : `#deck .pipe{grid-column:span 2}` — 8 barres illisibles en 150px
- `#rh-meta` vide si `personnel.projets` absent — 0 donnée inventée
- fichiers jetables : .cache/etat-T009.json, .cache/rendu-T009.mjs, .cache/rh-T009.mjs
## Pour la suite
- tant que L2 n'a pas livré, state.json a l'ancien format : salle = bureau chef seul, couleurs undefined (pas de repli, contrat C0 B)
- L4 : rendreTaches dash.js:589 · rendre() :955-1000 · peuplerConsole(s) :981
- L4 : console legacy peuplerConsole :1102, brancherConsole :1119 ; amorçage :1335-1338 (brancherConsole, brancherTerminal, brancherSon, boucle)
- verif : capture visuelle grille deck 13 cartes + .deck-erreur + #rh
## Retour sur le pack
- Manquait: forme de `personnel.modeles[]` (clé `cle`) et format du taux (`round(100*t) %`) — trouvés en §C5 contrat.md L246-256, hors plage citée
- Manquait: comportement deck si registre_erreur (remplace ou s'ajoute aux cartes ?)
- Inutile: ∅
