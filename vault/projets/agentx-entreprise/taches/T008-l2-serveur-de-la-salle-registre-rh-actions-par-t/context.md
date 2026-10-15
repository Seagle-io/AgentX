---
pack: T008
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T008 — L2 : serveur de la salle — registre, RH, actions par tâche, todo

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Adapter `bin/dash.py` au lot L2 du contrat : `state.json` (registre, `rejete`, champs éval, `taches[].actions`, `personnel`), `/api/run` (virer, retenir, personnel, integrer), `_todo` (7 règles) — à la lettre de `contrat.md` §C7-C8.

## Definition of Done
- [ ] `ROLES_META` supprimé : `rg -n "ROLES_META" bin/dash.py` → ∅ ; boucle rôles sur `roles.charger().values()`
- [ ] `ORDRE_PIPELINE` = §C3 (7 statuts, `rejete` en dernier)
- [ ] `construire_argv` : 4 actions §C8 + `set` refuse `rejete` ; vérif par `python3 -c` important dash et appelant `construire_argv` : virer OK → argv exact §C8 ; motif vide / > 200 / contenant `\n` → ValueError ; `set` statut rejete → ValueError ; `retenir` avec clé `sans_eval` → argv sans `--sans-eval`
- [ ] `_actions_tache(l, slug)` : table §C8 complète, ordre exact ; `python3 -c` sur 1 dict par statut (8 statuts) → liste des `k` collée
- [ ] `_todo` : 7 règles §C8 ; « Faire vérifier » sur `roles.juges()` ; `rejete` exclu comme `fait`
- [ ] `state.json` : clés §C7 (`registre_erreur`, `statuts`, `pipeline`, `roles[]` enrichis, `taches[]` champs neufs + `actions`, `personnel`) ; `_objet` §C7
- [ ] `python3 -c "import ast;ast.parse(open('bin/dash.py').read())"` → rc 0
- [ ] runtime (si `bin/roles.py` et `bin/rh.py` existent à ta fin — lot L1 en parallèle) : `python3 bin/dash.py --json | python3 -c "import json,sys;d=json.load(sys.stdin);print(sorted(d), len(d['roles']), d['taches'][0]['actions'][:1], d['personnel'].get('taches'))"` → sortie collée ; sinon `NV — L1 absent` + import protégé non requis (contrat : roles.py existera)
- [ ] `git diff --stat -- bin/dash.py` collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | E | `:34` import vx · `:65-75` ROLES_META/ORDRE · `:103` construire_argv · `:133` executer · `:258` construire_etat · `:300` rôles · `:356-376` _objet · `:380` _flux · `:422` _todo · `:604` etat_demo · `:832` do_POST |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C2 L68-100 · §C3 L101-137 · §C5 personnel L228-259 · §C6 L278-313 · §C7 L315-351 · §C8 L352-396 : contrat verbatim** |
| `bin/roles.py` | L | si présent (L1 l'écrit en parallèle) ; sinon signatures §C2 |
| `bin/rh.py` | L | si présent ; sinon `personnel(projet=None)->dict` §C5 |

## Contrats
`contrat.md` sections ci-dessus = contrat recopié : les lire en entier, appliquer à la lettre. Rappels :
```python
import roles            # bin/ déjà dans sys.path (dash.py importe vx de la même façon, :34)
roles.charger() -> dict[str, Role]   # ordre fichier ; lève RegistreInvalide
roles.erreur() -> str ; roles.affectables() ; roles.juges() ; roles.role(cle) -> Role|None
roles.livre_en(cle) -> "revue"|"fait" ; roles.dep_satisfaite(statut_dep, role_tache) -> bool ; roles.MODELES
import rh ; rh.personnel(projet=None) -> dict      # exception → state.json.personnel = {}
Role(cle, nom, sous, livrable, couleur, modele, affectable, livre_en, juge, objet)
```
`/api/run` réponse inchangée : `{commande, code, out, err}`. Entrée d'action : `{"k","libelle","exe":dict|None,"cmd":str,"saisie":""|"motif"}`.
Verdict évaluateur : frontmatter `verdict: retenir|virer` du result.md ; `eval_motif` = 1re ligne non vide de `## Motif`, `∅` → `""`.

## Décisions actées
- le serveur calcule toutes les permissions (`actions`) ; le front n'en recalcule aucune — contrat C0 B
- `retenir --sans-eval` jamais exposé à la page — le chef assume en CLI
- écrire un pack et dispatcher restent hors page : `cmd` à copier, `exe: null`
- registre invalide → `registre_erreur` rempli, `roles: []`, la page vit quand même

## Hors périmètre
- `bin/vx.py`, `bin/roles.py`, `bin/rh.py`, gardes (lot L1, autre agent en parallèle)
- `dash/*` (lots L3/L4)
- `bin/supervision.py`, `bin/terminal.py`
- Lancer/arrêter la salle (`./bin/agentx`, `agentx stop`) — démon partagé avec l'humain

## Environnement
- Python 3 stdlib ; `python3 bin/dash.py --json` imprime l'état sans serveur
- `dash.py` est chargé au démarrage du serveur : ta modif n'est visible en salle qu'après relance (faite par le chef)
- le vrai vault est lu (jamais écrit) par `--json` : OK
- arbre partagé : L1 écrit `bin/vx.py` et crée `bin/roles.py` en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(git diff:*)`, `Bash(rg:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T008
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : forme réelle d'une entrée `taches[]` et `roles[]` (1 exemple JSON)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
