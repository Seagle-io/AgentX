---
tache: T017
projet: agentx-voix
statut: revue
---
## Livré
- bin/parle_hook.py:L79-L84 — `RELAIS` + `est_relais(prompt)` : marqueurs, hand-back ≤300c
- bin/parle_hook.py:L90-L94 — `stop` seulement si prompt humain ; consigne inchangée
- .cache/voix-T017/test_prompt.py — 10 cas, faux socket, dossier jetable
- .cache/voix-T017/test_hook_T001.py — test T001, dossier → `.cache/voix-T017/vh`
- .cache/voix-T017/parle_hook.avant.py — copie avant

Cause : `bin/parle:L122-L133` `handle` → `say` = `q.put((gen, s))` (file) ; `stop()` L115-L120 `gen += 1` + `player.kill()` ; ancien `parle_hook.py:L83-L84` `send({"cmd": "stop"})` à chaque `UserPromptSubmit`, relais d'agent compris.

## Vérifié comment
`python3 -c "import ast;ast.parse(...)"` → `ast OK`
`python3 .cache/voix-T017/test_prompt.py` →
```
OK humain simple: exit=0 stop=1 say=0 consigne=True stderr=''
OK agent-message: exit=0 stop=0 say=0 consigne=True stderr=''
OK task-notification: exit=0 stop=0 say=0 consigne=True stderr=''
OK system notification: exit=0 stop=0 say=0 consigne=True stderr=''
OK humain mot agent: exit=0 stop=1 say=0 consigne=True stderr=''
OK stdin invalide: exit=0 stop=1 say=0 consigne=True stderr=''
OK hand-back: exit=0 stop=0 say=0 consigne=True stderr=''
OK autre session: exit=0 stop=0 say=0 consigne=True stderr=''
OK prompt non str: exit=0 stop=1 say=0 consigne=True stderr=''
OK json liste: exit=0 stop=1 say=0 consigne=True stderr=''
flag OFF relais: exit 0 stdout '' recu []
TOUT OK
```
`python3 .cache/voix-T017/test_hook_T001.py` →
```
stop x1 → (0, '')
socket reçu: [{'cmd': 'say', 'text': 'Bonjour.'}]
journal 3 appels → lignes: 3
flag OFF stop → (0, '') lignes ajoutées: 0
après 500+1 → lignes: 500 première: {"t": "x", "texte": "1"} dernière texte: Cinq cent un.
journal lecture seule stop → (0, '') lignes ajoutées: 0
```
`time env AGENTX_VOIX_DIR=.cache/voix-T017/vide python3 -I bin/parle_hook.py prompt < in.json` → `real 0m0,022s`
`git diff --no-index --stat .cache/voix-T017/parle_hook.avant.py bin/parle_hook.py` → `1 file changed, 9 insertions(+), 1 deletion(-)`

## Écarts
- smoke test sans `AGENTX_VOIX_DIR` après Edit : 1 `{"cmd":"stop"}` envoyé au `parle.sock` réel (prompt humain « salut ») — oubli, aucun son émis, aucun fichier touché
- stdin invalide / prompt non-str / JSON non-dict → traités humains (`stop` envoyé) — comportement antérieur conservé
- `isinstance(data, dict)` ajouté — JSON liste aurait levé sur `.get`

## Pour la suite
- mode `stop` : `data.get` lève si stdin JSON non-dict (L95+, hors DoD)
- docstring L3 « coupe la parole en cours » : vrai seulement pour l'humain
- marqueurs relais en dur : à revoir si Claude Code change ses balises

## Retour sur le pack
- Manquait: statut attendu du cas « stdin invalide » (humain ou relais) ; rappel explicite de toujours fixer `AGENTX_VOIX_DIR` pour tout appel manuel | Inutile: ∅
