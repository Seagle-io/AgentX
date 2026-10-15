---
pack: T002
projet: seagle-pilotage
role: architecte
cree: 2026-10-15
---

# Pack T002 — Contrat : registre des produits, étage = produit, porte de publication

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `vault/projets/seagle-pilotage/contrat.md` : le contrat exécutable qui fait passer AgentX de « étage = projet » à « étage = produit Seagle » (registre `produits.json` extensible, étage Seagle entreprise permanent, projets rattachés à un produit) et qui définit la porte de publication `agentx publier <produit>` (GO / NO-GO, tâches d'écart, captures refaites sur une branche du site) — découpé en lots parallélisables à fichiers disjoints.

## Definition of Done
- [ ] § C0 options : ≥ 2 pour le rattachement projet → produit (ex. `produit:` dans brief.md · champ dans `produits.json` · dossier `vault/produits/<p>/projets/`) et ≥ 2 pour l'étage (agrège les projets du produit · étage = 1 projet permanent par produit) ; tableau coût now / 1 an / rend impossible ; choix motivé ; migration des 11 projets existants (table projet → produit, cf. Contrats)
- [ ] § registre `produits.json` (racine, propriétaire Python unique, validation comme `bin/roles.py`) : schéma verbatim — `cle`, `nom`, `sous`, `couleur`, `entreprise: bool` (1 seul), `depots[] {chemin, branche_publication}`, `site {depot, pages[], textes[], captures[], branche}` (site Seagle ou site produit), `marketing {vault, motifs[]}`, `etat: actif|archive` ; entrées Geolens, Kora, Seagle remplies depuis la carte T001 ; erreurs de registre → affichage comme `registre_erreur`
- [ ] § état serveur : forme de `state.immeuble` avec étages = produits (verbatim, compatible avec la tour existante : `etages[]` garde `slug, titre, rang, num, dormant, compteurs, agents, alerte, selection` ; + `produit`, `projets[]`) ; sélection `#/<produit>` ; projet actif d'un étage ; ce qui change dans `bin/dash.py` (`_bloc_projet` → `_bloc_produit` qui agrège), budget perf (8+ étages, poll 2 s, cache par signature existant)
- [ ] § porte `agentx publier <produit> [--json]` : séquence exacte des contrôles, chacun avec sa source et sa commande (git en LECTURE : commits de `branche_publication` depuis la dernière modif des `pages/textes/captures` du site ; dates des captures vs dates des fichiers d'UI du produit ; textes de fonctionnalités vs fonctionnalités livrées — heuristique explicite, sinon « à vérifier par un agent » ; calendrier marketing : lignes du produit au statut ouvert) ; sortie GO / NO-GO + liste d'écarts ; option `--taches` qui crée 1 tâche par écart à l'étage du produit (rôle, titre, pack pré-rempli) ; 0 écriture git, 0 réseau
- [ ] § captures : contrat d'un script de capture par produit (où il vit, entrée = `produits.json`, produit lancé en local selon `env.md`, sortie = mêmes noms de fichiers que l'existant `public/kora/{dark|light}-<écran>-{1280|2400}.webp`, avant/après dans `.cache/`), branche du site créée par l'humain ou l'agent (préciser ; jamais de push)
- [ ] § étage Seagle (entreprise) : ce qu'il agrège (projet seagle-site, marketing, finance, juridique, RSSI, syndicat ?), comment les rôles métier y travaillent (juriste, tresorier, marketing, rssi, produit) ; sources : `W/Seagle-Marketing/`, chemins finance (jamais de chiffre recopié)
- [ ] § interaction avec le travail en cours : projet `agentx-voix` (7 tâches prêtes, autre initiative, touche `bin/dash.py`, `dash/*`) — ordre des lots pour éviter les collisions
- [ ] § lots : chacun rôle, WL ≤ 12 fichiers, fichiers E disjoints entre lots parallèles, DoD vérifiables (commande → attendu), dépendances ; vérificateur navigateur et évaluateurs prévus
- [ ] `decisions.md` du projet : 1 entrée append (Décision · Écarté · Conséquence · À revoir si) ; `contrat.md` ≤ 400 lignes ; 0 section vide ; marqueur de lint jamais écrit en clair
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/contrat.md` | E | livrable (neuf) |
| `vault/projets/seagle-pilotage/decisions.md` | E | append seulement |
| `vault/projets/seagle-pilotage/brief.md` | L | cible, DoD, contraintes |
| `vault/projets/seagle-pilotage/taches/T001-carte-depots-geolens-et-kora-sites-captures-mark/carte.md` | L | carte du terrain complète |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1 forme `immeuble`, §C3 sélection, §C7 cache — à faire évoluer |
| `bin/roles.py` | L | modèle de registre à imiter |
| `bin/dash.py` | L | `construire_etat`, `_bloc_projet`, `_signature`, `_etage` |
| `bin/vx.py` | L | parser, `cmd_*`, `lister_projets` |
| `dash/dash.js` | L | `rendreImmeuble`, `construireTour`, `directionTour` (signatures) |
| `roles.json` | L | format de registre de référence |

## Contrats
Rattachement constaté (brief `depot:` + carte) :
```
agentx-entreprise, agentx-immeuble, agentx-voix → AgentX (produit Seagle listé sur le site)
geolens-viewer, geolens-preview-3d, geolens-charge-3d → Geolens
orthopro, dashboard-grille, dashboard-direct (clos) → Kora (= OrthoPro, preuve T001)
seagle-site, seagle-pilotage → Seagle (entreprise)
produits du site Seagle (Navbar/Booking) : kora, securepass, agentx, aisio (Global SEO), leef, netforge ; Geolens absent du site Seagle
```
Tour actuelle : `immeuble = {selection, epingle, toit{chef,todo,urgent,etages,dormants,alerte}, etages[], sous_sol[], mesure_ms}` ; chef au dernier étage (`directionTour`) ; hash `#/<slug>` ; cache `_CACHE` par signature mtime ; ≈ 0.07 s par projet.

## Décisions actées
- entretien humain 2026-10-15 : feu vert AVANT push · étage Seagle permanent qui absorbe seagle-site · captures refaites par les agents sur une branche du site, l'humain valide et pousse · « un étage = un produit, à terme tous les produits de l'entreprise »
- jamais de push / migration par un agent ; BDD serveur de test Geolens intouchable
- le front affiche, le serveur calcule ; 0 donnée inventée

## Hors périmètre
- écrire du code de production ; modifier les produits ou les sites
- trancher la branche de publication à la place de l'humain si les preuves divergent : hypothèse du brief + « À revoir si »

## Environnement
- skill `langage-dense` : contrat dense, contrats verbatim recopiables dans des packs ≤ 220 lignes
- `W` = `~/Documents/Workspace` ; 9 projets ouverts aujourd'hui + agentx-voix (autre initiative, ne pas dispatcher)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit, `Bash(python3:*)` (lecture/mesure), `Bash(git -C:*)` (lecture)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T002
projet: seagle-pilotage
statut: fait | bloque
---
## Livré
- contrat.md:L1-L2 — § (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : lots, WL, ordre de dispatch, plages contrat.md par lot
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
