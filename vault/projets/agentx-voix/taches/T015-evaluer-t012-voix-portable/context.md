---
pack: T015
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T015 — Evaluer T012 (voix portable)

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger T012 (voix installable ailleurs que chez Julien : shebang `/usr/bin/env`, re-exécution via le venv, repli CPU de la dictée, guide de Sylvain à jour) contre la DoD de SON pack, sans régression chez Julien → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T012-voix-portable-sans-chemin-personnel-repli-cpu-in/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi, tout essai qui écrit sous `AGENTX_VOIX_DIR=.cache/voix-eval-T015/v` et `PATH=.cache/T002/stub:$PATH`
- [ ] simulation « machine de Sylvain » : `HOME` jetable (`.cache/voix-eval-T015/home`) sans venv → `bin/parle status` et `bin/dictee etat` → message clair, rc 1, 0 traceback ; `AGENTX_PARLE_PY` / `AGENTX_DICTEE_PY` pointant vers les vrais venvs → fonctionne ; 0 chemin `/home/jdrac` dans les 3 scripts et le guide (`grep -rnE "/home/[a-z]+|jdrac"` collé)
- [ ] repli CPU : test unitaire de T012 rejoué + 1 cas de toi (CUDA présent mais `get_cuda_device_count()` lève) → arguments `WhisperModel` corrects, 0 exception non gérée ; JAMAIS charger le vrai modèle, JAMAIS ouvrir le micro
- [ ] chez Julien, 0 régression : `~/.local/bin/parle status`, `~/.local/bin/dictee etat` avant == après ; `Exec` des `.desktop` résolus ; état réel jamais modifié (`~/.cache/claude-voix-on`, `parle.sock` : mtime avant == après)
- [ ] guide `docs/INSTALL-voix.md` : chaque commande des étapes 1, 2, 5, 9 vérifiée syntaxiquement (`bash -n` sur un extrait, ou lecture justifiée) ; GPU présenté comme facultatif ; ≤ 250 lignes
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T012-voix-portable-sans-chemin-personnel-repli-cpu-in/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T012-voix-portable-sans-chemin-personnel-repli-cpu-in/result.md` | L | affirmations |
| `bin/parle` | L | livrable |
| `bin/dictee` | L | livrable |
| `bin/parle_hook.py` | L | 0 chemin perso |
| `docs/INSTALL-voix.md` | L | livrable |
| `.cache/voix-T012/` | L | tests et copies avant de T012 |
| `.cache/voix-eval-T015/` | E | ton banc |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T015
projet: agentx-voix
statut: fait | bloque
evalue: T012
verdict: retenir | virer
---
## Verdict
## DoD
## Motif
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- jamais faire parler la machine, jamais ouvrir le micro, jamais charger le modèle Whisper réel, jamais relancer les démons réels

## Hors périmètre
- `bin/voix.py`, `bin/dash.py`, `dash/*` ; écrire hors `.cache/voix-eval-T015/` et ton `result.md`

## Environnement
- venvs réels : `~/.local/share/parle-venv/bin/python`, `~/.local/share/whisper-venv/bin/python` (uv, pas de pip) ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/voix-eval-T015/`), `Bash(python3:*)`, `Bash(bash -n:*)`, `Bash(env:*)`, `Bash(~/.local/share/whisper-venv/bin/python:*)`, `Bash(~/.local/share/parle-venv/bin/python:*)`, `Bash(~/.local/bin/parle status)`, `Bash(~/.local/bin/dictee etat)`, `Bash(grep:*)`, `Bash(stat:*)`, `Bash(readlink:*)`, `Bash(mkdir:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T015-evaluer-t012-voix-portable/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
