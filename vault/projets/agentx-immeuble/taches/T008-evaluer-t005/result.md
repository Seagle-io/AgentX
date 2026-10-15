---
tache: T008
projet: agentx-immeuble
statut: fait
evalue: T005
verdict: retenir
---
## Verdict
retenir — 10/10 cases DoD T005, e2e 45/45
## DoD
- [x] HTML §C8 verbatim `index.html` 13↔14 ; `#pa-label` ÉTAGE ; 1 `id="immeuble"` — `python3 cmp contrat L256-264 vs index.html L14-22 → True 9 9` · `pa-label → (26, '<div class="pa-label" id="pa-label">ÉTAGE</div>')` · `rg -c 'id="immeuble"' → 1`
- [x] JS §C8 : 8 symboles + modifs, signatures inchangées — `rg ^function → IMMEUBLE :968 RE_SLUG_PAGE :969 etageDemande :971 allerEtage :979 surHash :984 rendreImmeuble :993 sonnerEtages :1043 brancherImmeuble :1055` ; HEAD vs arbre : `construireSalle(s) rendreTaches(s) rendreTodo(s) annoncer(evs) sonnerie(s) rendre(s) charger() pilote(req, bouton) brancherTodo() entreesPalette(s) executerEntree(e, bouton)` identiques
- [x] réponse périmée ignorée — `e2e → OK réponse périmée ignorée (ni ETAT ni rendre) — 1 réponse(s) dashboard-grille · rendus ["geolens-viewer"×3] · ETAT geolens-viewer` + témoin `OK réponse lente non périmée rendue — ["dashboard-grille"]`
- [x] démo `immeuble null` → caché, 0 erreur — `OK démo : #immeuble caché · OK démo : 0 entrée ⇅ étage · OK démo : 0 erreur — []`
- [x] état visuel §C8 — `OK 1 étage .sel aria-current=page · OK sel = bord accent + fond clair — inset rgb(59,130,246) · OK dormant 16 px, seuls num+nom · OK al-bloque rgb(255, 59, 92) · OK al-urgent rgb(255, 204, 51) · OK compteurs à 0 → opacity .35 — 20 · OK .sonne 2.5s · OK retirée après 2.5 s · OK max-height 360px auto (40vh@900) · OK 28 px · OK ≤480 : 4 pastilles + « +2 » · OK alerte ["0px","\"!\"","1 bloquée(s)"]`
- [x] `node --check` rc 0 ; 0 alert/confirm/prompt — `node --check dash/dash.js → check=0` · `rg -n "alert\(|confirm\(|prompt\(" → rc=1`
- [x] e2e DoD L2 — `node .cache/eval-T008/e2e.mjs → rc=0 BILAN 45/45 OK` : 8 li · toit · `SOUS-SOL · 2` · `#/seagle-site` + titre · 56 actions exe.projet=slug · `/api/run` abortés `[["integrer","seagle-site"],["board","seagle-site"]]` · `#/zz → hash «» refus «slug inconnu : zz»` · Alt+↓ `#/geolens-preview-3d` · Ctrl+K `9 / 9` · 390 `{"sw":390,"cw":390}` · 0 erreur console
- [x] captures T005 listées — `os.path.getsize → immeuble-1280.png 257755 · immeuble-390.png 96153 · etage-zoome.png 173860`
- [x] `git diff --stat -- dash/` ; 0 fichier hors WL imputable — `→ 3 files changed, 284 insertions(+), 8 deletions(-)` ; autres M = bin/* (L1/L3), .claude/*, roles.json, vault (hors T005)
- [x] `result.md` T005 au format — 5 sections exactes, 70 lignes, `statut: revue`
## Motif
∅
## Vérifié comment
```
node .cache/eval-T008/e2e.mjs → rc=0 · BILAN 45/45 OK (sortie : .cache/eval-T008/e2e.out)
banc :7801 python3 bin/dash.py --no-open → 200 ; kill pid 220808 → curl 000
routes : **/api/run abort (2 comptées) · /api/term/* simulé · state.json réécrit (démo, dormant, urgent, 6 agents, événement)
git diff --numstat -- dash/ → 113 0 dash.css · 160 7 dash.js · 11 1 index.html
captures : .cache/eval-T008/immeuble-1280.png · immeuble-390.png · etage-zoome.png
```
Affirmations T005 re-jouées (8) : node --check · rg alert · rg -c immeuble · réponse périmée · 390 scrollWidth · #/zz · Ctrl+K 9 · diff 284+/8- → toutes OK.
Écarts T005 jugés (§C8 / décisions) :
- `aller` dans filtrerPalette — additif, signature inchangée ; « copier » serait faux → ne casse pas
- démo sans étiquette `toit` — ≠ lettre C1:76+C8:300 ; immeuble caché, décision « 0 donnée inventée » → toléré
- ≤480 en 2 lignes — `gridTemplateColumns` 4 colonnes observé ; C8 muet sur rangées → ne casse pas
- `#9fb0cc` — HEAD dash.css:324,368,397,426,470 existant → pas de nouvelle charte
- cage/cabine/dalle hachurée — `sel` = bord accent + fond clair conservé → ne casse pas
## Écarts
- ∅ lecture hors WL
- T005 `dash.js 167 (+159/-8)` ≠ observé `+160/-7` ; totaux 284/8 exacts — paraphrase, non bloquant
## Pour la suite
- T009 : 2 clics étage rapides réseau lent ; bouton retour navigateur ; focus clavier conservé après rendu
- 390 px : barre basse terminal déborde (« arrête » coupé) — préexistant, hors T005
- packs designer : exiger sortie brute de `git diff --stat`, pas un résumé
- contrat : trancher étiquette `toit` en démo (C1:76 vs immeuble caché)
## Retour sur le pack
- Manquait: réel vault = 0 dormant, 0 al-urgent, 0 étage > 4 agents → injection state.json nécessaire, à prévoir au pack
- Inutile: §C1 L23-77 lu pour forme seulement ; §C3 non utilisé
