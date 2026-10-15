---
pack: T004
projet: agentx-immeuble
role: implementeur
cree: 2026-10-15
---

# Pack T004 — L3 : chef au toit et sonnerie avec projet

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer la consigne du chef par celle du chef unique de l'immeuble (`bin/terminal.py`) et faire porter `projet` à chaque événement de `bin/sonnerie.py` — à la lettre de `contrat.md` §C5 et §C6.

## Definition of Done
- [ ] `bin/terminal.py` : `CONSIGNE_CHEF` et `PROGRAMME` = texte §C6 verbatim (`contrat.md:156-193`) ; commentaire `:22-23` conservé ; `git diff -U0 bin/terminal.py` → hunks dans `:20-52` seulement
- [ ] `rg -c 'projet courant' bin/terminal.py` → aucune sortie, code 1
- [ ] `bin/sonnerie.py` : `RE_PROJET`, `RE_CHEMIN`, `RE_ROLE_T`, `RE_STAT_T`, `projet_de(tete, tid, role) -> str` §C5 (4 règles dans l'ordre, ne lève jamais) ; `main()` : `ev["projet"]` ; ordre des clés = exemple §C5
- [ ] les 3 commandes « DoD L3 » `contrat.md:343-348` exécutées, sortie collée
- [ ] règle 3 prouvée : `projet_de('rien', 'T002', 'architecte')` → `agentx-immeuble` ou `""` si ambigu — sortie collée avec le décompte des candidats (le vrai vault a des T002 dans plusieurs projets)
- [ ] `main()` sur `EVENEMENTS` redirigé vers `.cache/T004/evenements.jsonl` (monkeypatch dans `python3 -c`, stdin = JSON hook SubagentStop simulé) → 1 ligne JSON, 8 clés, `projet` présent ; `run/evenements.jsonl` réel : taille inchangée (avant/après collés)
- [ ] `python3 -m py_compile bin/terminal.py bin/sonnerie.py` rc 0
- [ ] `git diff --stat -- bin/` → `bin/terminal.py`, `bin/sonnerie.py` seuls
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/terminal.py` | E | `CONSIGNE_CHEF :24-48`, `PROGRAMME :49` |
| `bin/sonnerie.py` | E | événement `:49-57`, main |
| `vault/projets/agentx-immeuble/contrat.md` | L | **§C5 L130-155 · §C6 L156-193 · DoD L3 L343-348 : contrat verbatim** |
| `bin/agentx` | L | `--projet :160-175` (∅ changement) |
| `.cache/T004/` | E | essais jetables |

## Contrats
`contrat.md` §C5 et §C6 = contrat, à appliquer à la lettre. Rappel §C5 :
```python
def projet_de(tete: str, tid: str, role: str) -> str:
    """Slug du projet de l'agent qui rend ; "" si non déterminable. Ne lève jamais."""
    # 1. frontmatter `projet:` dans tete, et ROOT/vault/projets/<slug> est un dossier → slug
    # 2. 1er RE_CHEMIN dans tete dont le dossier existe → slug
    # 3. tid non vide : candidats = ROOT/vault/projets/*/taches/{tid} et {tid}-*/task.md
    #    garder RE_ROLE_T == role ; si > 1, garder RE_STAT_T == "en-cours" ; exactement 1 → son slug
    # 4. sinon ""
```
```json
{"id":"9f2c…","t":"14:03:12","quoi":"agent-fini","role":"architecte","tid":"T002","statut":"fait","verdict":"","projet":"agentx-immeuble"}
```
Le hook SubagentStop lit `last_assistant_message` (pas un chemin de result.md) : `tete` = ce texte.

## Décisions actées
- un seul chef, au toit ; session vivante garde l'ancienne consigne jusqu'à ■ arrêter / ▶ lancer (humain)
- toute exception dans `projet_de` → `""` : un agent n'est jamais arrêté par la sonnerie
- `id` reste la seule clé de dédoublonnage
- L1 (`bin/dash.py`) en parallèle : ne pas y toucher

## Hors périmètre
- `bin/dash.py` (L1), `dash/*` (L2), `bin/agentx`, `bin/vx.py`
- ■ arrêter / ▶ lancer la session chef ; écrire dans `run/evenements.jsonl` réel

## Environnement
- `garde_bash` scanne tout le texte Bash : la consigne cite des commandes → écrire avec Edit/Write, jamais heredoc
- socket chef `~/.local/state/agentx-chef.sock` = vraie session : ne pas s'y connecter
- stdlib seulement

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`, `Bash(wc:*)`, `Bash(stat:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T004
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
