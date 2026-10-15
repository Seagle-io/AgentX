---
pack: T002
projet: agentx-voix
role: implementeur
cree: 2026-10-15
---

# Pack T002 — Serveur voix : voix.py, /api/voix, state.json, annonces

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `bin/voix.py` (stdlib) qui parle le protocole fichiers/socket de la voix, l'exposer dans `state.json` et `POST /api/voix/*` de `bin/dash.py`, et faire annoncer par `bin/sonnerie.py` chaque agent qui rend.

## Definition of Done
- [ ] `voix.phrase` : les 5 exemples du § Contrats → chaînes exactes (script `.cache/T002/phrases.py`, sortie collée)
- [ ] `AGENTX_VOIX_DIR=$V python3 $B/bin/dash.py --port 7790 --no-open` : `curl -s :7790/state.json | jq -c .voix` → 6 clés : 5 booléens du contrat + `journal` (liste) (avec faux parle + faux dictee : `parle` et `dictee` true)
- [ ] POST `/api/voix/mode` `{"on":true}` + jeton → 200 `{"ok":true,"voix":{…"mode":true…}}` et `$V/claude-voix-on` existe ; `{"on":false}` → flag absent + `{"cmd": "stop"}` reçu par le faux parle
- [ ] POST sans jeton → 403 ; `{"on":"oui"}` → 400 ; `/api/voix/xyz` → 400 ; `/api/voix/micro` sans démon dictee → 400 `{"erreur":"dictee n'est pas lancé"}`
- [ ] `/api/voix/micro {"on":true}` avec faux dictee `etat=off` → 1 SIGUSR1 reçu ; réponse `ecoute: true` ; `/api/voix/stop` → `{"cmd": "stop"}` reçu
- [ ] sonnerie banc, flag ON : stdin SubagentStop (§ Contrats) → faux parle reçoit `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` ; flag OFF → 0 message ; socket absent → exit 0 en < 1,5 s (`time`)
- [ ] `rg -n "import voix|voix\.etat\(\)|/api/voix/" bin/dash.py` → ≥ 3 lignes ; `rg -n "voix.annoncer" bin/sonnerie.py` → 1 ligne
- [ ] `CLAUDE.md` : la puce du § Contrats insérée juste avant `- La session chef de la salle vit` (`CLAUDE.md:50`) ; `git diff --stat -- CLAUDE.md` → 1 file, +N lignes, 0 suppression
- [ ] serveur de test tué par pid, `ss -ltn | rg 7790` → ∅ en fin
- [ ] journal parlé : `voix.journal(n: int = 30) -> list[dict]` lit `CACHE/claude-voix-journal.jsonl` (écrit par le hook T001), renvoie les n dernières lignes valides `{"t","texte"}` (ligne invalide sautée, fichier absent → `[]`, jamais d'exception) ; `state.json` `voix.journal` = `voix.journal(30)` (6e clé, liste) ; preuve : `$V` jetable avec 3 lignes + 1 ligne corrompue → `curl … | jq '.voix.journal | length'` → 3
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/voix.py` | E | nouveau module |
| `bin/dash.py` | E | imports `:31-39` · `do_GET :1125-1144` (`etat["jeton"] = JETON` :1134) · `do_POST :1175-1198` |
| `bin/sonnerie.py` | E | `main() :67-101` — annonce après l'écriture |
| `CLAUDE.md` | E | 1 puce avant `:50` |
| `bin/roles.py` | L | `role(cle) -> Role \| None :137` ; `Role.nom` |
| `.cache/T002/` | E | faux parle, faux dictee, scripts, logs |
| `.cache/banc-T002/` | E | copie jetable de bin/dash/roles.json/.claude/agents |

## Contrats
Dossier d'état (mêmes fichiers que `bin/parle` et `bin/dictee`, T001 en parallèle) :
```python
CACHE = Path(os.path.expanduser(os.environ.get("AGENTX_VOIX_DIR") or "~/.cache"))
# claude-voix-on (flag mode) · parle.sock (démon parle) · dictee.mute (parle parle si mtime < 60 s)
# dictee.pid (pid démon dictee) · dictee.etat ("on" | "off", absent = inconnu)
```
Socket parle : AF_UNIX SOCK_STREAM, `connect` → `sendall(json.dumps(msg)+"\n")` → `close`, timeout 1 s :
```json
{"cmd": "say", "text": "…"}   {"cmd": "stop"}   {"cmd": "ping"}
```
`bin/voix.py` — API (aucune fonction ne lit l'environnement à l'import ; `CACHE` relu à chaque appel) :
```python
def etat() -> dict      # jamais d'exception
    # {"mode": flag existe, "parle": ping socket OK, "en_cours": dictee.mute existe et âge < 60 s,
    #  "dictee": pid de dictee.pid vivant (os.kill(pid, 0)), "ecoute": dictee vivant et dictee.etat == "on"}
def mode(on: bool) -> dict    # crée/supprime le flag ; off ⇒ envoie stop (erreur ignorée) ; notify-send ; → etat()
def taire() -> dict           # envoie stop (erreur ignorée) → etat()
def micro(on: bool) -> dict   # dictee mort ⇒ ValueError("dictee n'est pas lancé")
                              # dictee.etat absent ⇒ ValueError("état inconnu — relance dictee")
                              # etat != voulu ⇒ os.kill(pid, SIGUSR1) puis attend ≤ 300 ms (pas 50 ms) dictee.etat == voulu → etat()
def phrase(ev: dict) -> str   # texte d'annonce
def annoncer(ev: dict) -> bool  # flag absent ou phrase "" ⇒ False ; sinon say ; True si envoyé ; ne lève JAMAIS
```
notify-send (mêmes args que `bin/parle`, absent ⇒ ignoré) :
```python
["notify-send", "-a", "Claude", "-i", "audio-speakers" | "audio-volume-muted", "-t", "1500",
 "-h", "string:x-canonical-private-synchronous:parle", "Voix de Claude",
 "🔊 Mode vocal activé" | "🔇 Mode vocal désactivé"]
```
`phrase(ev)` — nom = `roles.role(ev["role"]).nom` (`"IMPLÉMENTEUR"`) ; ≤ 4 car. tel quel, sinon `.capitalize()` ; rôle inconnu → `ev["role"]` ; vide → `Un agent`. tâche = `tâche {int(tid[1:])}` si `^T\d{3}$`. étage = `, étage {projet.replace("-", " ")}` si projet. Exemples exacts :
```
{"quoi":"agent-fini","role":"implementeur","tid":"T019","projet":"orthopro","verdict":""} → "Implémenteur : tâche 19 livrée, étage orthopro."
{"quoi":"agent-bloque","role":"testeur","tid":"T004","projet":"agentx-voix","verdict":""} → "Attention : Testeur bloqué sur la tâche 4, étage agentx voix."
{"quoi":"agent-fini","role":"evaluateur","tid":"T003","projet":"","verdict":"virer"} → "Évaluateur : verdict virer sur la tâche 3."
{"quoi":"agent-fini","role":"scribe","tid":"","projet":"","verdict":""} → "Scribe a terminé."
{"quoi":"agent-fini","role":"rssi","tid":"T010","projet":"x","verdict":""} → "RSSI : tâche 10 livrée, étage x."
```
`state.json` (do_GET, après `etat["jeton"] = JETON`, démo comprise) :
```json
"voix": {"mode": false, "parle": true, "en_cours": false, "dictee": true, "ecoute": false}
```
`POST /api/voix/<action>` — même garde que `/api/term/*` (hôte local, en-tête `X-AgentX-Jeton`, corps JSON ≤ 64 Ko) :
```
mode   {"on": bool}  → 200 {"ok": true, "voix": etat}
stop   {}            → 200 {"ok": true, "voix": etat}
micro  {"on": bool}  → 200 {"ok": true, "voix": etat}
on non booléen → 400 {"erreur": "on attendu : true|false"} · action inconnue → 400 {"erreur": "route inconnue : <action>"}
ValueError de voix.micro → 400 {"erreur": <message>}   (except ValueError existant de do_POST)
```
sonnerie.py, fin de `main()` après le `try/except OSError` d'écriture :
```python
    try:
        import voix
        voix.annoncer(ev)
    except Exception:
        pass      # une annonce perdue ne doit jamais arreter un agent
```
stdin de test sonnerie (`$B` sans projet orthopro ⇒ pas d'étage) :
```json
{"agent_type": "implementeur", "last_assistant_message": "---\ntache: T019\nprojet: orthopro\nstatut: fait\n---\n## Livré"}
```
Puce CLAUDE.md, verbatim :
```
- Voix (`bin/voix.py`, état dans `AGENTX_VOIX_DIR`, défaut `~/.cache`) : `state.json` porte `voix` ;
  la page bascule le mode vocal, coupe la parole et la dictée par `POST /api/voix/{mode,stop,micro}`
  (hôte local + jeton). Mode vocal ON ⇒ `sonnerie.py` fait aussi annoncer par `parle` chaque agent
  qui rend. Démons `bin/parle` (Piper) et `bin/dictee` (Whisper) ; hooks voix globaux (`bin/parle_hook.py`).
```

## Décisions actées
- protocole fichiers/socket direct, pas d'appel à `bin/parle` — T001 en parallèle, 0 sous-processus
- un interrupteur unique : flag = voix du chef + annonces — brief, hypothèse retenue
- annonce côté hook, pas côté page — parle même page fermée, 0 doublon d'onglets
- aucun texte libre client → parle — seuls mode/stop/micro exposés

## Hors périmètre
- `dash/*` (front = T005) ; `/api/run` et `executer` inchangés
- `bin/parle`, `bin/dictee`, `bin/parle_hook.py`, `~/.local/bin/*` (T001)
- refactor de `do_POST` au-delà de l'ajout de la route

## Environnement
- banc : `B=.cache/banc-T002; mkdir -p $B/.claude; cp -r bin dash roles.json $B/; cp -r .claude/agents $B/.claude/; python3 $B/bin/vx.py init` ; `V=$B/v`
- faux parle `.cache/T002/faux_parle.py` : écoute `$V/parle.sock`, ajoute chaque ligne reçue à `$V/recu.jsonl` ; faux dictee : écrit son pid dans `$V/dictee.pid`, `dictee.etat`, compte les SIGUSR1 et bascule `dictee.etat`
- stub `notify-send` (`exit 0`) en tête de PATH pour tout test de `mode`
- jamais `AGENTX_VOIX_DIR` absent en test : sinon flag, socket, dictee RÉELS (démons de l'humain en marche, la machine parlerait)
- sonnerie testée depuis `$B/bin/sonnerie.py` uniquement : la vraie écrit `run/evenements.jsonl` → bip dans la salle réelle
- salle réelle (7777) non relancée par l'agent ; test sur 7790, port vérifié libre avant
- `jq`, `curl`, `ss` présents ; python3 3.14
- `dash/dash.js` déjà `M` (autre projet) : HP, ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(python3, curl, jq, ss, rg, cp, mkdir, kill <pid de test>, time, git diff --stat -- CLAUDE.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T002
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
