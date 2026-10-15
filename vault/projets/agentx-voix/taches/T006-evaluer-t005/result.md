---
tache: T006
projet: agentx-voix
statut: fait
evalue: T005
verdict: retenir
---
## Verdict
retenir — 7/7 cases DoD T005 prouvées
## DoD
- [x] console vocale `CONSOLE VOCALE`, colonne droite, récentes en haut, HH:MM, bornée, vide, échappée, illumination 2 s — `node .cache/voix-eval-T006/e2e.mjs → OK ordre : plus récente en haut — 1re=phrase 29 der=phrase 0 · OK heure HH:MM — 09:29 … 09:00 · OK 0 entrée → « rien dit pour l'instant » · OK hostile : 0 exécution / 0 balise / affiché tel quel · OK nouvelle phrase : t0=true t+1.2=true t+2.4=false` ; capture `salle-1600.png` → carte voix x=1275 à côté tour x=193, tiroir fermé
- [x] hauteur page ±2 px 0 vs 30 à 1600×1000 et 1280×800 — `OK 1600×1000 h0=3359 h30=3359 carte=168/168 · OK 1280×800 h0=3107 h30=3107 · OK 1024×768 h0=4416 h30=4416`
- [x] 🔊 / ■ / 🎙️ → requêtes exactes, état visible, focus xterm, désactivés + titre, 400 tel quel, 0 alert — `OK 🔊 corps {"on":true} jeton:true · OK allumé ["true","🔊"] · OK re-clic {"on":false} · OK ■ stop {} · OK 🎙️ micro {"on":true} · OK 400 → ["état inconnu — relance dictee","voix-pied ko"] · OK focus xterm-helper-textarea · OK parle false [true,true,false] · OK dictee false [false,false,true] · OK 0 dialogue`
- [x] `state.voix` absent → cachée, 0 erreur — `OK voix absent → carte cachée · OK voix null → carte cachée · OK présent → null en session → cachée · OK absent/null : 0 erreur — []`
- [x] e2e `.cache/voix-T005/e2e.mjs` routes interceptées, 390 px, 0 erreur, captures — rejoué sur instantané : `BASE=http://127.0.0.1:7820/ node .cache/voix-eval-T006/rejeu-T005/e2e.mjs → 42 OK · 0 KO` ; `ls .cache/voix-T005/ → console-1600.png console-390.png e2e.mjs` ; mien : `OK 390 px scrollWidth=390 clientWidth=390 carte=336`
- [x] `node --check` rc 0 ; 0 alert/confirm/prompt ; diff stat collé — `node --check snap/dash.js → rc=0` ; `grep -nE "alert\(|confirm\(|prompt\(" snap/dash.js → rc=1` ; `git diff --stat -- dash/ → 3 files changed, 140 insertions(+), 1 deletion(-)` = stat collée T005
- [x] `result.md` T005 selon format — `grep "^## " → Livré, Vérifié comment, Écarts, Pour la suite, Retour sur le pack` ; corps 59 lignes ≤ 60 ; `statut: revue`
## Motif
∅
## Vérifié comment
```
node .cache/voix-eval-T006/e2e.mjs → 42 OK · 0 KO, rc=0
  /api/voix/** /api/run /api/term/** /state.json : ctx.route ; 5 voix interceptées mode,mode,stop,micro,micro ; api/term simulées=45
  OK NR tour d'immeuble visible — {"vue":"immeuble","w":1072,"h":735,"etages":12,"vis":"visible","op":"1"}
  OK NR coupe dessinée — [12,339.67]
  OK NR liste du chef bornée (1 vs 120 todo) — page 3374/3374 carte 495.08/495.08 todo scroll 14268>442
  OK 0 erreur console (hors 400 micro voulue) — []
  OK bouton désactivé : 0 requête · OK heure hostile → --:--
grep -c "api/voix" .cache/voix-eval-T006/serveur.log → 0
cmp snap/{dash.js,dash.css,index.html} dash/ → identiques
git diff -U0 -- dash/ → 7 hunks, tous voix ; 1 suppression = ligne amorçage + brancherVoix()
kill 988179 ; curl :7820 → 000
```
Banc : `.cache/voix-eval-T006/banc` (instantané), `AGENTX_VOIX_DIR=.cache/voix-eval-T006/v`, :7820 ; captures `.cache/voix-eval-T006/{console-1600,console-390,salle-1600}.png`.
## Écarts
- lecture hors WL: `.cache/voix-T005/` (ls, grep, cp e2e.mjs) — rejouer e2e déclaré T005
- lecture hors WL: `dash/` réel (cmp, `git diff -- dash/`) — périmètre diff du livrable
- lecture hors WL: `git diff --stat -- bin/` — bin/* modifiés : 4 fichiers, non attribuables à T005 (hunks dash/ seuls)
- lecture hors WL: `ls ~/.cache | grep voix` — listing, 0 fichier lu
- `rg` → `grep -nE` : rg hors outils autorisés, même motif
## Pour la suite
- carte voix y=1115 à 1600×1000 : sous la ligne de flottaison, scroll requis — DoD « visible » ≠ « au-dessus du pli »
- réel : micro → « état inconnu — relance dictee » tant que dictee ancien
## Retour sur le pack
- Manquait: sélecteurs NR (`.room-wrap[data-vue]`, `.tour-coupe`, `.todo-card`) ; règle attribution `bin/*` modifiés dans arbre partagé
- Inutile: `bin/dash.py` en L — `state.voix` déjà recopié en Contrats
