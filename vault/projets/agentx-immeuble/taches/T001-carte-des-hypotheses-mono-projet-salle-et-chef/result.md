---
tache: T001
statut: fait
---
## Livré
construire_etat (bin/dash.py:306-423), blocs → clé state.json · dépend projet
- dash.py:307-309 — lister_projets ; ∅ projets → etat_demo() · global
- dash.py:311-320 — choix UN proj : non-clos+journal.md mtime max, puis run/projet · SOURCE du mono-projet
- dash.py:321-332 — bmeta, taches, statuts, resultats, evals · oui
- dash.py:334-365 — packs, lignes_taches → `taches` (+actions via _actions_tache:497, slug=proj.name) · oui
- dash.py:367-385 — `roles` : _etat_role(taches) par rôle, _derniere_ligne(proj) · oui (jauge/actifs/en_cours)
- dash.py:370 — rôle `vault` : _doctor_rapide(projets) · global
- dash.py:387-392 — `pipeline`, `serie` (journal proj) · oui
- dash.py:396-400 — supervision.etat() global ; suggestions(sup, proj.name) ; _todo(proj…) · mixte
- dash.py:397 — `personnel` = rh.personnel() sans arg · global (vault+vault/archive)
- dash.py:402-423 — dict final : `projet`, `seuils`(dernier pack), `flux`(_flux:454), `ticker`(_ticker:755), `journal`, `evenements`(_evenements:209)
- Clés state.json (python3 bin/dash.py --json) :
  - par-projet : projet, taches, pipeline, serie, seuils, flux, journal, ticker
  - mixte : roles (identité/couleur global ; valeur/jauge/actif/actifs/en_cours/note par-projet), todo
  - global : personnel, supervision, evenements, statuts, registre_erreur, horodate, heure, pilotable, demo, (jeton ajouté do_GET:957)
- Coût : construire_etat() ≈ 0.070 s/appel (moyenne 5) · page poll 2 s → ×N projets ≈ 0.07×N s
Routes HTTP
- dash.py:949-964 do_GET : /api/term/stream · /state.json (`self.path.startswith`, ∅ lecture query) · statique
- dash.py:998-1025 do_POST : /api/run, /api/term/{open,in,resize,stop,etat} ; jeton X-AgentX-Jeton + hôte local
- parse_qs importé :29 ; utilisé :911 (jeton SSE) et :919 (SSE terminal, `q`) ; ∅ pour /state.json → ajout = `parse_qs(urlsplit(self.path).query)` dans do_GET:953
- POST projet déjà par requête : construire_argv:114-150 `req["projet"]` validé par _projet_connu:109 (slug ∈ lister_projets)
- Épingle EPINGLE=run/projet (dash.py:45) : lue à CHAQUE état :316-320 ; écrite seulement par bin/agentx:163-174 (`agentx --projet`) ; contenu actuel `seagle-site` ; ∅ écriture depuis la page
- Cache : ∅ (construire_etat recalculé par requête)
dash/dash.js
- :1029-1037 charger() — fetch 'state.json?'+Date.now(), ∅ param projet ; ETAT=s ; rendre(s)
- :958-1020 rendre(s) — orchestre tout ; titre doc :992
- Par-projet : s.projet :987-992,:442,:558,:1118,:1163 · s.taches :410,:591,:602,:1166,:1168 · s.pipeline :97-107,:408-411,:445-449,:681 · s.flux :487,:637 (arcsRelais:354) · s.serie :430,:442,:509-558 · s.seuils :660 · s.journal :603 · s.ticker :1007
- Mixte : s.roles (majRegistre:15, rendreDeck:42, postesSalle:281, construireSalle:404-460) · s.todo :612
- Global : deck rendreDeck:42-120 (roles) · RH rendreRH:574 (s.personnel) · supervision rendreSupervision:721 (s.supervision) · sonnerie:909 (s.evenements)
- Salle iso : construireSalle:404-505 (svg #room viewBox 700×480) ; primitives boite:126, salon:135, mascotte:151, bureau:172, plante/rack/radar/fusee/poubelle:219-270 ; signature de reconstruction :966 (flux, actifs, couleurs)
- Poste de pilotage : rendreTaches:589, rendreTodo:611, brancherTaches:1112 (pilote({action,projet:ETAT.projet.slug}):1118), actionTache:1121, ouvrirSaisie:1131, palette entreesPalette:1162 (slug=s.projet.slug), pilote:1050
- `s.agents` ∅ (équivalent : roles[].actifs)
dash/index.html (173 l.) ordre dans .frame
- :15 #projet-actif (nom/slug/statut/depot/obj :18-24) — "PROJET ACTIF" singulier
- :29 #deck (header rôles)
- :32-76 section.salle : #ticker:36 · #room svg:46 · #hud-time:53 · #todo:61 · #flux:72
- :78-90 courbe : #chart:83 #chart-val/-sub
- :92 #rh · :98 #supervision · :~100-140 .bottom : #tasks:120 #journal:124 #seuils:133 #pm-row:136
- :143 #tiroir terminal (#term:155) · :160 #toasts · :163 #palette
- Insertion coupe : entre :13 (.frame) et :15 #projet-actif, ou entre :29 #deck et :32 section.salle
Chef
- terminal.py:22-48 CONSIGNE_CHEF : « brief du projet courant (`./bin/agentx board`) » · « état du projet courant » · PROGRAMME:49-50 « point sur le projet courant »
- agentx board sans --projet : projet courant implicite (vx.py, NV)
- agentx:163-174 `--projet <slug>` : écrit run/projet ; vérifie dir vault/projets/slug ; un seul slug
- terminal.py : session chef unique (démon), ∅ param projet
Sonnerie
- sonnerie.py:49-57 ev = {id,t,quoi,role,tid,statut,verdict} ; **∅ champ projet**
- tid lu dans `tache:` du result.md (RE_TID:25) ; ∅ slug dans le frontmatter result.md (pack: format = tache,statut)
- run/evenements.jsonl : 1 ligne = même schéma ; 'tid' souvent "" ; TID non unique entre projets (T001 existe partout)
- dash.js:909-920 sonnerie compare ids ; ∅ filtre projet
Todo
- dash.py:546-656 _todo(proj, taches, lignes, personnel) : 1 projet ; slug=proj.name injecté dans chaque cmd/exe
- dash.py:399-400 + supervision.suggestions(sup, slug):314 : suggestions prod rattachées au projet affiché
- dash.py:647-653 lit proj/todo.md (cases `- [ ]`)
- dash.py:641-645 entrées RH (personnel global) injectées dans la todo du projet
Supervision / RH
- supervision.py:291 etat() ∅ param projet · config() supervision.json global ; depots():257 par dépôt (hors vault)
- rh.py:23 personnel(projet=None) : None = tous projets + vault/archive ; sinon 1 projet ; déjà prêt à 1 projet
Vault réel
- projets non clos : 8 (agentx-entreprise, agentx-immeuble, dashboard-grille, geolens-charge-3d, geolens-preview-3d, geolens-viewer, orthopro, seagle-site : statut `cadrage`)
- clos : 1 (dashboard-direct)
- archivés : 1 dans vault/archive/ (2026-10-05-recherche-floue) ; statut `archive` possible dans brief mais 0 projet
- Pièges : 9 projets dans vault/projets/, 8 en `cadrage` → "étages" = 8 ; statut ∈ {cadrage, clos} seulement observés ; lister_projets() (vx.py:169) ne filtre pas le statut
## Vérifié comment
python3 bin/dash.py --json → 19 clés : demo registre_erreur statuts personnel horodate heure projet roles pipeline taches(28) serie seuils flux(43) todo(18) supervision pilotable ticker journal evenements
python3 -c "import dash;…construire_etat() x5" → 0.0698 s/appel
python3 -c "import vx; statut brief par projet" → 8 cadrage, 1 clos (dashboard-direct)
ls vault/archive → 2026-10-05-recherche-floue
cat run/projet → seagle-site
## Écarts
- ∅ (aucune lecture hors WL ; `vault/archive` listé par ls, `vx.py` lu via python/rg)
- coût par bloc non chronométré (seul total mesuré)
## Pour la suite
- Mono-projet = 1 seul point : dash.py:311-320 (choix `proj`) ; tout en aval reçoit `proj` ; construire_etat n'a ∅ paramètre
- construire_etat ≈ 0.07 s ; N=8 étages ≈ 0.56 s/poll de 2 s si tout recalculé → découper par projet (blocs :321-392 + _todo + _flux) vs global (:396-400 supervision/personnel, :405-406, :422)
- state.json : par-projet = projet, taches, pipeline, serie, seuils, flux, journal, ticker ; mixte = roles, todo ; global = personnel, supervision, evenements, statuts, registre_erreur, horodate, heure, pilotable, demo
- GET /state.json n'accepte ∅ query (dash.py:953 `startswith`) ; passer `?projet=` = parse_qs(urlsplit(self.path).query) (déjà importé :29, motif :919)
- POST /api/run prend déjà `projet` par requête (validé _projet_connu:109) → pas de changement serveur pour actions par étage
- run/projet : lu à chaque état (:316-320), écrit uniquement par `agentx --projet` (agentx:163-174) ; ∅ écriture page
- JS : s.projet/taches/pipeline/flux/serie/seuils/journal lus partout via ETAT global (dash.js:958-1020, 1118, 1163) ; construireSalle:404 et rendreTaches:589 = « étage zoomé » ; rendreDeck/RH/supervision/sonnerie = global
- HTML : coupe d'immeuble à insérer index.html:14-15 (avant #projet-actif) ; #projet-actif:15 + section.salle:32 = étage zoomé
- sonnerie.py:49-57 : événement ∅ champ projet (id,t,quoi,role,tid,statut,verdict) ; TID non unique entre projets → ambigu
- Chef : terminal.py:22-50 CONSIGNE_CHEF dit « projet courant » ×3 (+PROGRAMME:49) ; agentx:163-174 un seul slug épinglé
- rh.personnel(projet=None) déjà global/par-projet (rh.py:23) ; supervision.etat() global, suggestions(sup, slug) lié au projet affiché
- Vault : 8 non clos (tous `cadrage`), 1 clos, 1 archive (vault/archive/) ; lister_projets ne filtre pas statut
## Retour sur le pack
- Manquait: ∅ | Inutile: bin/rh.py partiellement, brief.md
