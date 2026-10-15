---
pack: T007
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T007 — L1 : registre des rôles, virer/retenir/personnel, gardes

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Implémenter le lot L1 du contrat : `roles.json`, `bin/roles.py`, `bin/rh.py` neufs ; `bin/vx.py` (statut `rejete`, `virer`, `retenir`, `personnel`, `integrer` évaluateur, `doctor`, deps via `dep_satisfaite`) ; `bin/garde_dispatch.py` et `bin/sonnerie.py` sur le registre — à la lettre de `contrat.md` §C1-C6.

## Definition of Done
Toutes les preuves sur un **banc jetable** `B=.cache/banc-T007` (jamais le vrai vault) :
`rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`
- [ ] `roles.json` = contenu §C1 verbatim ; `python3 -c "import sys;sys.path.insert(0,'bin');import roles;print(len(roles.charger()),roles.affectables())"` → `13` + 11 clés
- [ ] registre cassé (banc : couleur `#FFF`) → `vx tache` rc 3 + message `roles.json invalide : …` ; `vx board` rc 0
- [ ] `vx tache … --role evaluateur` OK ; `--role inconnu` rc 2 ; sans `--modele` → `modele:` = modèle du registre
- [ ] `set --statut rejete` refusé ; `set --statut fait` d'une tâche implementeur refusé (message §C3) ; `set` d'une tâche rejetee refusé
- [ ] `virer` sur banc (projet `demo`, T001 implementeur en revue, T002 dépendant de T001) → stdout = format §C5 exact ; T003 créée (`remplace: T001`, context.md copié + ligne marqueur) ; `pack-lint T003` → KO marqueurs ; T001 `statut: rejete`, `motif`, `remplacee_par: T003` ; T002 deps → `[T003]` ; 3 types de lignes journal
- [ ] `retenir` : sans éval → message §C5 ; avec tâche evaluateur `fait` + result.md `verdict: retenir` → `revue -> fait (retenue, eval T0xx)` ; `verdict: virer` → refus avec commande virer ; `--sans-eval` → `evaluation: chef`
- [ ] `ready` : tâche evaluateur dont la dep est en `revue` → listée (rôle juge) ; tâche implementeur dont la dep est en `revue` → non listée
- [ ] `personnel` et `personnel --json` sur banc → format §C5 exact ; banc vide → `aucune tache — rien a mesurer.`
- [ ] `integrer` d'une tâche evaluateur → en-tête + sections + ligne `->` §C6
- [ ] `doctor` sur banc avec tâche rejetee sans `remplacee_par` (édition manuelle du banc) → ligne §C5 + rc 2 ; vrai vault : `python3 bin/vx.py doctor` → même rc qu'avant (relevé AVANT modif, collé)
- [ ] garde : `echo '{"tool_name":"Agent","tool_input":{"subagent_type":"evaluateur","prompt":"rien"}}' | python3 $B/bin/garde_dispatch.py` → deny ; tâche `pret` lintée de rôle implementeur dispatchée en `subagent_type: testeur` → deny message §C5 Gardes ; `subagent_type: Explore` → laisse passer (sortie vide rc 0)
- [ ] sonnerie : événement contient `"verdict"` (stdin simulé `{"agent_type":"evaluateur","last_assistant_message":"---\ntache: T004\nstatut: fait\nverdict: virer\n---"}` avec `run/` du banc)
- [ ] vrai vault : `python3 bin/vx.py board >/dev/null; echo $?` → 0 ; `python3 bin/vx.py ready` rc 0
- [ ] `git diff --stat -- bin/vx.py bin/garde_dispatch.py bin/sonnerie.py` + `git status --short roles.json bin/roles.py bin/rh.py` collés ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `roles.json` | E | neuf, §C1 |
| `bin/roles.py` | E | neuf, §C2 |
| `bin/rh.py` | E | neuf, §C5 personnel |
| `bin/vx.py` | E | §C3 C4 C5 C6 ; `:31-33` constantes · `:221` tache · `:267` set · `:291` board · `:327` integrer · `:367` ready · `:508` doctor · `:555` main |
| `bin/garde_dispatch.py` | E | `:20` ROLES · `:35-58` règle |
| `bin/sonnerie.py` | E | `:27` ROLES · `:30-57` événement |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C1-C6 = L23-L313 : contrat verbatim, ta référence** |

## Contrats
`contrat.md:23-313` (C1 à C6) est le contrat recopié : le lire en entier, l'appliquer à la lettre. Rappels critiques :
```
MARQUEUR = "TODO" + "-PACK"          # écrit concaténé dans le code, jamais en clair (sinon lint du pack T007 KO)
STATUTS = ("a-faire","pret","en-cours","bloque","revue","fait","abandonne","rejete")
codes retour : 0 OK · 1 die métier · 2 argparse · 3 registre invalide
roles.py n'importe pas vx ; rh.py importe VAULT, lister_projets, lister_taches de vx ; vx importe rh en local dans cmd_personnel
dep satisfaite = roles.dep_satisfaite(statut_dep, role_tache)  # board « ! », ready
```
Existant (vx.py) : `die(msg, code=1)` :62 · `slugify` :67 · `deaccent` :73 · `lire_frontmatter(chemin)->(meta, corps)` :80 · `ecrire_frontmatter(chemin, meta, corps)` :132 · `journaliser(proj, msg)` :177 · `_trouver_tache(slug, tid)->(proj, dossier, meta)` :257 · `_section(texte, titre)` :322 · `cmd_index(args)` :460. `CLES_LISTE = ("deps","tags")` :77.
Hook PreToolUse refus = `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":…}}` (forme existante garde_dispatch.py:25, à garder).

## Décisions actées
- registre unique, front et serveur ne dupliquent rien — contrat T002 option B
- `rejete` terminal ; seul `virer` y mène — règle 4 mécanisée
- remplaçante bloquée par lint tant que le chef n'a pas corrigé — même pack interdit
- `retenir` exige une évaluation `fait` ; `--sans-eval` = le chef assume, tracé `evaluation: chef`
- tâches anciennes sans champs neufs restent valides — vault existant intact

## Hors périmètre
- `bin/dash.py` (lot L2, autre agent en parallèle) — n'y touche pas même s'il casse à l'import
- `dash/*`, `.claude/agents/*`, `SKILL.md`, `CLAUDE.md`
- Muter le vrai vault : aucun `virer`/`retenir`/`tache`/`set` hors banc
- Nouvelle dépendance pip

## Environnement
- Python 3 stdlib seul ; `ROOT = Path(__file__).resolve().parent.parent` (vx.py:27) → le banc copié est autonome
- banc sous `.cache/` (gitignoré) ; `rm -rf .cache/banc-T007` autorisé, rien d'autre
- `garde_bash` refuse les commandes Bash dont le texte cite les commandes interdites (push, migrations…) : pour écrire un fichier qui en parle, outil Write
- arbre partagé : un autre agent édite `bin/dash.py` et `dash/*` en même temps

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(python3:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T007)`, `Bash(echo:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(cat:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T007
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (1 bloc par case DoD)
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
