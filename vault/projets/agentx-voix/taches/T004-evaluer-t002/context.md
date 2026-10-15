---
pack: T004
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T004 — Evaluer T002

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T002 (`bin/voix.py`, `state.voix` + journal parlé, `POST /api/voix/*` dans `bin/dash.py`, annonces dans `bin/sonnerie.py`) contre la DoD de SON pack, sur banc, sans jamais toucher l'état voix réel → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T002-serveur-voix-voix-py-api-voix-state-json-annonce/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi, avec `AGENTX_VOIX_DIR=.cache/voix-eval-T004/v` et faux `parle`/`dictee` (réutilisables : `.cache/T002/`)
- [ ] sécurité `/api/voix/*` : sans jeton → 403 ; Host non local → refus ; corps > 64 Ko → refus ; `{"on": "true"}`, `{"on": 1}`, `{}` → 400 ; 0 texte libre client transmis à `parle` (seul `say` vient de `annoncer`)
- [ ] `voix.etat()` et `voix.journal()` ne lèvent jamais : dossier absent, socket mort, `dictee.pid` corrompu, journal binaire → valeurs sûres (collé)
- [ ] `sonnerie` : jamais > 1,5 s même socket qui ne répond pas (faux serveur qui accepte sans lire) ; exception dans `voix` → agent jamais arrêté
- [ ] coût du poll : `state.json` ×20 → nombre de `ping` reçus par le faux parle et temps ajouté par `voix.etat()` (médiane ms) collés ; > 20 ms ⇒ à signaler
- [ ] non-régression : `immeuble`, `roles`, `taches` toujours présents dans `state.json` ; `py_compile` des 3 fichiers rc 0
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T002-serveur-voix-voix-py-api-voix-state-json-annonce/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T002-serveur-voix-voix-py-api-voix-state-json-annonce/result.md` | L | affirmations |
| `bin/voix.py` | L | livrable |
| `bin/dash.py` | L | livrable (`:36`, `:1136`, `:1177-1211`) |
| `bin/sonnerie.py` | L | livrable (`:101-105`) |
| `.cache/T002/` | L | faux parle / dictee, stub |
| `.cache/voix-eval-T004/` | E | banc, dossier voix jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T004
projet: agentx-voix
statut: fait | bloque
evalue: T002
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
`state.voix` = `{"mode","parle","en_cours","dictee","ecoute": bool, "journal": [{"t","texte"}] (30 max)}`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- jamais faire parler la machine ; jamais toucher `~/.cache/claude-voix-on`, `parle.sock`, `dictee.*`, `claude-voix-journal.jsonl` réels ; salle réelle :7777 : ne pas toucher

## Hors périmètre
- `dash/*` (T005 en parallèle), `bin/parle*`, `bin/dictee` (T001) ; écrire hors `.cache/voix-eval-T004/` et ton `result.md`

## Environnement
- banc : `B=.cache/voix-eval-T004/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; `AGENTX_VOIX_DIR=… python3 $B/bin/dash.py --port 7818 --no-open &` ; kill par pid ; utiliser `http://127.0.0.1:7818`
- `PATH=.cache/T002/stub:$PATH` (notify-send neutralisé) ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/voix-eval-T004/`), `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/voix-eval-T004/banc)`, `Bash(rg:*)`, `Bash(time:*)`, `Bash(ss:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T004-evaluer-t002/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
