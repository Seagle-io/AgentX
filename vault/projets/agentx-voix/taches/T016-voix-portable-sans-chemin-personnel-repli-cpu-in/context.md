---
pack: T016
projet: agentx-voix
role: implementeur
cree: 2026-10-16
remplace: T012
---

# Pack T016 — Voix portable : repli CPU sans faille (remplace T012)

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Finir le repli CPU de `bin/dictee` (motif du renvoi de T012) et corriger 1 phrase fausse du guide — tout le reste livré par T012 (shebangs `/usr/bin/env`, re-exécution via venv, `--device`/`--compute-type`, guide) est conservé.

## Definition of Done
- [ ] motif levé — détection : `ctranslate2.get_cuda_device_count()` enveloppé `try/except Exception` → 0 → `cpu`/`int8`
- [ ] motif levé — chargement : `device` résolu `cuda` mais `WhisperModel(…, device="cuda")` lève (libs `nvidia-*` absentes) → message stderr « GPU indisponible, repli CPU » + nouvel essai `cpu`/`int8` ; `--device cuda` explicite → pas de repli (erreur claire, rc 1)
- [ ] tests : `.cache/voix-T012/test_dictee_device.py` (4 cas) + `.cache/voix-eval-T015/test_eval.py` (5 cas, dont `side_effect=RuntimeError`) + 1 cas neuf (WhisperModel cuda lève → 2e appel cpu/int8) → tous OK, lancés avec `~/.local/share/whisper-venv/bin/python` ; sortie collée ; JAMAIS charger le vrai modèle, JAMAIS ouvrir le micro
- [ ] `docs/INSTALL-voix.md:~85` : « les trois scripts basculent sur leur venv » → corrigé (`parle_hook.py` est en Python standard, sans venv)
- [ ] 0 régression chez Julien : `~/.local/bin/dictee etat` avant == après ; `grep -nE "/home/[a-z]+" bin/dictee` → ∅ ; `ast.parse` OK
- [ ] `git diff --no-index --stat <copie avant> bin/dictee` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dictee` | E | détection `:68`, `:81-82`, chargement `WhisperModel` |
| `docs/INSTALL-voix.md` | E | phrase `:~85` |
| `vault/projets/agentx-voix/taches/T015-evaluer-t012-voix-portable/result.md` | L | verdict |
| `.cache/voix-T012/test_dictee_device.py` | L | tests de T012 |
| `.cache/voix-eval-T015/test_eval.py` | L | tests de l'évaluateur |
| `.cache/voix-T016/` | E | copies avant, tests |

## Contrats
Motif de renvoi (évaluation T015, verbatim) :
```
bin/dictee:81 ctranslate2.get_cuda_device_count() non protégé : s'il lève, RuntimeError non gérée au lieu du repli CPU int8 ; envelopper try/except → cpu et ajouter ce cas au test
WhisperModel(device="cuda") échoue (libs nvidia-* absentes) → retenter cpu/int8, signalé par T012
docs/INSTALL-voix.md:85 « les trois scripts basculent sur leur venv » : faux pour parle_hook.py (stdlib)
```

## Décisions actées
- jamais faire parler la machine, jamais ouvrir le micro, jamais charger le modèle réel, jamais relancer le démon réel
- publication sur GitHub : tâche T014 (après toi), jamais push

## Hors périmètre
- `bin/parle`, `bin/parle_hook.py`, `bin/voix.py`, `bin/dash.py`, `dash/*`

## Environnement
- `AGENTX_VOIX_DIR=.cache/voix-T016/v` pour tout essai qui écrit ; `PATH=.cache/T002/stub:$PATH`
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/voix-T016/`), Grep, `Bash(python3:*)`, `Bash(~/.local/share/whisper-venv/bin/python:*)`, `Bash(~/.local/bin/dictee etat)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(grep:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T016
projet: agentx-voix
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
