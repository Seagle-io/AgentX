---
pack: T011
projet: agentx-voix
role: implementeur
cree: 2026-10-16
remplace: T008
---

# Pack T011 — Serveur voix : lectures bornées, pid vérifié (remplace T008, 2e renvoi)

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Finir de rendre `bin/voix.py` incassable : toute lecture de fichier d'état bornée en octets, et `micro()` qui ne signale jamais un processus étranger — le reste (T002 + T008) est conservé.

## Definition of Done
- [ ] motif levé — `journal()` : lit au plus les 64 derniers Ko du fichier (`open` binaire + `seek` depuis la fin, `os.stat` d'abord : fichier non régulier — lien vers `/dev/zero`, fifo, dossier → `[]`), décodage `errors="replace"`, 1re ligne partielle ignorée, `except Exception` → `[]`
- [ ] `_pid_dictee` et `_etat_dictee` : `read(32)` sur fichier régulier seulement (non régulier → None) ; jamais `read_text()` sans borne dans `bin/voix.py` (`grep -n "read_text\|\.read()" bin/voix.py` collé, chaque lecture justifiée)
- [ ] pid recyclé : avant tout `os.kill`, `/proc/<pid>/cmdline` doit contenir `dictee` ; sinon `ValueError("dictee n'est pas lancé")`, 0 signal (os.kill instrumenté, JAMAIS réel) ; `etat()["dictee"]` suit la même règle
- [ ] `.cache/voix-eval-T010/robu2.py` (copié dans `.cache/voix-T011/`, chemins adaptés) sous `RLIMIT_AS` 512 Mo → 0 `EXC` sur 15 cas ; `robu.py` (T004) → 0 `EXC` ; journal de 50 Mo → `journal()` < 20 ms (mesure collée)
- [ ] non-régression : DoD T002 rejouée sur banc (phrases ×5, 6 clés, mode on/off, 403/400, micro/stop, sonnerie ON/OFF/absent < 1,5 s, journal 3) + panne isolée (`voix: null`, reste intact)
- [ ] `python3 -m py_compile bin/voix.py` rc 0 ; `bin/dash.py` inchangé par toi (diff vide) ; `git diff --no-index --stat <copie avant> bin/voix.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/voix.py` | E | `_pid_dictee :43-53`, `_etat_dictee :56-62`, `etat :65-87`, `journal :~90-101`, `micro :~136` |
| `vault/projets/agentx-voix/taches/T010-evaluer-t008-voix-robuste/result.md` | L | verdict détaillé |
| `vault/projets/agentx-voix/taches/T002-serveur-voix-voix-py-api-voix-state-json-annonce/context.md` | L | DoD et contrats d'origine |
| `.cache/voix-eval-T010/robu2.py` | L | 15 cas de robustesse |
| `.cache/voix-eval-T004/robu.py` | L | cas d'origine |
| `.cache/T002/` | L | faux parle / dictee, stub |
| `.cache/voix-T011/` | E | banc, tests |

## Contrats
Motif du 2e renvoi (évaluation T010, verbatim) :
```
voix.journal leve MemoryError si claude-voix-journal.jsonl pointe vers /dev/zero : read_text non borne, except OSError seul ; sans ulimit le serveur dash lit jusqu a saturer la RAM
bin/voix.py:92-95 read_text sans borne + except OSError seul
_pid_dictee/_etat_dictee : read(32) au lieu de read_text() (/dev/zero mange la RAM jusqu'au plafond avant le except)
journal de 50 Mo → 846 ms par poll
pid recyclé → micro() peut envoyer SIGUSR1 à un processus étranger : vérifier /proc/<pid>/cmdline
```
API inchangée : `etat`, `journal(n=30)`, `mode`, `taire`, `micro`, `phrase`, `annoncer`.

## Décisions actées
- 2e renvoi sur la chaîne T002 → T008 → T011 : modèle opus
- jamais faire parler la machine ; jamais toucher l'état voix réel ; JAMAIS `os.kill` réel vers un pid de test ≤ 1 ou étranger

## Hors périmètre
- `bin/dash.py` (le `try` séparé de T008 est bon), `dash/*`, `bin/parle*`, `bin/dictee`, `bin/sonnerie.py`

## Environnement
- banc : `B=.cache/voix-T011/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; recopier `bin/voix.py` avant chaque essai ; `http://127.0.0.1:7822`
- `PATH=.cache/T002/stub:$PATH` ; `grep -nE` (pas `rg` dans `bash -c`) ; `resource.setrlimit(RLIMIT_AS)` dans un sous-processus python de test
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/voix-T011/banc)`, `Bash(git diff:*)`, `Bash(grep:*)`, `Bash(ln:*)`, `Bash(time:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T011
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
