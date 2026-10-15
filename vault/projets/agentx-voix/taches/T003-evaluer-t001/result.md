---
tache: T003
projet: agentx-voix
statut: fait
evalue: T001
verdict: retenir
---
## Verdict
retenir — 10/10 cases DoD T001 re-prouvées
## DoD
- [x] untracked bin/ 3 fichiers + test -x — `git ls-files --others --exclude-standard bin/` → `bin/dictee bin/parle bin/parle_hook.py` (+ produits.py publier.py voix.py, autres tâches) ; `test -x` → `x parle OK` `x dictee OK` `x parle_hook.py OK`
- [x] readlink ×3 → bin/ — `readlink -f ~/.local/bin/parle ~/.local/bin/dictee ~/.claude/hooks/parle_hook.py` → `/home/jdrac/Documents/Workspace/AgentX/bin/parle` · `…/bin/dictee` · `…/bin/parle_hook.py` ; `ls -la` → 3 `lrwxrwxrwx` 00:15
- [x] bin/parle AGENTX_VOIX_DIR + on/status/off — `rg` → `bin/parle:11:CACHE = os.path.expanduser(os.environ.get("AGENTX_VOIX_DIR") or "~/.cache")` ; `V=.cache/voix-eval-T003/v PATH=stub bin/parle on` → `ON exit=0`, `ls $V` → `claude-voix-on` ; `status` → `mode vocal: ON` `démon: arrêté` ; `off` → `OFF exit=0`, `ls -A $V` → ∅
- [x] hook AGENTX_VOIX_DIR + say sur faux socket — `rg` → `bin/parle_hook.py:8:CACHE = …` (1 ligne) ; `python3 .cache/voix-eval-T003/test_journal.py` (`python3 -I ~/.claude/hooks/parle_hook.py stop`, faux AF_UNIX `vj/parle.sock`) → `stop → (0, '')` ; reçu cmd=say text=`Bonjour.`
- [x] bin/dictee AGENTX_VOIX_DIR + etat/on sans démon — `rg` → `bin/dictee:16:CACHE = …` (1 ligne) ; `bash .cache/voix-eval-T003/test_dictee.sh` → `arrêté exit=0` · `exit=1 stderr=dictee n'est pas lancé`
- [x] dictee on/off démon factice SIGUSR1 — même script → `etat=off + on → exit=0 signaux=1` · `etat=on + on → exit=0 signaux=0` · `etat=on + off → exit=0 signaux=1` · `exit=1 stderr=état inconnu — relance dictee signaux=0`
- [x] démon écrit/réécrit/supprime dictee.etat (preuve contractée = diff) — `rg -n ETAT bin/dictee` → `:69 open(ETAT,"w").write("on" if a.on else "off")` (après pid :68) · `:76` dans toggle · `:116 for f in (PIDFILE, ETAT)` dans finally
- [x] diff vs avant limité à état/commandes — `git diff --no-index --stat` → parle `1+ 1-` · dictee `19+ 4-` · parle_hook.py `15+ 2-` ; hunks relus : CACHE, ETAT, client etat/on/off, journal, `import time` ; 0 ligne TTS/STT
- [x] journal parlé 3/OFF/500/lecture seule — test_journal.py → `3 appels → lignes: 3` · `flag OFF stop → (0, '') lignes ajoutées: 0` · `501 appels → 500 lignes ; première: Phrase 1. dernière: Phrase 500.` · `fichier lecture seule stop → (0, '') ajoutées: 0`
- [x] result.md format — `wc -l` → 54 (≤ 60) ; `rg '^## '` → Livré · Vérifié comment · Écarts · Pour la suite · Retour sur le pack
## Motif
∅
## Vérifié comment
journal `{t, texte}` == texte say (même nettoyage), test_journal.py →
```
{"t": "2026-10-16T00:18:22", "texte": "Bonjour."} | say: "Bonjour."
{"t": "2026-10-16T00:18:22", "texte": "Voir gras et puis le lien ok."} | say: "Voir gras et puis le lien ok."
{"t": "2026-10-16T00:18:22", "texte": "pas de balise\npuce ital lien fin."} | say: "pas de balise\npuce ital lien fin."
clés {t,texte}, t AAAA-MM-JJTHH:MM:SS, texte == say: True | say reçus: 3
dossier lecture seule stop → (0, '') journal créé: False
stdin vide → (0, '')   stdin non-json → (0, '')   stdin {} → (0, '')
stdin transcript absent → (0, '')   stdin octets invalides → (0, '')   stdin msg dict → (0, '')
stdin transcript null → (1, 'TypeError: expected str, bytes or os.PathLike object, not NoneType')
stdin json liste|chaîne|nombre → (1, "AttributeError: 'list' object has no attribute 'get'")
```
exit 1 ci-dessus : code d'avant inchangé (`last_assistant_text`/`main` hors hunks diff) ; entrées jamais émises par Claude Code ; hors DoD T001 (« ne lève jamais » = erreurs d'écriture)
`time (echo '{"last_assistant_message":"x <voix>Sans démon.</voix>"}' | AGENTX_VOIX_DIR=vt python3 -I ~/.claude/hooks/parle_hook.py stop)` sans parle.sock → `exit=0` `real 0m0,019s` ; journal 1 ligne
originaux `.cache/T001/avant/` : `ls --full-iso` → dictee 2026-10-15 19:16:52 · parle 19:16:39 · parle_hook.py 19:17:19 (< symlinks 10-16 00:15)
état réel avant → après :
```
claude-voix-on  0 o  2026-10-15 19:18:53.647178469  → identique
parle.sock      srw  2026-10-15 19:16:46.459464622  → identique
dictee.mute     absent                              → absent
claude-voix-journal.jsonl 257 o 1 l → 490 o 2 l : ligne 00:18:34 = session chef (« Votre console avance… »), 0 ligne de test
```
0 son : toutes commandes `AGENTX_VOIX_DIR=.cache/voix-eval-T003/*`, `PATH=.cache/T001/stub` (`which notify-send` → `.cache/T001/stub/notify-send`) ; démon dictee réel non touché
## Écarts
- lecture hors WL: `~/.cache/claude-voix-journal.jsonl` (cat, lecture seule) — attribuer ligne ajoutée 00:18:34
- dictee testé dans `vd/`, hook dans `vj/`, `ro/`, `vt/` (≠ `v/`) — 1 jeu par scénario, tous sous `.cache/voix-eval-T003/`
- `test_dictee.sh` = copie de `.cache/T001/test_dictee.sh`, chemin `vd` réécrit ; tue son seul démon factice
## Pour la suite
- hook : `data = json.load(stdin)` non-dict ou `transcript_path: null` → traceback exit 1 ; durcir `main()` (`isinstance(data, dict)`, `except Exception`) — tâche dédiée, hors T001
- démon dictee réel = ancien code : `~/.cache/dictee.etat` absent → `dictee on|off` = « état inconnu » jusqu'à relance humaine
- journal réel alimenté par le hook symlinké : 2 lignes, dernière 00:18:34 ; T002 peut le lire tel quel
- `dictee on|off` avant `signal.signal(SIGUSR1)` (bin/dictee:69 vs :79) → SIGUSR1 par défaut tue le démon en chargement
## Retour sur le pack
- Manquait: preuve d'origine des copies `avant/` (hash pris avant modif) ; périmètre de « ne lève jamais » (journal seul ou toute entrée) | Inutile: ∅
