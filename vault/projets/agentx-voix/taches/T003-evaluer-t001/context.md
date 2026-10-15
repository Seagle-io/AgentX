---
pack: T003
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T003 — Evaluer T001

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T001 (voix versionnée dans `bin/` : `parle`, `dictee`, `parle_hook.py` + symlinks, journal parlé) contre la DoD de SON pack, sans jamais toucher l'état voix réel de l'humain → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T001-versionner-la-voix-parle-dictee-hook-dans-bin/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi, sur TON dossier jetable `AGENTX_VOIX_DIR=.cache/voix-eval-T003/v`
- [ ] journal parlé : hook `stop` ×3 → 3 lignes JSON `{t, texte}` valides ; texte = exactement ce qui est envoyé à `say` (même nettoyage) ; flag OFF → 0 ; 501 appels → 500 lignes ; dossier en lecture seule → exit 0 ; entrée stdin invalide / transcript absent → exit 0
- [ ] le hook ne lève jamais et rend en < 1 s sans démon (`time` collé)
- [ ] symlinks : `readlink -f` ×3 ; les originaux (`.cache/T001/avant/`) == versions d'avant (diff limité aux lignes d'état déclarées)
- [ ] état réel de l'humain intact : `ls -la ~/.cache/claude-voix-on ~/.cache/dictee.mute ~/.cache/parle.sock` avant == après (collé) ; 0 son émis (stub notify-send, faux socket)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T001-versionner-la-voix-parle-dictee-hook-dans-bin/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T001-versionner-la-voix-parle-dictee-hook-dans-bin/result.md` | L | affirmations |
| `bin/parle` | L | livrable |
| `bin/dictee` | L | livrable |
| `bin/parle_hook.py` | L | livrable |
| `.cache/T001/` | L | originaux, stubs, tests de T001 |
| `.cache/voix-eval-T003/` | E | ton dossier jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T003
projet: agentx-voix
statut: fait | bloque
evalue: T001
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
Journal : `$AGENTX_VOIX_DIR/claude-voix-journal.jsonl` (défaut `~/.cache`), 1 ligne `{"t": "<AAAA-MM-JJTHH:MM:SS>", "texte": "…"}`, 500 lignes max. Hook `stdin` SubagentStop/Stop : `{"last_assistant_message": "… <voix>…</voix>"}`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- jamais faire parler la machine ; jamais toucher `~/.cache/claude-voix-on`, `dictee.mute`, `parle.sock`, `claude-voix-journal.jsonl` réels ; le démon dictee réel n'est pas relancé (Whisper GPU)

## Hors périmètre
- `bin/voix.py`, `bin/dash.py`, `bin/sonnerie.py` (T002 en parallèle) ; écrire hors `.cache/voix-eval-T003/` et ton `result.md`

## Environnement
- `PATH=.cache/T001/stub:$PATH` pour neutraliser `notify-send` ; faux socket parle : `python3` qui écoute un `AF_UNIX` dans ton dossier jetable
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/voix-eval-T003/`), `Bash(python3:*)`, `Bash(bash:*)`, `Bash(readlink:*)`, `Bash(ls:*)`, `Bash(diff:*)`, `Bash(rg:*)`, `Bash(mkdir:*)`, `Bash(chmod:*)`, `Bash(time:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T003-evaluer-t001/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
