---
pack: T012
projet: agentx-voix
role: implementeur
cree: 2026-10-16
---

# Pack T012 — Voix portable : sans chemin personnel, repli CPU, installable par Sylvain

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `bin/parle` et `bin/dictee` installables sur une autre machine que celle de Julien (Sylvain) : 0 chemin personnel, interpréteur trouvé sans shebang absolu, dictée qui marche sans GPU NVIDIA, et le guide `docs/INSTALL-voix.md` mis à jour en conséquence — sans rien casser chez Julien (F8, F9, autostart, hooks).

## Definition of Done
- [ ] `grep -nE "/home/[a-z]+" bin/parle bin/dictee bin/parle_hook.py` → ∅ (avant/après collés)
- [ ] shebang : `#!/usr/bin/env python3` + au démarrage, si le module requis (`piper` pour parle, `faster_whisper` pour dictee) n'est pas importable, ré-exécution via le python du venv `~/.local/share/<parle|whisper>-venv/bin/python` (variable `AGENTX_PARLE_PY` / `AGENTX_DICTEE_PY` pour surcharger) ; venv absent → message clair + exit 1 (pas de traceback)
- [ ] chez Julien, 0 régression : `~/.local/bin/parle status` → même sortie qu'avant ; `bin/dictee etat` → même sortie ; les `.desktop` d'autostart et les raccourcis inchangés et toujours valides (`Exec` résout) — sorties collées ; 0 son émis (stub notify-send, `AGENTX_VOIX_DIR` jetable pour tout essai qui écrit)
- [ ] dictée sans GPU : `device="auto"` (CUDA si dispo, sinon CPU) et `compute_type` adapté (`float16` GPU, `int8` CPU), surchargeable par `--device` / `--compute-type` ; preuve SANS charger le modèle réel : test unitaire qui simule l'absence de CUDA (monkeypatch) et vérifie les arguments passés à `WhisperModel` (collé)
- [ ] `docs/INSTALL-voix.md` : étape 1 = cloner `https://github.com/Seagle-io/AgentX` (les 3 scripts y seront publiés par le chef) ; contournement des shebangs retiré (plus nécessaire) ; GPU → optionnel avec repli CPU (plus lent : le dire) ; modèle Whisper `bofenghuang/whisper-large-v3-french` (dossier `ctranslate2`, constaté chez Julien : `~/.local/share/whisper-models/whisper-large-v3-french/ctranslate2`) ; `wc -l` ≤ 250
- [ ] `python3 -m py_compile` (via `ast.parse`) des 2 scripts OK ; `git diff --no-index --stat <copies avant> bin/parle bin/dictee` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/parle` | E | shebang `:1`, démarrage |
| `bin/dictee` | E | shebang `:1`, `--model :48`, `WhisperModel :71` |
| `docs/INSTALL-voix.md` | E | guide de Sylvain |
| `bin/parle_hook.py` | L | déjà stdlib (vérifier 0 chemin perso) |
| `vault/projets/agentx-voix/taches/T009-guide-d-installation-de-la-voix-pour-sylvain/result.md` | L | inventaire, blocages constatés |
| `~/.config/autostart/parle.desktop` | L | `Exec` |
| `~/.config/autostart/dictee.desktop` | L | `Exec` |
| `.cache/voix-T012/` | E | copies avant, tests, stub |

## Contrats
Constaté (scribe T009) :
```
bin/parle:1  #!/home/jdrac/.local/share/parle-venv/bin/python
bin/dictee:1 #!/home/jdrac/.local/share/whisper-venv/bin/python
bin/dictee:48 p.add_argument("--model", default=os.path.expanduser("~/.local/share/whisper-models/whisper-large-v3-french/ctranslate2"))
bin/dictee:71 model = WhisperModel(a.model, device="cuda", compute_type="float16")
venvs créés avec uv : pip absent ; ~/.local/bin/{parle,dictee} = symlinks vers bin/ ; .desktop Exec=~/.local/bin/{parle,dictee}
```

## Décisions actées
- demande humaine 2026-10-16 : « que cette problématique ne se reproduise jamais » — outils livrés portables
- jamais faire parler la machine ; jamais relancer le démon dictee réel (Whisper GPU + micro) ; jamais toucher `~/.cache/claude-voix-*` réels
- publication des 3 scripts sur GitHub : faite par le chef (branche de publication), pas par toi ; jamais push

## Hors périmètre
- `bin/voix.py` (T011 en cours), `bin/dash.py`, `dash/*`, `bin/vx.py`, `bin/garde_dispatch.py` (agentx-entreprise T036 en parallèle)
- installer quoi que ce soit, télécharger un modèle

## Environnement
- `PATH=.cache/T002/stub:$PATH` (notify-send neutralisé) ; `AGENTX_VOIX_DIR=.cache/voix-T012/v` pour tout essai
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/voix-T012/`, `docs/INSTALL-voix.md`), Grep, `Bash(python3:*)`, `Bash(~/.local/share/parle-venv/bin/python:*)`, `Bash(~/.local/share/whisper-venv/bin/python:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(grep:*)`, `Bash(git diff:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T012
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
