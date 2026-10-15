---
pack: T003
projet: agentx-immeuble
role: implementeur
cree: 2026-10-15
---

# Pack T003 — L1 serveur : état immeuble, étage par ?projet=, todo agrégée

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire produire à `bin/dash.py` un `state.json` d'immeuble — clé `immeuble` (étages résumés en cache par signature mtime, sous-sol, toit), étage détaillé choisi par `?projet=` / `--projet`, `todo` agrégée étiquetée par projet — à la lettre de `contrat.md` §C1-C5 (lecture) et §C7.

## Definition of Done
- [ ] fonctions §C7 présentes avec ces signatures : `_signature`, `_bloc_projet`, `_todo`, `_todo_rh`, `_etage`, `_sous_sol`, `_choisir`, `construire_etat(projet=None)` ; `_CACHE` + `_CACHE_VERROU` ; invariant « bloc jamais muté » respecté
- [ ] GET `/state.json?projet=<slug>` (parse_qs) → `construire_etat(slug)` ; slug inconnu → 200 + `immeuble.selection.refus` (§C3) ; sans paramètre → épingle puis activité (§C3)
- [ ] `main()` : `--projet` ; `_evenements()` : `ev.setdefault("projet", "")`
- [ ] les 6 commandes « DoD L1 » de `contrat.md:325-342` exécutées, sortie collée ; valeurs attendues = forme (les comptes 8/2 sont ceux de T001 : coller les comptes réels et les expliquer s'ils diffèrent)
- [ ] mesure « Performance » `contrat.md:242-251` collée : froid ≤ 600 ms · chaud médiane ≤ 120 ms ; chaud > 300 ms ⇒ `bloque` avec mesures
- [ ] cache prouvé : 2e appel chaud ne relit aucun `context.md`/`result.md` (compteur ou monkeypatch de `Path.read_text` dans un `python3 -c`, sortie collée) ; `touch` d'un `task.md` d'un étage → seul ce bloc recalculé
- [ ] salle-banc `python3 bin/dash.py --port 7798 --no-open &` : `curl -s '127.0.0.1:7798/state.json?projet=agentx-entreprise'` → `projet.slug` = agentx-entreprise ; `?projet=..%2Fx` → refus ; tuer par pid, `curl` → 000
- [ ] POST `/api/run` inchangé (déjà `projet` par requête) : `git diff bin/dash.py` ne touche pas `construire_argv`/`executer`
- [ ] `python3 -m py_compile bin/dash.py` rc 0 ; `./bin/agentx doctor` rc 0
- [ ] `git diff --stat -- bin/` → `bin/dash.py` seul
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | E | construire_etat `:301-430`, _todo, _evenements, do_GET `~:953`, main |
| `vault/projets/agentx-immeuble/contrat.md` | L | **§C1-C5 L23-155 · §C7 L194-251 · DoD L1 L325-342 : contrat verbatim** |
| `bin/vx.py` | L | `lister_projets :166`, `lister_taches`, `lire_frontmatter` (signatures, ne pas modifier) |
| `bin/supervision.py` | L | `:291-348` suggestions(sup, slug) |

## Contrats
`contrat.md` §C1-C5, §C7 = contrat, à appliquer à la lettre. Résumé de la séquence (verbatim §C7) :
```
projets = lister_projets() ; ∅ → etat_demo() annoté (immeuble None)
statut(p) = lire_frontmatter(p/"brief.md")["statut"] pour chaque p     # 1 lecture/projet
ouverts, fermes = partition(ouvert)
blocs = {p.name: _bloc_projet(p) for p in ouverts}
ordre provisoire (C2, sel inconnu) → sel, source, refus = _choisir(...)
sel ∉ blocs (clos) → blocs[sel.name] = _bloc_projet(sel)
ordre définitif (C2 avec sel : sel jamais dormant)
détail de sel = construire_etat:367-392 + :402-421 actuels, alimentés par blocs[sel.name]
sup = supervision.etat() ; personnel = _personnel()
todo = C4 ; immeuble = C1 ; mesure_ms en dernier
retour = dict actuel :403-423 + "todo_total" + "immeuble"
```
État actuel (après T018, retenu) : `construire_etat()` sans paramètre ; choix du projet `:311-320` = non clos au `journal.md` le plus récent, épingle `run/projet` prioritaire ; `executer` sous `_EXECUTION` Lock `:177-183` ; `_citer_motif` importé de vx `:38`.

## Décisions actées
- option B du contrat : 1 state.json + `immeuble` + étage détaillé ; pas de 2e route
- `bin/vx.py`, `roles.json`, `supervision.py` : ∅ modification
- le front affiche, le serveur calcule ; 0 donnée inventée
- L3 (terminal.py, sonnerie.py) en parallèle : ne pas y toucher

## Hors périmètre
- `dash/*` (L2, après toi) ; `bin/terminal.py`, `bin/sonnerie.py`, `bin/agentx` (L3)
- `/api/term/*`, liste blanche `construire_argv`

## Environnement
- `bin/dash.py` relu au démarrage serveur : la salle réelle :7777 garde l'ancien code — NE PAS l'arrêter ni la relancer (le chef le fera après éval)
- vrai vault en lecture seule (aucune action mutante) ; salle-banc :7798 lit le vrai vault en GET seulement ; NE PAS POST `/api/term/*` ni `/api/run`
- 9 projets dans `vault/projets/` (8 non clos dont agentx-immeuble, 1 clos) + `vault/archive/2026-10-05-recherche-floue`
- stdlib seulement ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(touch:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T003
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (DoD L1, perf, cache, banc)
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : forme réelle de `immeuble` (1 exemple d'étage JSON) pour L2
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
