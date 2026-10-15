---
tache: T024
projet: seagle-pilotage
statut: fait
evalue: T021
verdict: retenir
---
## Verdict
retenir — §C2 tenu, banc rejoué, 0 défaut
## DoD
- [x] §C2 appliqué (clés, signatures, `--etage`) — `--json | keys etages[0]` → `activite age_j agents alerte compteurs dormant num produit projets rang selection selectionnable slug statut titre todo total` · `produits_erreur ''` · `sous_sol [('dashboard-direct','kora'),('2026-10-05-recherche-floue','')]` · `todo sans etage 0` · `dash.py:235 ev.setdefault("etage", …)` · `grep def` → `:450 _bloc_produit(prod, blocs, sel, maintenant)` `:494 _groupes(ouverts, metas)` `:538 _choisir(projets, groupes, etage, projet)` `:575 construire_etat(projet=None, etage=None)` · `--help` → `--etage ETAGE`
- [x] DoD L4 vrai vault — `--json` → `produits 4 seagle 1 … inv True` · ordre `kora(4) geolens(3) agentx(2) seagle(1)` = ordre `produits.json`, seagle entreprise · `--projet orthopro` → `{'slug':'kora','projet':'orthopro','source':'requete','refus':''}` · `--etage zz` → `refus 'slug inconnu : zz'` · `--etage orthopro` → `{'slug':'kora','projet':'orthopro','source':'requete'}`
- [x] mode secours (copie vault, `produits.json` absent) — `projets 'produits.json absent' 10` étages · chaque étage `projets=1`, `produit None` · `todo etage==projet True` · `--projet orthopro` → `slug orthopro requete`
- [x] perf §C7 — commande verbatim sur banc → `froid 226 ms · chaud médiane 80 ms`
- [x] non-régression — `state.voix` → `['dictee','ecoute','en_cours','journal','mode','parle']` · `taches[0].actions` → `integrer, virer` · todo → `'T042 prête mais aucun agent lancé — dispatcher'` · `:358 cle = (sig, _empreinte_evenements())` · POST `/api/run {"action":"board"}` jeton → `{"commande": "vx.py board", "code": 0…` · POST `/api/voix/zz` → `400 route inconnue : zz` · `/api/voix/mode` sans jeton → `403` · `py_compile` → `rc=0`
- [x] salle-banc sélections (rejoué :7827) — `etage=kora` → `kora/dashboard-grille requete` · `etage=kora&projet=dashboard-grille` → idem · `projet=seagle-site` → `seagle/seagle-site requete` · kill → `000`
- [x] `git diff --stat` collé — `git show --numstat ffae477 -- bin/dash.py` → `136 48 bin/dash.py` == déclaré
- [x] écart (a) `_choisir` sans blocs, relit via cache `_bloc_projet` → conforme : signature = §C2 L167 verbatim ; L165 « entrées = blocs de _bloc_projet (cache inchangé) » ; cache hit `:358`
- [x] écart (b) mode projets tous dormants → `projets[0]` → conforme : §C2 L163 « 5. lister_projets()[0] → source defaut » explicite ; L124 « comportement T019 intégral » = tension de contrat, pas défaut T021
- [x] 3 hostiles :7827 — `etage=zz&projet=orthopro` → `200 kora/orthopro requete` (sélection valide) · `projet=inexistant` → `200 refus 'slug inconnu : inexistant'` · `etage=<script>` (brut et %3C) → `200 refus 'slug inconnu : <script>'` · bonus `projet=../../etc` → `200 refus` · `grep -ci traceback serveur.log serveur2.log` → `0 0`
- [x] isolation — `md5sum bin/dash.py bin/produits.py produits.json | diff - avant` → `md5 identiques` · `curl :7827` → `000` · `ps | grep -c 7827` → `0`
## Motif
∅
## Vérifié comment
banc `.cache/seagle-eval-T024/banc` (bin copié avant mesure) · secours `.cache/seagle-eval-T024/secours` (vault `cp -rL`, sans produits.json)
md5 avant → `68c5a7a3… dash.py · a9d2ad8d… produits.py · 51822ea0… produits.json` ; après → identiques
## Écarts
- lecture hors WL : ∅
- vault vivant : `dashboard-grille` passé `statut: clos` pendant l'éval → kora = `['orthopro']`, dashboard-grille au sous-sol ; sans lien T021
- `pgrep -f` a tué le shell de commande (motif dans argv) → kill par pid `ps`
## Pour la suite
- `_choisir.cle_de` relit `brief.md` d'un projet clos (`lire_frontmatter`) : contredit §C2 L171 « 0 lecture de plus » sur ce seul chemin → passer `etage_de` à `_choisir`
- §C2 L124 vs L163 : architecte doit trancher si mode projets reprend T019 étape 3 `etages[0]` ou garde `lister_projets()[0]` (peut être un projet clos)
- choix T021 `projet` invalide + `etage` valide → `refus ""` : non dit par §C2 L161 ; à acter
- salle :7777 à relancer (dash.py chargé au démarrage)
## Retour sur le pack
- Manquait: `/api/run` attend `{"action":…}` + en-tête `X-AgentX-Jeton` (jeton dans `state.json`) ; kill par pid, pas `pgrep -f`
- Inutile: `produits.py` en WL (non ouvert)
