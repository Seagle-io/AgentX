---
pack: T042
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-16
---

# Pack T042 — Evaluer T040 (modèle et effort)

> Seule source de vérité de l'agent T042. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable T040 (`roles.json`, `bin/roles.py`, `bin/vx.py`, `bin/garde_dispatch.py` : modèle + effort par tâche, imposés au dispatch) contre la DoD de SON pack → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T040-modele-et-effort-adaptes-a-chaque-tache-imposes-/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi sur banc
- [ ] `roles.json` == tableau Contrats ci-dessous, rôle par rôle (script de comparaison collé, 17 lignes OK/KO)
- [ ] hook sur banc, 6 cas : bon appel → rc 0 + `en-cours` ; mauvais modèle → deny ; mauvais effort → deny ; sans model/effort → deny ; tâche sans `effort:` → accepté ; tâche `modele: inherit` → accepté quel que soit `model` ; message de deny = appel exact attendu
- [ ] 2 défauts NEUFS injectés sur une COPIE de `garde_dispatch.py` (ex. comparaison d'effort supprimée ; `inherit` traité comme contrainte) → ≥ 1 cas ci-dessus change d'issue chacun (sinon trou → `[ ]`)
- [ ] isolation : `md5sum roles.json bin/roles.py bin/vx.py bin/garde_dispatch.py` avant == après ; `vault/` réel non modifié (`git status --porcelain -- vault/projets/agentx-entreprise` avant == après, hors ton `result.md`)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T040-modele-et-effort-adaptes-a-chaque-tache-imposes-/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T040-modele-et-effort-adaptes-a-chaque-tache-imposes-/result.md` | L | affirmations |
| `roles.json` | L | livrable |
| `bin/roles.py` | L | livrable |
| `bin/vx.py` | L | livrable (`cmd_tache`, `cmd_virer`, `board`) |
| `bin/garde_dispatch.py` | L | livrable (copie pour injection) |
| `.cache/eval-T042/` | E | banc, copies, défauts injectés |

## Contrats
Défauts par rôle (référence, décision du chef) :
```
eclaireur sonnet/low · architecte opus/high · designer sonnet/medium · implementeur sonnet/medium · testeur sonnet/medium
devops sonnet/medium · verificateur opus/high · relecteur sonnet/low · securite opus/high · evaluateur opus/medium
scribe sonnet/low · juriste opus/high · tresorier opus/medium · produit sonnet/medium · marketing sonnet/medium
rssi opus/high · syndicat sonnet/medium
```
`critique` absent de `roles.json` (constat T040) : pas un défaut.
Hook PreToolUse (stdin) : `{"tool_name":"Agent","tool_input":{"subagent_type","prompt","model"?,"effort"?}}` ; deny = JSON `permissionDecision: deny` ; accepté = rc 0 sans sortie.
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T042 · projet: agentx-entreprise · statut · evalue: T040 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- compat : tâche existante sans `effort:` = pas de contrainte d'effort (voulu)
- `getattr(args,"effort",None)` à `vx.py:403` pour `publier.py:312` : accepté

## Hors périmètre
- écrire dans `bin/*`, `roles.json`, `vault/` réel ; `bin/dash.py` (affichage effort, hors T040)

## Environnement
- le hook réel s'applique à TA session : ne jamais éditer `bin/garde_dispatch.py` réel ; tester uniquement la copie du banc
- banc : `B=.cache/eval-T042/banc; rm -rf $B; mkdir -p $B/vault $B/run $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; projet démo via `python3 $B/bin/vx.py projet demo …` puis `tache`
- shell = fish : JSON du hook en fichier puis `python3 $B/bin/garde_dispatch.py < cas.json` (pas d'`echo '…'` imbriqué)
- sorties bornées `| tail -n 40` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T042/`), `Bash(python3:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T042/banc)`, `Bash(md5sum:*)`, `Bash(git status:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections de « Contrats ».
