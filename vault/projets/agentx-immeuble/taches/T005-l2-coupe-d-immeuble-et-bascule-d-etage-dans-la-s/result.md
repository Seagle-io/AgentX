---
tache: T005
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/index.html:14-22 — §C8 `<nav#immeuble>` verbatim
- dash/index.html:26 — `.pa-label#pa-label` = `ÉTAGE`
- dash/dash.js:963-1078 (IMMEUBLE :968, hashchange :1077) — IMMEUBLE, RE_SLUG_PAGE, etageDemande, allerEtage, surHash, rendreImmeuble, sonnerEtages, brancherImmeuble
- dash/dash.js:1088,1094 — rendre : rendreImmeuble + slug en tête de signature salle
- dash/dash.js:1158-1173 — charger : `?projet=`, réponse périmée ignorée, refus → hash effacé
- dash/dash.js:611-619,622,635 — etiquetteEtage + `.ti-etage` + `#todo-count = todo_total ?? n`
- dash/dash.js:1241-1242 — brancherTodo : `[data-etage]` → allerEtage
- dash/dash.js:909,929 — annoncer `projet · tid · t` ; sonnerie → sonnerEtages
- dash/dash.js:1306-1314,1324,1345 — palette : entrées `⇅ étage`, libellé `aller`, executerEntree `e.aller`
- dash/dash.js:1399-1406 — Alt+↑/↓ hors xterm, palette fermée, bornes saturées
- dash/dash.js:1627 — amorçage `IMMEUBLE.slug = etageDemande(); brancherImmeuble();`
- dash/dash.css:48-131 — `.immeuble/.im-*` : cage num, cabine sel, subgrid, sous-sol hachuré, focus
- dash/dash.css:315-321 — `.ti-etage`, `.ti-etage.toit`
- dash/dash.css:715-734 — ≤ 480 px : 2 lignes/étage, 4 pastilles + `+N`, alerte `!`
- .cache/T005/e2e.mjs — DoD L2, 36 assertions, banc :7799
## Vérifié comment
```
node --check dash/dash.js → (rien) check=0
rg -n "alert\(|confirm\(|prompt\(" dash/dash.js → (rien) rc=1
rg -c 'id="immeuble"' dash/index.html → 1
node .cache/T005/e2e.mjs → rc=0 (sortie complète : .cache/T005/e2e.out)
OK nb étages == immeuble.etages — 8 li · 8 serveur
OK toit — TOIT · CHEFen session todo 100 · 1 urgent
OK sous-sol titre — SOUS-SOL · 2 · OK sous-sol fermé · OK ordre = rang serveur
OK hauteur étage 28 px — [28] · OK max-height 40vh — 360px auto · OK compteur 0 opacity .35
OK al-bloque bord #ff3b5c — orthopro rgb(255, 59, 92) · OK compteurs alignés (subgrid) — [1068]
OK 1er focusable = toit ; Tab → rang 0 ; ↓ → rang 1 · OK focus visible — solid rgb(45, 226, 230)
OK clic → hash + #projet-nom — #/seagle-site · « Seagle : vitesse, référencement, qualité »
OK state.json?projet= → taches[].actions[].exe.projet = slug — 56 actions · seagle-site
OK /api/run abortés portent le slug — [["board","seagle-site"],["integrer","seagle-site"]]
OK #/zz → hash effacé — hash «  » · refus « slug inconnu : zz »
OK Alt+↓ → étage rang 1 · OK Alt+↑ ×2 → rang 0, borne saturée
OK sous-sol clos → étage lu — dashboard-direct
OK Ctrl+K « étage » → n entrées — 9 ⇅ / 9 attendues · OK Entrée palette → allerEtage
OK todo : .ti-etage par item, #todo-count = todo_total — 40 étiquettes · count 100
OK réponse périmée ignorée — 1 réponse(s) dashboard-grille arrivée(s) après bascule · rendus ["geolens-viewer","geolens-viewer"] · ETAT geolens-viewer
OK événement → .sonne + toast « projet · tid » · OK .sonne retirée après 2.5 s
OK 390 : scrollWidth == 390 — {"sw":390,"cw":390,"imSw":372,"imCw":372} · OK alerte = icône ["0px","\"!\"","1 bloquée(s)",14]
OK démo : #immeuble caché · OK palette sans entrée étage · OK 0 étiquette .ti-etage
OK 0 erreur console · /api/run abortés : 2 · BILAN 36/36 OK
contraste (WCAG, node) : texte/panel 12.39 · #9fb0cc/panel 8.58 · cabine #06070c/accent 5.47 · cyan/sunk 12.49 · blue 5.13 · violet 4.77 · red 5.42
captures : .cache/T005/immeuble-1280.png · .cache/T005/immeuble-390.png · .cache/T005/etage-zoome.png
git diff --stat -- dash/ → dash.css 113+ · dash.js 167 (+159/-8) · index.html 12 (+11/-1) ; 284 insertions, 8 deletions
banc : kill pid → curl :7799 → 000
```
## Écarts
- écart au contrat: §C8 filtrerPalette (hors liste) — libellé `aller` sinon « copier » faux
- écart au contrat: §C8 rendreTodo — démo (`immeuble null`) : 0 étiquette, pas « toit » inventé
- écart au contrat: §C8 ≤480 grille `auto 1fr auto auto` → 2 lignes (nom·todo·alerte / agents·cpt) — 6 cellules pour 4 colonnes
- a11y: `dormant` 16 px et `.ti-etage` 13 px < cible 24 px — imposé §C8 / gabarit `.ti-act`
- a11y: compteurs à 0 opacity .35 → contraste < 4.5 — imposé §C8
- invention: cage num + cabine accent, dalle hachurée sous-sol — lecture « coupe » sans nouvelle couleur
- couleur #9fb0cc (kit, `.err-msg`) au lieu de `--dim` 3.37:1 pour textes secondaires
- lecture hors WL: ∅ · git status : .claude/*, CLAUDE.md, roles.json modifiés hors T005, non touchés
## Pour la suite
- :7777 relancée inutile (dash.* servis à chaque requête) ; vrai Chromium 1280 : 8 étages, toit, `SOUS-SOL · 2` fermé
- Tab → toit → étage rang 0 ; ↑/↓ ; Entrée → `#/slug`, `#projet-nom` = titre ; bouton retour navigateur → étage précédent
- `#/zz` → hash vidé ; Alt+↓/↑ (focus hors xterm) ; Ctrl+K « étage » → 9
- 390 px : `scrollWidth == 390`, orthopro `!` + title ; défauts `.trow`/tiroir préexistants hors périmètre
- tenter : 2 clics étage rapides (réseau lent) → étage affiché = dernier clic
## Retour sur le pack
- Manquait: §C8 ≤480 — placement des 6 cellules sur 4 colonnes non spécifié ; Ctrl+K muet si focus xterm (amorçage `term.focus()`) — à dire au vérificateur
- Inutile: ∅
