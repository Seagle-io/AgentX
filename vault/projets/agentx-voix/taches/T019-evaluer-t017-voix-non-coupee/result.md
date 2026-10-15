---
tache: T019
projet: agentx-voix
statut: fait
evalue: T017
verdict: retenir
---
## Verdict
retenir — 7/7 cases T017 OK, 0 régression
## DoD
- [x] cause constatée et collée — `grep -n "def handle\|q.put\|def stop\|gen += 1\|kill()" bin/parle → 115:def stop() · 118:gen += 1 · 119:player.kill() · 122:def handle · 131:q.put((gen, s))` ; `grep -n -B3 'send({"cmd": "stop"})' .cache/voix-T017/parle_hook.avant.py → 83:if mode == "prompt": 84:send({"cmd": "stop"})` (inconditionnel)
- [x] `stop` seulement si prompt non relais (4 préfixes après lstrip, hand-back ≤ 300 c), consigne toujours — `git diff --no-index avant bin/parle_hook.py → +RELAIS (4 marqueurs) · est_relais: p.lstrip().startswith(RELAIS) or "[Subagent hand-back]" in p[:300] · print(CONSIGNE) hors du if` ; banc : consigne=True 15/15 flag ON ; `flag OFF relais: exit 0 stdout '' recu []`
- [x] message humain → `stop` comme avant — banc : 5/5 humains `stop=1` ; test_prompt `humain simple stop=1 · humain mot agent stop=1`
- [x] test_prompt.py 6+ stdin, faux socket, dossier jetable, exit 0, 0 son — `python3 -I .cache/voix-eval-T019/test_prompt.py` (V → .cache/voix-eval-T019/v, seul diff) `→ 10/10 OK · stop=1 pour humain simple, humain mot agent, stdin invalide, prompt non str, json liste · stop=0 pour 5 relais · say=0 partout · TOUT OK`
- [x] hook ne lève jamais (mode prompt) ; < 50 ms ; ast OK ; test T001 OK — `ast.parse → ast OK` ; `/usr/bin/time … prompt < in.json` sans démon `→ real 0.02s exit 0` x3, flag ON `→ real 0.02s exit 0` x2 ; prompt stdin `[1,2]` · `''` · `\xff\xfe` · `{"prompt":null}` `→ exit 0` x4 ; test_hook_T001 (V → .cache/voix-eval-T019/v) `→ stop x1 (0,'') · socket reçu say Bonjour. · journal 3 lignes · flag OFF +0 · 500+1 → 500, dernière Cinq cent un. · lecture seule +0`
- [x] `git diff --no-index --stat` collé — `→ 1 file changed, 9 insertions(+), 1 deletion(-)` = déclaré ; `git show HEAD:bin/parle_hook.py | diff - avant → seul hunk RELAIS/est_relais` ; `git status --short -- bin/parle bin/dictee bin/voix.py bin/parle_hook.py → ∅`
- [x] result.md selon Format de sortie — `grep -n '^## ' → Livré · Vérifié comment · Écarts · Pour la suite · Retour sur le pack` ; `awk 'NR>5' | wc -l → 50` (≤ 60) ; Livré L79-L84 / L90-L94 = code réel
## Motif
∅
## Vérifié comment
Banc `.cache/voix-eval-T019/banc.py` : hook réel, faux socket `AF_UNIX` dans `.cache/voix-eval-T019/v`, prompts tirés des transcripts `~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/*.jsonl` →
| cas | source | len | humain | stop | say | exit | ms | OK |
|---|---|---|---|---|---|---|---|---|
| peer direct #1 | réel | 2962 | non | 0 | 0 | 0 | 21 | OK |
| peer direct #2 | réel | 3517 | non | 0 | 0 | 0 | 20 | OK |
| peer cross-session | réel | 1611 | non | 0 | 0 | 0 | 20 | OK |
| peer queued agent-message | réel | 3552 | non | 0 | 0 | 0 | 20 | OK |
| task-notif direct | réel | 424 | non | 0 | 0 | 0 | 20 | OK |
| task-notif queued | réel | 858 | non | 0 | 0 | 0 | 21 | OK |
| SYSTEM NOTIFICATION rendu API | réel | 1400 | non | 0 | 0 | 0 | 20 | OK |
| Subagent hand-back indenté 4 esp | réel tronqué | 3515 | non | 0 | 0 | 0 | 21 | OK |
| humain réel | réel | 95 | oui | 1 | 0 | 0 | 22 | OK |
| humain réel pasted_content | réel | 882 | oui | 1 | 0 | 0 | 20 | OK |
| humain cite agent-message milieu | synth | 56 | oui | 1 | 0 | 0 | 22 | OK |
| humain espace initial | synth | 14 | oui | 1 | 0 | 0 | 18 | OK |
| humain très long | synth | 5760 | oui | 1 | 0 | 0 | 19 | OK |
| FN system-reminder + relais | réel rendu API | 2020 | non | 0 | 0 | 0 | 22 | OK |
| FN hand-back après 300 c | synth | 325 | non | 1 | 0 | 0 | 20 | stop envoyé |
Faux négatif — forme réelle du `prompt` (hook attaché au message, transcripts) :
`classe.py` prompts directs → `141 human→stop · 235 peer→relais · 14 task-notification→relais · KO: 0`
`queued.py` attachments `queued_command.prompt` (messages arrivés en cours de tour, hook UserPromptSubmit rattaché) → `311+11 task-notification→relais · 75 peer "<agent-message from=…"→relais · 19 human→STOP · 0 autre`
`handback.py` offset `[Subagent hand-back]` réel → `41 (queued, 75) · 80 (direct, 18)` ; max 80 < 300
`hooks2.py` bbd9599f → `27 hooks sur peer "Another Claude session…" · 20 sur tool_result + queued_command · 13 humains`
`<system-reminder>` + relais : n'existe que dans `api-request-blob` (rendu modèle), jamais en `prompt` ; et hand-back à c≤300 → relais quand même
marqueur > 300 c → `stop` envoyé (FN théorique) ; 0/401 queued + 0/390 directs réels concernés → non bloquant
Mode stop avant/après identiques — `stop [1,2] → exit 1 AttributeError` et `{"transcript_path":null} → exit 1 TypeError` sur avant ET après ; `{"transcript_path":"/x"} → exit 0` les deux
## Écarts
- lecture hors WL: `bin/parle` (grep 5 motifs) — vérifier cause DoD 1
- transcripts lus via scripts ciblés — permis par Contrats du pack
- tests T017 copiés dans `.cache/voix-eval-T019/` — seul diff : V → `.cache/voix-eval-T019/v`
## Pour la suite
- mode `stop` lève sur stdin JSON non-dict ou `transcript_path` null — préexistant, hors scope T017
- T017 a envoyé 1 `stop` au `parle.sock` réel (smoke test) — Décision violée, déclarée, hors DoD
- marqueurs relais en dur ; FN si marqueur > 300 c — surveiller formes Claude Code
- docstring L3 « coupe la parole en cours » : vrai seulement pour l'humain
## Retour sur le pack
- Manquait: forme réelle des relais = `origin.kind` (peer, task-notification) et `attachment.queued_command.prompt` dans le transcript, non dit | Inutile: ∅
