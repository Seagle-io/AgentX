---
tache: T014
statut: fait
evalue: T009
verdict: retenir
---
## Verdict
retenir — 13 cases DoD OK, état actuel
## DoD
- [x] majRegistre 1re ligne de rendre ; COULEUR_ROLE = {} — `rg -n "majRegistre|const COULEUR_ROLE" dash/dash.js → 8:const COULEUR_ROLE = {}; 15:function majRegistre ; 958:function rendre(s){ 959:  majRegistre(s);` ; `git show HEAD~1:dash/dash.js` L7-10 littéral 7 rôles → supprimé
- [x] postesSalle §C9 formule exacte ; POSTES let recalculé — `rg → 280:let POSTES = {}; 459:  POSTES = postesSalle(s.roles);` ; harnais → `formule §C9 n= 11 COLS 4 rows 3 PAS_Y 2.2 conforme true`
- [x] 0 bureau( à clé littérale — `rg -n "bureau\('(eclaireur|…|chef)'" dash/dash.js → rc=1` ; dash.js:460-461 boucle s.roles
- [x] props déplacés, pipeline mural n barres, GLYPHES +6 — dash.js:468-469 fusée [10.7,6.4] radar [10.7,7.9] (avant [9.8,6.6] [7.9,7.6]) ; dash.js:447 `pas = 5.4 / s.pipeline.length, larg = pas * .67` ; harnais → `barres pipeline 7 pour 7` · `GLYPHES +6 verdict:function revue:function tests:function maquette:function audit:function build:function`
- [x] COULEUR_STATUT + rejete, abandonne — harnais → `statut rejete #9f1239 abandonne #3a4460`
- [x] #deck grille auto-fill 150px ; registre_erreur → .deck-erreur — dash.css:69 `#deck{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}` ; harnais → `deck cartes 13 erreur roles.json invalide : cle dupliquee` · `deck erreur retirée true`
- [x] #rh après .chart-panel verbatim ; rendreRH 2 tables, colonnes, —, .ko, vide — index.html:77 chart-panel, :92-95 section §C9 ; harnais → `th RÔLE TÂCHES LIVRÉES RETENUES VIRÉES RENVOI` · `<td class="ko">50 %</td>` · `<td class="">—</td>` · 49 % sans .ko · `{}`/`taches:0`/undefined → `<tr><td class="rh-vide">aucune tâche livrée</td></tr>` · meta `8 projet(s) · 1 archive(s)`
- [x] toasts suffixe verdict — harnais annoncer → `<span>T014 · 12:00 · verdict : virer</span> || <span>T1 · 1</span>`
- [x] node --check rc 0 — `node --check dash/dash.js; echo rc=$? → rc=0` (node v22.22.1)
- [x] rendu réel 12 postes distincts dans viewBox 700×480 — `python3 bin/dash.py --json → 13 rôles, registre_erreur ''` ; `node .cache/eval-T014.mjs → postes 12 distincts 12 · desks 12 · hors viewBox 0` (bbox desk x 92..652 y 132..375)
- [x] alert/confirm/prompt même compte — `git show HEAD~1:dash/dash.js | rg -c … → rc=1` ; actuel `rg -c … dash/dash.js → rc=1` (0 = 0)
- [x] git diff --stat -- dash/ collé ; 0 autre fichier — collé result.md:33-39 (3 fichiers dash/) ; Livré T009 ⊂ dash/* + .cache/ ; `git status --short -- dash/ bin/ roles.json → ∅`
- [x] result.md selon Format — 5 sections exactes, 55 lignes ≤ 60
## Motif
∅
## Vérifié comment
`node --check dash/dash.js` → rc=0
`rg -n "bureau\('(eclaireur|architecte|implementeur|verificateur|scribe|chef)'" dash/dash.js` → ∅ rc=1
`python3 bin/dash.py --json > .cache/eval-T014-etat.json` → rc=0, 13 rôles, pipeline 7 statuts, personnel.taches 260
`node .cache/eval-T014.mjs` (dash.js réel en vm, DOM factice) →
```
postes 12 distincts 12
formule §C9 n= 11 COLS 4 rows 3 PAS_Y 2.2 conforme true
COULEUR_ROLE 13 statut rejete #9f1239 abandonne #3a4460
desks 12 eclaireur,testeur,architecte,securite,devops,designer,evaluateur,verificateur,implementeur,chef,scribe,relecteur
 chef [9.9,0.7] x 552..652 y 250..351 OK · relecteur [7.95,4.2] x 378..478 y 275..375 OK · (10 autres OK)
hors viewBox 0
barres pipeline 7 pour 7
RH lignes roles 11 modeles 2 tirets 6
```
`git diff HEAD~1 HEAD --stat` → 29 fichiers, commit multi-lot T007/T008/T009/T010/T011 ; part T009 = dash/dash.js, dash/index.html, dash/dash.css + T009 result.md/task.md
`python3 bin/dash.py --port 7791 --no-open` pid 98774 → `curl -s … → 200` ; capture `google-chrome --headless=new … --screenshot=.cache/eval-T014.png` → 774421 o : deck 13 cartes grille 9+4+pipe, salle 12 bureaux, panneau PERSONNEL · RH 2 tables ; `kill 98774` → curl 000
Affirmations T009 rejouées : rg alert (rc=1 = rc=1), rg bureau (rc=1), node --check (rc=0), postes 12 distincts, hors viewBox 0, toasts, RH ko/— → 0 écart ; bbox chef 552..652 ≠ 546..642 déclaré — méthode bbox différente, verdict OK identique
## Écarts
- ∅ lecture hors WL
- `git show HEAD~1:dash/dash.js`, `HEAD~1:dash/dash.css` — état AVANT, fichiers WL
- écarts T009 vs §C9 : .deck-erreur ajoutée en tête cartes gardées — ids #card-<cle> inchangés, 0 consommateur cassé ; rebâtir si cle+couleur change — conforme « inchangées » ; `#deck .pipe{grid-column:span 2}` — CSS seul, 0 casse ; #rh-meta vide si projets absent — C0 B, 0 donnée inventée
- périmètre : commit b0109a2 multi-lot, attribution par fichier impossible au diff ; jugé par Livré T009 + WL
- cassé par T011 : ∅ observé sur les 13 cases
- jetables : .cache/eval-T014.mjs, .cache/eval-T014-etat.json, .cache/eval-T014.png, .cache/eval-T014-serveur.log
## Pour la suite
- capture : .card-tag recouvre .card-nom (ÉCLAIREUR, ARCHITECTE, IMPLÉMENTEUR, VÉRIFICATEUR) en colonne 150px — hors DoD T009, à confier à vérif visuelle
- tableRH : `taux_renvoi` undefined → `NaN %` (garde `t !== null` seule) — contrat dit null, OK tant que L2 tient
- packs futurs : 1 commit par lot, sinon DoD périmètre `git diff HEAD~1 HEAD` non attribuable
## Retour sur le pack
- Manquait: commit multi-lot non signalé, DoD périmètre suppose 1 commit = T009 ; harnais : dash.js exige `Element` et `window.matchMedia` stubés ; `--virtual-time-budget` bloque chrome (boucle 2 s)
- Inutile: ∅
