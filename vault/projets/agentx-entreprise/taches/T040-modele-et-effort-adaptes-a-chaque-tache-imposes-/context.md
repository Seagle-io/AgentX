---
pack: T040
projet: agentx-entreprise
role: implementeur
cree: 2026-10-16
---

# Pack T040 — Modèle et effort adaptés à chaque tâche, imposés au dispatch

> Seule source de vérité de l'agent T040. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Chaque tâche porte un modèle ET un niveau d'effort adaptés à son besoin (défauts par rôle dans `roles.json`, surcharge par tâche), et la garde de dispatch impose que l'appel `Agent` les respecte — pour cesser de faire tourner 86 % des agents sur opus par héritage (étude syndicat T039).

## Definition of Done
- [ ] `roles.json` : champ `effort` (`low|medium|high`) par rôle affectable + `modele` revu selon le tableau Contrats ; `bin/roles.py` valide `effort` (absent → `medium` pour compat, valeur inconnue → erreur de registre) — `roles.erreur()` → `''` (collé)
- [ ] `vx tache … [--modele M] [--effort E]` : écrit `modele:` et `effort:` dans `task.md` ; absents → défauts du rôle (jamais `inherit` écrit pour une tâche neuve) ; `board` affiche modèle/effort ; `virer` : la remplaçante reprend modèle/effort de la tâche virée sauf surcharge
- [ ] `bin/garde_dispatch.py` : appel `Agent` d'une tâche AgentX → refus si `tool_input.model` ≠ `modele` de la tâche (alias : `opus`, `sonnet`, `haiku` ; `inherit` en tâche = pas de contrainte) ou si `tool_input.effort` ≠ `effort` de la tâche ; message de refus = l'appel exact attendu (`model=…, effort=…`) ; tâches existantes sans `effort:` → pas de contrainte d'effort (compat)
- [ ] banc `.cache/T040/` : `tache` sans option → défauts du rôle ; `--modele opus --effort high` → écrit ; hook : bon appel → accepté (et passe en-cours, comportement T036 conservé) ; mauvais modèle → refus ; mauvais effort → refus ; tâche ancienne sans effort → accepté ; sorties collées
- [ ] `python3 -m py_compile bin/vx.py bin/roles.py bin/garde_dispatch.py` rc 0 ; `./bin/agentx doctor` rc 0 ; `python3 -m unittest discover -s tests` → OK (tests existants)
- [ ] `git diff --stat` des fichiers E collé ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `roles.json` | E | `modele`, `effort` par rôle |
| `bin/roles.py` | E | validation `effort` |
| `bin/vx.py` | E | `cmd_tache`, parser, `board`, `cmd_virer` |
| `bin/garde_dispatch.py` | E | contrôle modèle/effort avant d'accepter |
| `vault/syndicat/2026-10-16-tokens.md` | L | constats (R10, opus 86 %) |
| `.cache/T040/` | E | banc |

## Contrats
Défauts par rôle (décision du chef, à écrire tels quels) :
```
eclaireur sonnet/low · architecte opus/high · designer sonnet/medium · implementeur sonnet/medium · testeur sonnet/medium
devops sonnet/medium · verificateur opus/high · relecteur sonnet/low · securite opus/high · evaluateur opus/medium
scribe sonnet/low · juriste opus/high · tresorier opus/medium · produit sonnet/medium · marketing sonnet/medium
rssi opus/high · syndicat sonnet/medium · critique : garder son modèle, effort medium
```
Le chef surcharge par tâche quand le besoin l'exige (`--modele opus --effort high` pour une fusion, une concurrence, un format délicat).
Hook PreToolUse (stdin) : `{"tool_name":"Agent","tool_input":{"subagent_type","prompt","model"?,"effort"?}}` ; refus = `refuser(raison)` existant ; acceptation = `dispatcher()` (T036) puis exit 0.

## Décisions actées
- demande humaine 2026-10-16 : « niveau d'effort et modèle adaptés au besoin »
- 0 `inherit` pour une tâche neuve : le modèle est toujours explicite
- compat : tâches existantes sans `effort:` dispatchables sans contrainte d'effort

## Hors périmètre
- `bin/dash.py` (seagle T021 en parallèle), `dash/*`, `.claude/agents/*.md` (le modèle du dispatch prime)

## Environnement
- les hooks s'appliquent à TA session : ne casse pas `garde_dispatch.py` réel (Edit d'un bloc, `py_compile` immédiat, banc d'abord)
- banc : `B=.cache/T040/banc; rm -rf $B; mkdir -p $B/vault $B/run $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`
- `garde_bash` refuse push/migrations ; sorties longues : `| tail -n 40`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/T040/banc)`, `Bash(grep:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T040
projet: agentx-entreprise
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
