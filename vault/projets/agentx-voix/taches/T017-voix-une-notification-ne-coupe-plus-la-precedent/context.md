---
pack: T017
projet: agentx-voix
role: implementeur
cree: 2026-10-16
---

# Pack T017 — Voix : une notification ne coupe plus la précédente

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `bin/parle_hook.py` (mode `prompt`), ne plus envoyer `{"cmd":"stop"}` au démon `parle` quand le « prompt » n'est pas un message de l'humain mais un retour d'agent ou une notification système — pour qu'un résumé vocal en cours finisse avant le suivant (les `say` sont déjà mis en file par le démon).

## Definition of Done
- [ ] cause constatée et collée : le démon met les `say` en file (`bin/parle` `handle` → `q.put`) ; la coupure vient de `parle_hook.py prompt` qui envoie `stop` à CHAQUE `UserPromptSubmit`, y compris quand Claude Code relaie un retour d'agent (`<agent-message …>`, `[Subagent hand-back]`, `<task-notification>`, `[SYSTEM NOTIFICATION`)
- [ ] `prompt` : `stop` envoyé SEULEMENT si le texte du prompt (`data["prompt"]`) ne commence pas, après espaces, par un de ces marqueurs : `<agent-message`, `<task-notification`, `[SYSTEM NOTIFICATION`, `Another Claude session sent a message`, et ne contient pas `[Subagent hand-back]` dans ses 300 premiers caractères ; la consigne vocale (`print(CONSIGNE)`) reste imprimée dans tous les cas où le mode vocal est actif
- [ ] message humain → `stop` envoyé comme avant (l'humain qui parle coupe la voix : comportement conservé)
- [ ] tests `.cache/voix-T017/test_prompt.py` avec faux socket et `AGENTX_VOIX_DIR` jetable : 6 stdin (humain simple · `<agent-message from="x">…` · `<task-notification>…` · `[SYSTEM NOTIFICATION - NOT USER INPUT]…` · texte humain contenant le mot « agent » · stdin invalide) → `stop` reçu exactement pour les cas humains ; exit 0 partout ; 0 son émis
- [ ] le hook ne lève jamais ; < 50 ms sans démon (`time` collé) ; `ast.parse` OK ; journal parlé (mode `stop`) inchangé : test de T001 (`.cache/T001/test_hook.py`, adapté au dossier) → OK
- [ ] `git diff --no-index --stat <copie avant> bin/parle_hook.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/parle_hook.py` | E | `main`, mode `prompt` |
| `bin/parle` | L | démon : `handle`, file `q`, `stop()` |
| `.cache/T001/test_hook.py` | L | test du journal parlé |
| `.cache/voix-T017/` | E | copie avant, tests |

## Contrats
Hook global (`~/.claude/settings.json`) : `UserPromptSubmit` → `python3 -I ~/.claude/hooks/parle_hook.py prompt` ; `Stop` → `… stop` ; `~/.claude/hooks/parle_hook.py` = lien symbolique vers `bin/parle_hook.py` (ce fichier est ACTIF dans la session de l'humain dès que tu l'enregistres : une erreur casse son envoi de messages → Edit en une fois, `ast.parse` immédiat).
stdin `UserPromptSubmit` : `{"session_id","transcript_path","cwd","hook_event_name":"UserPromptSubmit","prompt":"…"}`.

## Décisions actées
- demande humaine 2026-10-16 : « pour entamer une nouvelle notification par voix, attends que l'autre ait fini »
- l'humain qui écrit coupe toujours la voix ; seuls les retours d'agents et notifications système n'interrompent plus
- jamais faire parler la machine ; jamais toucher `~/.cache/claude-voix-*` réels ni `parle.sock` réel

## Hors périmètre
- `bin/parle` (démon), `bin/dictee` (T016 en parallèle), `bin/voix.py`, `docs/`

## Environnement
- faux socket : `python3` qui écoute un `AF_UNIX` dans `$AGENTX_VOIX_DIR` jetable et enregistre les messages
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/voix-T017/`), Grep, `Bash(python3:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(grep:*)`, `Bash(git diff:*)`, `Bash(time:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T017
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
