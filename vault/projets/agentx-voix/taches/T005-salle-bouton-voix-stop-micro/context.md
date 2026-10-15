---
pack: T005
projet: agentx-voix
role: designer
cree: 2026-10-16
---

# Pack T005 — Salle : console vocale, bouton voix, stop, micro

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans la salle (`dash/*`), afficher la console vocale (les phrases que le chef a dites à voix haute, `state.voix.journal`) et ajouter les commandes 🔊 mode vocal, ■ stop, 🎙️ micro (POST `/api/voix/*`) — sans allonger la page.

## Definition of Done
- [ ] console vocale : panneau titré `CONSOLE VOCALE`, visible sans ouvrir le terminal, à côté du chef (tiroir ou colonne droite : à toi de trancher, capture à l'appui) ; entrées les plus récentes en haut, heure `HH:MM` + texte ; hauteur bornée, défilement interne ; 0 entrée → « rien dit pour l'instant » ; texte échappé (titre hostile `<script>` → affiché tel quel, 0 exécution) ; nouvelle phrase → la 1re ligne s'illumine 2 s
- [ ] hauteur de page identique (±2 px) avec 0 et 30 entrées (réécriture de la route `state.json`), à 1600×1000 et 1280×800 — mesures collées
- [ ] 🔊 bascule `voix.mode` (POST `/api/voix/mode {"on": !mode}`), état visible (allumé/éteint) ; ■ POST `/api/voix/stop` ; 🎙️ POST `/api/voix/micro {"on": !ecoute}` puis focus rendu à xterm ; boutons désactivés et titre explicatif si `parle` (resp. `dictee`) est false ; erreur 400 → message tel quel dans `#term-etat` ou équivalent, jamais `alert`
- [ ] `state.voix` absent (vieux serveur, démo) → panneau et boutons cachés, 0 erreur
- [ ] e2e `.cache/voix-T005/e2e.mjs` (Playwright) sur salle-banc : routes `/api/voix/*` INTERCEPTÉES et comptées (jamais le vrai serveur voix), `/api/term/*` simulé ; console 0/1/30 entrées, hostile, illumination ; 3 boutons → bonnes requêtes ; 390 px `scrollWidth <= 390` ; 0 erreur console ; captures `.cache/voix-T005/{console-1600,console-390}.png`
- [ ] `node --check dash/dash.js` rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ ; `git diff --stat -- dash/` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `rendre` · tiroir/terminal (`basculerTiroir`, `termEtat`) · nouvelles `rendreVoix`, `brancherVoix` · amorçage |
| `dash/index.html` | E | panneau console + boutons |
| `dash/dash.css` | E | `.voix-*` |
| `bin/dash.py` | L | `state.voix` (`:1136`), `_voix` (`:1177-1186`), garde POST (`:1190,1209-1211`) |
| `bin/voix.py` | L | `etat()`, `journal()` : forme exacte |
| `.cache/voix-T005/` | E | e2e, captures |

## Contrats
`state.json` (T002) :
```json
"voix": {"mode": false, "parle": true, "en_cours": false, "dictee": true, "ecoute": false,
         "journal": [{"t": "2026-10-16T09:41:07", "texte": "La première brique de votre console marche…"}]}
```
`journal` = 30 dernières lignes, ordre du fichier (la plus récente en DERNIER).
```
POST /api/voix/mode  {"on": bool} → 200 {"ok": true, "voix": {5 clés, sans journal}}
POST /api/voix/stop  {}           → 200 {"ok": true, "voix": …}
POST /api/voix/micro {"on": bool} → 200 … | 400 {"erreur": "dictee n'est pas lancé" | "état inconnu — relance dictee"}
garde : hôte local + en-tête X-AgentX-Jeton: ETAT.jeton, corps JSON
```
Erreurs 400 de `micro` à afficher telles quelles. Le démon dictee réel n'écrit pas encore `dictee.etat` (ancienne version lancée) → « état inconnu — relance dictee » attendu en réel.

## Décisions actées
- demande humaine 2026-10-16 : « les messages que tu me dis à voix haute, dans une petite console de l'interface AgentX »
- la page ne grandit jamais avec le contenu (leçon T010 immeuble) ; jamais `alert/confirm/prompt` ; texte toujours échappé
- 1 seul interrupteur : mode vocal = voix du chef ET annonces d'agents

## Hors périmètre
- `bin/*` (livrés par T001/T002) ; tour d'immeuble, coupe, palette (ne pas casser)
- faire parler la machine ; toucher `~/.cache/claude-voix-*` réels

## Environnement
- salle-banc : `python3 bin/dash.py --port 7817 --no-open &` avec `AGENTX_VOIX_DIR=.cache/voix-T005/v` (jetable : y écrire un `claude-voix-journal.jsonl` de test) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `page.route('**/api/voix/**', …)` et `**/api/run` interceptés ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`)
- skill `frontend-design` : même charte que la salle ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T005
projet: agentx-voix
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (e2e, mesures, captures)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
