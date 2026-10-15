---
pack: T001
projet: agentx-immeuble
role: eclaireur
cree: 2026-10-15
---

# Pack T001 — Carte des hypothèses mono-projet de la salle et du chef

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Localiser chaque endroit où la salle (serveur, page, terminal, supervision) suppose UN seul projet, pour que l'architecte tranche le passage à « immeuble : 1 étage par projet ouvert, chef unique au toit, pool d'agents commun ».

## Definition of Done
- [ ] `bin/dash.py` : `construire_etat` découpé en blocs (`chemin:L1-L2` · produit quelle clé de state.json · dépend du projet ? oui/non) ; coût mesuré : `python3 -c` qui chronomètre `construire_etat()` sur le vrai vault, sortie collée
- [ ] liste des clés de `state.json` (`python3 bin/dash.py --json | python3 -c "import json,sys;…keys()"` collé) classées `par-projet` | `global` (roles, personnel, supervision, todo…)
- [ ] `bin/dash.py` : routes HTTP (`do_GET`/`do_POST`), comment un paramètre `?projet=` pourrait passer (parse_qs déjà importé : où), épingle `run/projet` (lecture/écriture)
- [ ] `dash/dash.js` : usages de `s.projet`, `s.taches`, `s.pipeline`, `s.flux`, `s.agents` (ou équivalents) → `chemin:L` ; fonctions qui construisent la salle iso et le poste de pilotage ; ce qui est global (deck, RH, supervision)
- [ ] `dash/index.html` : ossature des panneaux (id · ligne), où insérer une coupe d'immeuble au-dessus de la salle
- [ ] `bin/terminal.py` CONSIGNE_CHEF + `bin/agentx:160-175` : ce qui suppose « le projet courant »
- [ ] `bin/sonnerie.py` / `run/evenements.jsonl` : l'événement porte-t-il le projet ? (champ exact)
- [ ] todo du chef (`todo` dans state.json) : construite pour 1 projet ou tous ? `chemin:L`
- [ ] nombre de projets non clos et clos/archivés dans le vrai vault (statut lu dans brief.md frontmatter), via CLI ou `python3 -c`, sortie collée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | L | serveur, construire_etat, routes |
| `dash/dash.js` | L | rendu salle, pilotage |
| `dash/index.html` | L | ossature panneaux |
| `bin/terminal.py` | L | consigne chef `:20-50` |
| `bin/agentx` | L | épingle `:160-175` |
| `bin/sonnerie.py` | L | événements |
| `bin/supervision.py` | L | global ou par projet ? |
| `bin/rh.py` | L | personnel global |
| `vault/projets/agentx-immeuble/brief.md` | L | cible du projet |

## Contrats
State actuel (connu du chef) :
```
construire_etat() : projets = lister_projets(); proj = projet non clos au journal.md le plus récent; épingle run/projet prioritaire (bin/dash.py:301-320)
taches[].actions = {k, libelle, exe:{action,tid,projet,motif?}|null, cmd, saisie}  (bin/dash.py:515-530)
POST /api/run body {action, projet, tid?, statut?, motif?, role?, modele?}
page relit state.json toutes les 2 s
```

## Décisions actées
- entretien humain 2026-10-15 : coupe + étage zoomé · un seul chef au toit · pool d'entreprise · étages = projets ouverts, sous-sol = clos/archivés
- tu ne proposes pas d'architecture : coordonnées et faits seulement

## Hors périmètre
- toute écriture hors `result.md`
- `vault/` hors brief ci-dessus ; `.claude/*`

## Environnement
- `bin/dash.py`, `bin/vx.py` et `dash/*` viennent d'être corrigés (lots T017/T018 non commités) : lire l'arbre de travail tel quel
- `python3 bin/dash.py --json` : lecture seule, sûr ; ne PAS lancer de serveur ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- fait-ligne : chemin:L — constat (≤ 12 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- coordonnées à recopier telles quelles dans le pack de l'architecte (≤ 25 lignes)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
