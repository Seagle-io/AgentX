---
pack: T008
projet: agentx-voix
role: implementeur
cree: 2026-10-16
remplace: T002
---

# Pack T008 — Serveur voix : robustesse de voix.etat (remplace T002)

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `bin/voix.py` incassable (motif du renvoi de T002 : un fichier d'état corrompu fait tomber tout `state.json`, et un pid 0/-1 pourrait faire envoyer un signal à tous les processus) et isoler la voix dans `bin/dash.py` ; tout le reste livré par T002 est conservé.

## Definition of Done
- [ ] motif levé : `_pid_dictee` → pid entier `> 1` et `<= 4194304` (sinon None), toute exception → None ; `_etat_dictee` → lecture `errors="replace"`, valeur ∉ {`on`,`off`} → None, toute exception → None ; `etat()` → `try/except Exception` global : en cas d'erreur, 5 booléens `False` ; `journal()` → jamais d'exception
- [ ] `micro()` : jamais `os.kill` avec un pid ≤ 1 (preuve : pid `0`, `-1`, `1` dans `dictee.pid` → `ValueError("dictee n'est pas lancé")`, 0 signal envoyé, collé) ; NE JAMAIS exécuter réellement `os.kill(-1, …)` dans un test
- [ ] `bin/dash.py` : `voix` calculé dans SON propre `try` (≠ celui de `construire_etat`) : panne voix → `"voix": null` et le reste de `state.json` intact (`immeuble`, `roles`, `taches` présents)
- [ ] rejouer `.cache/voix-eval-T004/robu.py` (copié dans `.cache/voix-T008/`, chemins adaptés) → 0 `EXC` ; pid énorme, `dictee.etat` binaire → `state.json` complet (collé)
- [ ] non-régression : les 10 cases DoD de T002 rejouées sur banc (phrases ×5, 6 clés, mode on/off, 403/400, micro/stop, sonnerie ON/OFF/absent < 1,5 s, journal 3) → OK (sorties collées)
- [ ] `python3 -m py_compile bin/voix.py bin/dash.py` rc 0 ; `git diff --no-index --stat <copie avant> bin/voix.py` et `git diff --stat -- bin/dash.py` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/voix.py` | E | `_pid_dictee :~45-50`, `_etat_dictee :~53-57`, `etat`, `micro :~136` |
| `bin/dash.py` | E | `:1136` seulement (try séparé pour `voix`) |
| `vault/projets/agentx-voix/taches/T004-evaluer-t002/result.md` | L | verdict détaillé |
| `vault/projets/agentx-voix/taches/T002-serveur-voix-voix-py-api-voix-state-json-annonce/context.md` | L | DoD et contrats d'origine |
| `.cache/voix-eval-T004/robu.py` | L | tests de robustesse à rejouer |
| `.cache/T002/` | L | faux parle / dictee, stub notify-send |
| `.cache/voix-T008/` | E | banc, tests |

## Contrats
Motif de renvoi de T002 (évaluation T004, verbatim) :
```
voix.etat leve sur dictee.pid enorme (OverflowError) et dictee.etat binaire (UnicodeDecodeError) : state.json entier en erreur, immeuble roles taches perdus ; pid 0 ou -1 lu comme dictee vivant
bin/voix.py:45-50 : except (OSError, ValueError) ne couvre pas OverflowError, et pid ≤ 0 est accepté
bin/voix.py:53-57 : except OSError ne couvre pas UnicodeDecodeError
bin/dash.py:1136 : même try que construire_etat, donc tout l'état est perdu
non exécuté (danger) : pid -1 ⇒ micro() → os.kill(-1, SIGUSR1) (bin/voix.py:136) = tous les processus de l'utilisateur
```
`state.voix` = `{"mode","parle","en_cours","dictee","ecoute": bool, "journal": [...]}` ; panne → `null`.

## Décisions actées
- jamais faire parler la machine ; jamais toucher l'état voix réel (`~/.cache/claude-voix-on`, `parle.sock`, `dictee.*`, journal) ; tout test sous `AGENTX_VOIX_DIR` jetable
- 0 changement d'API (`etat`, `journal`, `mode`, `taire`, `micro`, `phrase`, `annoncer`)

## Hors périmètre
- `dash/*` (T005 en cours), `bin/parle*`, `bin/dictee`, `bin/sonnerie.py`, `bin/vx.py`

## Environnement
- banc : `B=.cache/voix-T008/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; recopier tes fichiers avant chaque essai ; `http://127.0.0.1:7819`
- `PATH=.cache/T002/stub:$PATH` ; `rg` absent du PATH de `bash -c` : utiliser `grep -nE` ; dossiers jetables nommés (le `rm` d'un script peut être refusé)
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/voix-T008/banc)`, `Bash(git diff:*)`, `Bash(time:*)`, `Bash(grep:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T008
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
