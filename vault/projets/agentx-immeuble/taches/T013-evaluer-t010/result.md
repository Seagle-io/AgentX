---
tache: T013
projet: agentx-immeuble
statut: fait
evalue: T010
verdict: retenir
---
## Verdict
retenir — 9/9 cases DoD T010 re-prouvées
## DoD
- [x] F1 todo bornée, card ≤ room, `#todo` défile, Δpage ±2 à 1600/1280 — `node .cache/eval-T013/mesure.mjs 7806 7807` → `F1 apres 1600x1000 40={"todo":619,"todoScroll":2684,"card":672,"room":735,"page":3298} 4={"page":3298} Δpage=0 card<=room:true défile:true` · `F1 apres 1280x800 40={"todo":400,"todoScroll":2684,"card":453,"room":516,"page":3167} 4={"page":3167} Δpage=0 card<=room:true défile:true`
- [x] F1 mesure de départ collée — result T010 `avant.txt` → `F1 1600x1000 40={"todo":3662,...,"page":6255} Δpage=3042` ; rejoué (instantané sans `contain:size`) → `F1 avant 1600x1000 40={"todo":2684,"room":2800,"page":5363} 4={"page":3298} Δpage=2065 défile:false`
- [x] F2 6 clés GLYPHES, grammaire, 0 couleur en dur, capture — mesure.mjs → `F2 {"manquants":[],"rendus":8,"bb":{"avis":[-6.2,-6.4,11.2,12.6],"budget":[-6.4,-6.4,12.8,12.8],"specs":[-5,-6.6,10,13.2],"contenus":[-6.2,-5.8,12.7,11.8],"risques":[-6.2,-3.8,12.4,7.5],"cahier":[-6,-6.4,11.6,12.8]}}` ; `.cache/eval-T013/glyphes.png` 6 neufs + resultat + pack ; `sed -n 337,354p dash.js | rg -P '#[0-9a-fA-F]{3,6}|rgb|hsl|fill="(?!none|\$\{c\})'` → rc=1 ; `rg -o 'stroke="[^"]*"'` → `16 stroke="${c}"` ; stroke-width → `1.2×4 1.3×3 1.4×8 1.5×1` ; fill → `none×10 ${c}×1`
- [x] F3 390 dernière `.trow` cliquable, tiroir fermé et ouvert — `F3 390 tiroir=0 rows=28 boutons=["✎ pack@231,438 49x24 OK","lint@277,438 39x24 OK","abandonner@334,438 69x24 OK"]` ; `node f3ouvert.mjs` → `{"tiroirTop":253,"tiroirPos":"fixed","essais":["✎ pack@231,139 OK","lint@277,139 OK","abandonner@334,139 OK"]}`
- [x] F4 390 tête 34 px 1 ligne, scrollWidth ≤ 390 — `F4 390 tiroir=0 {"ouvert":false,"tete":34,"titreH":10,"titreLignes":1,"teteSW":388,"teteCW":388,"pageSW":390}` ; tiroir=1 idem
- [x] 0 régression coupe, deck, tiroir 1600, captures avant/après — `1600 avant room={"w":1072,"h":735,"attendu":735} immeuble={"hidden":false,"h":291,"etages":9,"deck":490}` = `1600 apres` idem ; `node tiroir1600.mjs` → avant = apres `{"top":966,"h":640,"tete":34,"meta":"block"}` (t=0), `{"top":360,...}` (t=1) ; `.cache/eval-T013/1600-{avant,apres}.png`
- [x] `node --check` rc 0 ; alert/confirm/prompt ∅ — `node --check .cache/snap-T010/dash/dash.js` → `check rc=0` ; `rg -n "alert\(|confirm\(|prompt\(" dash.js` → `rg rc=1`
- [x] diff --stat collé, mesure.mjs, 0 erreur console — `.cache/snap-T010/diff-stat.txt` → `dash.css 143 + · dash.js 185 +- · index.html 12 +-` ; index.html hunk `@@ -11,9 +11,19` = `<nav class="immeuble">` + `pa-label` → T005 ; hunks css `:269`/`:699`/`:713`, js `:334` GLYPHES = T010 ; `.cache/T010/mesure.mjs` présent ; mesure.mjs → `console erreurs: ∅`
- [x] result.md T010 au format — frontmatter `statut: revue`, 5 sections exactes, `wc -l` → 52 ≤ 60
## Motif
∅
## Vérifié comment
banc `.cache/eval-T013/banc` :7806 = instantané (`cmp dash.css snap` → `banc=snap`) ; banc-avant :7807 = instantané − `;contain:size` (`contain:size retirés 1`) ; routes api/run abort, api/term simulé, state.json réécrit 4|40
`F1 apres 1241x800 40={"todo":373,"card":426,"room":489,"hud":489,"hudDeborde":0,"page":3148} 4={"page":3148} Δpage=0` — bord haut contain:size
`F1 apres 1024x768 40={"todo":260,"todoScroll":2418,"card":313,"hud":376,"page":4383} 4={"page":4383} Δpage=0` — ≤1240 contain:none sans effet de bord
`F1 avant 1024x768 ... Δpage=0 page 4383` = apres — ≤1240 inchangé
`IMM a1 coupe={"visible":true,"etages":9} a2 bascule(agentx-immeuble)={"hash":"#/agentx-immeuble","requete":true,"actif":"page"} a3 slug-inconnu={"hash":""}`
affirmations result T010 rejouées 7 : F1 1600 Δ0 OK · F1 1280 todo 400 card 453 room 516 = identique · F4 tete 34 lignes 1 SW 390 = identique · F3 ouvert OK zone libre (T010 y=127, moi y=139) · étroit 1024 todo 260 hud 376 = identique · node --check/rg OK · console ∅ OK ; écart : page 1600 T010 3213 ≠ 3298 — vault vivant, Δ0 tient
kill pid 258631 + banc :7806 → `curl :7806 → 000` · `curl :7807 → 000` · `:7777 → 200` intacte
## Écarts
- lecture hors WL: `ls .cache/T010/` — existence mesure.mjs et captures T010 (DoD T010)
- banc-avant `.cache/eval-T013/banc-avant/` ajouté — F1 avant rejoué
## Pour la suite
- 390 tiroir ouvert : `#tiroir` fixed top 253 couvre 591/844 px ; boutons sous le tiroir au scroll par défaut (`KO` à y=438), atteignables au défilement — DoD futures : préciser « dans la zone libre »
- `.hud contain:size` : si contenu hud > hauteur salle (fenêtre basse 1241-1300 px) débord non clippé ; mesuré `hudDeborde:0` à 1241×800 seulement
- mesures F1 dépendent du vault vivant : comparer Δ, pas valeurs absolues
## Retour sur le pack
- Manquait: commande de l'état « avant » F1 (instantané sans T010 indisponible ; reconstruit en retirant `contain:size`) ; nom de port pour un 2e banc
- Inutile: ∅
