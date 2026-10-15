---
pack: T001
projet: agentx-voix
role: implementeur
cree: 2026-10-15
---

# Pack T001 — Versionner la voix : parle, dictee, hook dans bin/

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Copier `parle`, `dictee`, `parle_hook.py` dans `bin/`, remplacer les originaux par des symlinks, rendre leur dossier d'état réglable par `AGENTX_VOIX_DIR`, ajouter `dictee on|off|etat` + fichier `dictee.etat`.

## Definition of Done
- [ ] `git ls-files --others --exclude-standard bin/` → `bin/dictee`, `bin/parle`, `bin/parle_hook.py` (3 lignes) ; `test -x` OK sur les 3
- [ ] `readlink -f ~/.local/bin/parle ~/.local/bin/dictee ~/.claude/hooks/parle_hook.py` → les 3 chemins `/home/jdrac/Documents/Workspace/AgentX/bin/…`
- [ ] `bin/parle` : `rg -n 'AGENTX_VOIX_DIR' bin/parle` → 1 ligne ; `V=.cache/T001/v; PATH=.cache/T001/stub:$PATH AGENTX_VOIX_DIR=$V bin/parle on` → `ON` et `$V/claude-voix-on` créé ; `… bin/parle status` → `mode vocal: ON` + `démon: arrêté` ; `… bin/parle off` → `OFF`, fichier absent
- [ ] `bin/parle_hook.py` : `rg -n 'AGENTX_VOIX_DIR' bin/parle_hook.py` → 1 ligne ; flag ON dans `$V` + faux socket `$V/parle.sock` ; `echo '{"last_assistant_message":"x <voix>Bonjour.</voix>"}' | AGENTX_VOIX_DIR=$V python3 -I ~/.claude/hooks/parle_hook.py stop` → faux socket reçoit `{"cmd": "say", "text": "Bonjour."}`
- [ ] `bin/dictee` : `rg -n 'AGENTX_VOIX_DIR' bin/dictee` → 1 ligne ; `AGENTX_VOIX_DIR=$V bin/dictee etat` sans démon → `arrêté`, exit 0 ; `… bin/dictee on` sans démon → exit 1, stderr `dictee n'est pas lancé`
- [ ] `dictee on|off` avec démon factice (pid vivant dans `$V/dictee.pid`, piège SIGUSR1 qui compte) : `etat=off` + `on` → 1 signal ; `etat=on` + `on` → 0 signal ; `etat=on` + `off` → 1 signal ; pas de `dictee.etat` → exit 1 `état inconnu — relance dictee`
- [ ] démon `bin/dictee` : écrit `dictee.etat` (`on`|`off`) au démarrage et dans `toggle()`, le supprime dans `finally` — lecture du diff, NV d'exécution (charge Whisper GPU + micro)
- [ ] `git diff --no-index --stat .cache/T001/avant/parle bin/parle` (idem dictee, hook) : seules les lignes d'état/commandes changent
- [ ] journal parlé (demande humaine 2026-10-16 : « les messages dits à voix haute, dans une petite console de la salle ») : `bin/parle_hook.py stop`, quand il envoie `say`, ajoute aussi 1 ligne JSON `{"t": "<AAAA-MM-JJTHH:MM:SS>", "texte": "<texte dit>"}` à `$AGENTX_VOIX_DIR/claude-voix-journal.jsonl` (défaut `~/.cache`), 500 lignes max (les plus anciennes coupées), toute erreur d'écriture ignorée (le hook ne lève jamais) ; preuve : `$V` jetable, 3 appels `stop` → 3 lignes, flag OFF → 0 ligne, fichier en lecture seule → exit 0
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/.local/bin/parle` | E | source `:11-15` chemins · `:31-53` commandes client ; → symlink |
| `~/.local/bin/dictee` | E | source `:14-15` chemins · `:20-33` client · `:55-66` démon · `:100-103` finally ; → symlink |
| `~/.claude/hooks/parle_hook.py` | E | source `:8-10` chemins ; → symlink |
| `bin/parle` | E | nouveau, copie modifiée |
| `bin/dictee` | E | nouveau, copie modifiée |
| `bin/parle_hook.py` | E | nouveau, copie modifiée |
| `.cache/T001/` | E | `avant/` copies d'origine, `stub/notify-send`, `v/`, scripts de test |

## Contrats
Dossier d'état, défaut `~/.cache`, réglable (les 3 fichiers, même ligne) :
```python
CACHE = os.path.expanduser(os.environ.get("AGENTX_VOIX_DIR") or "~/.cache")
```
Fichiers dans CACHE (noms inchangés + 1 nouveau) :
```
claude-voix-on   flag mode vocal (parle on/off, hook)
parle.sock       socket du démon parle (AF_UNIX, SOCK_STREAM, 1 JSON + "\n" puis close)
dictee.mute      posé par parle pendant qu'il parle (frais < 60 s = actif)
dictee.pid       pid du démon dictee
dictee.etat      NOUVEAU : "on" | "off" (sans \n), écrit par le démon dictee
```
`bin/dictee` client — ajouts, sémantique exacte :
```
dictee etat   → imprime "on" | "off" | "arrêté" | "inconnu" ; exit 0
               arrêté = pas de pid vivant ; inconnu = pid vivant sans dictee.etat
dictee on     → pid vivant ET etat=="off" ⇒ SIGUSR1 ; etat=="on" ⇒ rien ; exit 0
dictee off    → symétrique
               sans démon : stderr "dictee n'est pas lancé", exit 1
               sans dictee.etat : stderr "état inconnu — relance dictee", exit 1
dictee toggle / stop / (sans arg) : inchangés
```
Démon dictee : `active = a.on` → écrire `"on" if active else "off"` juste après l'écriture du pid ; `toggle()` réécrit après bascule ; `finally` supprime `dictee.etat` avec le pid.
Message parle socket (faux socket de test : accepte, lit jusqu'à EOF, `json.loads` par ligne) :
```json
{"cmd": "say", "text": "…"}   {"cmd": "stop"}   {"cmd": "ping"}
```

## Décisions actées
- copie dans `bin/` + `ln -sfn` vers les anciens chemins — F8/F9/autostart/hooks globaux intacts
- shebangs inchangés (venvs `~/.local/share/*-venv`) — dépôt personnel
- hooks restent globaux — doublon sinon en session AgentX
- démons réels non relancés par l'agent — le chef relance en V2

## Hors périmètre
- `~/.claude/settings.json`, gsettings, `~/.config/autostart/*` : ne pas toucher
- logique TTS/STT (modèle, VAD, beam, Piper, découpage phrases, anti-écho) inchangée
- `bin/voix.py`, `bin/dash.py`, `bin/sonnerie.py` (T002)
- `CLAUDE.md` (T002)

## Environnement
- `python3` 3.14 système ; `bin/parle` = venv `~/.local/share/parle-venv/bin/python` ; `bin/dictee` = `~/.local/share/whisper-venv/bin/python`
- démons réels EN MARCHE (parle, dictee) : jamais `parle quit`, `dictee stop`, kill, ni `bin/dictee` sans arg (= toggle réel !)
- toute commande de test préfixée `AGENTX_VOIX_DIR=.cache/T001/v` ; `notify-send` stub (`exit 0`) dans `.cache/T001/stub/` en tête de PATH
- `bin/parle` sans arg lance un démon Piper : interdit en test
- `dictee` client : les commandes client sortent AVANT l'import numpy/faster_whisper (`:20-33`) ; garder cet ordre
- avant toute modif : `cp` des 3 originaux dans `.cache/T001/avant/`
- `rm` passe par permission humaine : préférer `ln -sfn` (écrase sans rm)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(cp, ln, chmod, readlink, test, rg, git ls-files, git diff --no-index, python3, bin/parle, bin/dictee)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T001
projet: agentx-voix
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
