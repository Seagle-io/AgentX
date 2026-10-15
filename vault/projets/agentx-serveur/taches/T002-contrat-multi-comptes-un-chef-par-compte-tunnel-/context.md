---
pack: T002
projet: agentx-serveur
role: architecte
cree: 2026-10-16
---

# Pack T002 — Contrat : multi-comptes, un chef par compte, tunnel SSH + GitHub

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `vault/projets/agentx-serveur/contrat.md` : comment AgentX passe d'1 utilisateur local à N comptes sur un serveur (Julien, Sylvain), avec 1 session chef par compte (1 terminal web par compte), accès par tunnel SSH + identité GitHub Seagle-io, vault partagé, sans casser l'usage local actuel — découpé en lots.

## Definition of Done
- [ ] § C0 options : ≥ 2 pour l'identité (ex. en-tête posé par un proxy OAuth `oauth2-proxy` derrière le tunnel · OAuth GitHub géré par dash.py · utilisateur Unix SSH = identité) et ≥ 2 pour l'isolation des chefs (1 utilisateur Unix par compte · 1 conteneur par compte · 1 démon terminal par compte dans le même utilisateur) ; tableau coût now / 1 an / rend impossible ; choix motivé
- [ ] § identité : d'où vient le compte (`login GitHub`), comment `bin/dash.py` le reçoit et le vérifie, liste blanche (membres Seagle-io), jeton de page par compte (≠ jeton global actuel), sessions et expiration
- [ ] § terminaux : `bin/terminal.py` aujourd'hui = 1 démon, 1 socket (`_chemin_socket(cwd)`) → 1 démon/socket PAR compte ; routes `/api/term/*` qui ne servent QUE la session du compte connecté ; arrêt/relance par compte ; quota et coût Claude par compte (NV : ce que Claude Code permet)
- [ ] § coordination des chefs sur 1 vault : `verrou` existant (flock par projet), règle « 1 fichier E = 1 tâche en-cours » (contrat seagle §C8), qui voit quoi dans la salle (tout le vault, actions tracées avec le compte : `journal.md` gagne l'auteur)
- [ ] § compat locale : mode local inchangé (127.0.0.1, 1 compte implicite) ; un drapeau / une config active le mode serveur
- [ ] § exigences de sécurité : le RSSI (T001, en parallèle) écrit `vault/projets/agentx-serveur/risques.md` avec des exigences `EX-xx` ; si présent à la fin de ta tâche, chaque `EX` bloquante est couverte par une section du contrat (table EX → §) ; sinon, liste des points à réconcilier en `## Pour la suite`
- [ ] § lots : chacun rôle, WL ≤ 12 fichiers, E disjoints, DoD vérifiables, dépendances ; lot devops (hébergement, tunnel, proxy, service systemd) séparé ; 0 lot avant la fin de Seagle et de la console vocale (cadrage humain)
- [ ] `decisions.md` : 1 entrée append (Décision · Écarté · Conséquence · À revoir si) ; `contrat.md` ≤ 350 lignes ; 0 section vide ; marqueur de lint jamais écrit en clair
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-serveur/contrat.md` | E | livrable (neuf) |
| `vault/projets/agentx-serveur/decisions.md` | E | append seulement |
| `vault/projets/agentx-serveur/risques.md` | L | exigences du RSSI (T001 en parallèle, peut être absent) |
| `bin/dash.py` | L | garde HTTP, jeton, routes, `construire_etat` |
| `bin/terminal.py` | L | démon, socket, `CONSIGNE_CHEF` |
| `bin/vx.py` | L | `verrou`, `journaliser` |
| `bin/agentx` | L | démarrage, épingle, stop/statut |
| `.claude/settings.json` | L | hooks |
| `CLAUDE.md` | L | règles |

## Contrats
Cadrage humain : 1 chef par compte (pas de chef partagé) ; tunnel SSH + compte GitHub Seagle-io ; étude maintenant, code après.
Aujourd'hui : salle `127.0.0.1:7777`, garde `Host` local + en-tête `X-AgentX-Jeton: <jeton>` (jeton tiré au démarrage, dans `state.json`) ; terminal = démon `bin/terminal.py --daemon`, socket unix `~/.local/state/agentx-chef.sock` (1 seul) ; `garde_bash` refuse push/migrations/git destructif ; `garde_dispatch` refuse un Agent sans tâche vault.

## Décisions actées
- règle « un seul chef » devient « un chef par compte » — les chefs se coordonnent par le vault, jamais l'un par l'autre
- 0 donnée patient Kora sur le serveur sans décision humaine
- jamais push, jamais migration par un agent

## Hors périmètre
- code ; choix de l'hébergeur ; analyse de risques (T001)

## Environnement
- l'architecte n'a PAS l'outil Bash : 0 mesure, lectures seulement (Read/Grep/Glob, WebSearch/WebFetch pour la doc oauth2-proxy, GitHub OAuth, OpenSSH)
- skill `langage-dense` : contrat dense

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit, WebSearch, WebFetch
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T002
projet: agentx-serveur
statut: fait | bloque
---
## Livré
- contrat.md:L1-L2 — § (≤ 8 mots)
## Vérifié comment
lectures (chemin:L), références (URL + date)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : lots, ordre, questions humaines restantes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
