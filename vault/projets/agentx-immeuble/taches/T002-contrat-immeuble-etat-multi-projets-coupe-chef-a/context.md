---
pack: T002
projet: agentx-immeuble
role: architecte
cree: 2026-10-15
---

# Pack T002 — Contrat immeuble : état multi-projets, coupe, chef au toit

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `vault/projets/agentx-immeuble/contrat.md` : le contrat exécutable qui fait passer la salle d'un projet à un immeuble (1 étage par projet ouvert, sous-sol = clos/archivés, toit = chef unique, pool d'agents commun), découpé en 3 lots parallélisables à fichiers disjoints.

## Definition of Done
- [ ] `contrat.md` § C0 options : ≥ 2 options pour l'état multi-projets (ex. 1 `state.json` + `immeuble` résumé + étage détaillé via `?projet=` · vs route `/immeuble.json` séparée · vs autre) ; tableau coût now / 1 an / rend impossible ; choix motivé par le coût mesuré (0.07 s/projet, 8 projets, poll 2 s)
- [ ] § schéma `state.json` : nouvelle clé (ex. `immeuble`) verbatim, types et bornes : étages (slug, titre, statut, rang, compteurs par statut, agents actifs {role, tid}, alerte, maj), sous-sol, toit (chef vivant ?, todo totale) ; clés par-projet existantes inchangées pour l'étage détaillé
- [ ] § règle d'ordre des étages (activité récente : source exacte, ex. mtime journal.md) et de « dormance » (8 projets tous `cadrage` aujourd'hui : un étage sans activité depuis N jours se replie ? tranche N) ; règle du sous-sol (`clos`, `archive`, `vault/archive/*`)
- [ ] § sélection de l'étage : GET `/state.json?projet=<slug>` (validation, slug inconnu → ?), défaut = épingle `run/projet` puis le plus actif ; persistance côté page (URL hash ou localStorage, tranche) ; `exe.projet` des actions = étage détaillé
- [ ] § todo agrégée : `todo` = tous les étages, chaque item porte `projet` ; ordre/priorité inter-projets ; plafond
- [ ] § événements : `run/evenements.jsonl` gagne `projet` (source : chemin du result.md lu par `bin/sonnerie.py`) ; ancien événement sans `projet` → toléré comment
- [ ] § chef au toit : texte exact de la nouvelle `CONSIGNE_CHEF` (`bin/terminal.py:22-50`, remplace « projet courant ») ; `agentx --projet` = étage par défaut (inchangé sinon)
- [ ] § front : HTML de la coupe verbatim (insertion `dash/index.html:14-15`, avant `#projet-actif`), fonctions JS à créer (signatures), interactions (clic étage, clavier ↑/↓ ?, palette ⌘K « aller à l'étage »), état visuel d'un étage (compteurs, agents, alerte), rendu à 390 px ; les fonctions existantes réutilisées (construireSalle, rendreTaches) inchangées de signature
- [ ] § performance : budget ms par poll, stratégie (résumé léger par étage sans actions/flux, cache par mtime ?) et la mesure à coller par l'implémenteur
- [ ] § lots : L1 serveur, L2 front, L3 chef/sonnerie/agentx — chacun : WL ≤ 12 fichiers, fichiers E disjoints entre lots parallèles, DoD vérifiables (commande → attendu), dépendances
- [ ] `decisions.md` du projet : 1 entrée append (Décision · Écarté · Conséquence · À revoir si)
- [ ] `contrat.md` ≤ 400 lignes ; 0 « TODO », 0 section vide
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/contrat.md` | E | livrable (neuf) |
| `vault/projets/agentx-immeuble/decisions.md` | E | append seulement |
| `vault/projets/agentx-immeuble/brief.md` | L | cible, DoD projet, contraintes |
| `vault/projets/agentx-immeuble/taches/T001-carte-des-hypotheses-mono-projet-salle-et-chef/result.md` | L | carte du terrain complète |
| `bin/dash.py` | L | `construire_etat :301-430`, routes `:900-990`, `_todo`, `_flux` |
| `dash/dash.js` | L | `rendre :958-1020`, `charger`, `construireSalle :404`, `rendreTaches :589`, palette |
| `dash/index.html` | L | ossature `:1-60` |
| `bin/terminal.py` | L | `CONSIGNE_CHEF :22-50` |
| `bin/sonnerie.py` | L | événement `:49-57` |
| `vault/projets/agentx-entreprise/contrat.md` | L | format de référence (§C7-C9 L315-468) — style, pas contenu |

## Contrats
Carte T001 (« Pour la suite », verbatim) :
```
Mono-projet = 1 seul point : dash.py:311-320 (choix proj) ; tout en aval reçoit proj ; construire_etat n'a ∅ paramètre
construire_etat ≈ 0.07 s ; N=8 étages ≈ 0.56 s/poll de 2 s si tout recalculé → découper par projet (blocs :321-392 + _todo + _flux) vs global (:396-400 supervision/personnel, :405-406, :422)
state.json : par-projet = projet, taches, pipeline, serie, seuils, flux, journal, ticker ; mixte = roles, todo ; global = personnel, supervision, evenements, statuts, registre_erreur, horodate, heure, pilotable, demo
GET /state.json n'accepte ∅ query (dash.py:953 startswith) ; ?projet= = parse_qs(urlsplit(self.path).query) (déjà importé :29, motif :919)
POST /api/run prend déjà projet par requête (validé _projet_connu:109)
run/projet : lu à chaque état (:316-320), écrit uniquement par agentx --projet (agentx:163-174)
JS : s.projet/taches/pipeline/flux/serie/seuils/journal lus via ETAT global (dash.js:958-1020, 1118, 1163) ; construireSalle:404 et rendreTaches:589 = étage zoomé ; rendreDeck/RH/supervision/sonnerie = global
HTML : coupe à insérer index.html:14-15 (avant #projet-actif)
sonnerie.py:49-57 : événement ∅ champ projet (id,t,quoi,role,tid,statut,verdict) ; TID non unique entre projets
terminal.py:22-50 CONSIGNE_CHEF dit « projet courant » ×3 (+PROGRAMME:49)
rh.personnel(projet=None) déjà global/par-projet (rh.py:23) ; supervision.etat() global, suggestions(sup, slug) lié au projet affiché
Vault : 8 non clos (tous cadrage), 1 clos, 1 archive (vault/archive/)
```

## Décisions actées
- entretien humain 2026-10-15 : vue coupe + étage zoomé au clic · un seul chef, au toit · pool d'entreprise (11 rôles communs, RH global) · étages = projets ouverts triés par activité, sous-sol = clos/archivés repliés
- hors périmètre humain : chef par étage, sessions terminal multiples, équipe par étage, immeuble 3D
- le front affiche, le serveur calcule (règle héritée agentx-entreprise C0 B)
- 0 donnée inventée ; pas de push, pas de migration
- lots L1 (serveur) ∥ L3 (chef) ; L2 (front) après L1

## Hors périmètre
- écrire du code de production
- toucher `roles.json`, `bin/vx.py` (sauf si indispensable : le dire en § lots, justifié)

## Environnement
- `bin/dash.py` relu au démarrage serveur ; `dash.js`/`dash.css`/`index.html` servis à chaque requête
- page relit `state.json` toutes les 2 s ; salle :7777 ; un seul socket chef `~/.local/state/agentx-chef.sock`
- skill `langage-dense` : contrat en langage dense, contrats verbatim recopiables dans des packs ≤ 220 lignes

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit, `Bash(python3:*)` (lecture/mesure seulement)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- contrat.md:L1-L2 — § (≤ 8 mots)
## Vérifié comment
commande → sortie brute (mesures, wc -l, rg TODO)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : lots, WL, ordre de dispatch, plages contrat.md par lot
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
