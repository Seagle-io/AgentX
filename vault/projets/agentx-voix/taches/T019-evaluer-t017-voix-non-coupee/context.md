---
pack: T019
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T019 — Evaluer T017 (voix non coupée)

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger T017 (`bin/parle_hook.py prompt` n'envoie plus `stop` pour un retour d'agent ou une notification système ; l'humain coupe toujours la voix) contre la DoD de SON pack → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T017-voix-une-notification-ne-coupe-plus-la-precedent/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi, TOUJOURS avec `AGENTX_VOIX_DIR=.cache/voix-eval-T019/v` (jamais le `parle.sock` réel)
- [ ] ≥ 8 prompts réels de cette session (formes exactes des relais : bloc `<system-reminder>` contenant `Another Claude session sent a message`, `<agent-message from=…>`, `<task-notification>`, `[SYSTEM NOTIFICATION - NOT USER INPUT]`, `[Subagent hand-back]` indenté) + 5 messages humains (dont un qui cite « agent-message » au milieu d'une phrase, un qui commence par un espace, un très long) → `stop` uniquement pour les 5 humains ; tableau collé
- [ ] faux négatif à juger : un relais dont le marqueur arrive après 300 caractères ou derrière un `<system-reminder>` → `stop` envoyé ? Si oui, est-ce le cas réel de Claude Code (forme du stdin `UserPromptSubmit` pour un relais) ?
- [ ] mode `stop` (résumé vocal + journal) inchangé : test `.cache/voix-T017/test_hook_T001.py` rejoué → OK ; hook < 50 ms ; exit 0 partout
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T017-voix-une-notification-ne-coupe-plus-la-precedent/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T017-voix-une-notification-ne-coupe-plus-la-precedent/result.md` | L | affirmations |
| `bin/parle_hook.py` | L | livrable |
| `.cache/voix-T017/` | L | tests de T017 |
| `.cache/voix-eval-T019/` | E | ton banc |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T019
projet: agentx-voix
statut: fait | bloque
evalue: T017
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
stdin `UserPromptSubmit` : `{"session_id","transcript_path","cwd","hook_event_name":"UserPromptSubmit","prompt":"…"}`. Pour savoir si le `prompt` d'un relais commence par le marqueur ou par un `<system-reminder>`, lire `transcript_path` d'une session réelle EN LECTURE est permis : le transcript courant est `~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/*.jsonl` (rg ciblé, jamais tout le fichier).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- jamais faire parler la machine ; jamais envoyer quoi que ce soit au `parle.sock` réel (T017 l'a fait une fois par erreur : à éviter)

## Hors périmètre
- `bin/parle`, `bin/dictee`, `bin/voix.py` ; écrire hors `.cache/voix-eval-T019/` et ton `result.md`

## Environnement
- faux socket `AF_UNIX` dans le dossier jetable ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/voix-eval-T019/`), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(grep:*)`, `Bash(mkdir:*)`, `Bash(time:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T019-evaluer-t017-voix-non-coupee/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
