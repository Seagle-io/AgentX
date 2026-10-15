---
pack: T016
projet: agentx-immeuble
role: verificateur
cree: 2026-10-15
---

# Pack T016 — Casser la vue d'ensemble animée dans Chromium

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire tomber la vue d'ensemble animée (`svg#tour`) et sa bascule avec la salle d'étage dans un vrai Chromium, sur banc multi-projets à vault jetable qui vit pendant le test ; rendre `CONFORME` ou `DÉFAUTS` avec repro.

## Definition of Done
- [ ] banc monté avec `.cache/banc-T009/setup.py` (projets alpha, beta, gamma dormant, delta clos, archive) + dash = instantané `.cache/snap-T011/dash`
- [ ] script `$B/e2e-T016.mjs`, sortie collée, couvrant :
  - W1 vie : pendant que la tour est affichée, passer des tâches `en-cours` / `fait` / `bloque` dans le banc (`vx.py set`) → mascottes et gyrophares suivent en ≤ 2 polls ; 0 mascotte fantôme après `fait`
  - W2 projets : créer puis clore un projet → étage apparaît puis descend au sous-sol ; 12 projets → tour lisible, 0 débordement
  - W3 bascule : tour → clic étage → étage → bouton ⌂ → tour → bouton retour navigateur ; 5 allers-retours rapides → état final cohérent (hash ↔ vue ↔ `#projet-nom`) ; 0 action envoyée pendant la bascule
  - W4 contenu hostile : titre de projet avec `<script>`, `"`, emoji, 200 car. ; rôle inconnu dans `agents` → 0 XSS, 0 erreur console, rendu tronqué propre
  - W5 ressources : 5 min de polls (ou 150 cycles accélérés) → nœuds DOM de `#tour` stables (± 5 %), mémoire JS stable (`performance.memory` si dispo) ; onglet caché puis rendu → pas de rafale d'animations
  - W6 accessibilité : Tab traverse les étages de la tour, Entrée ouvre, Échap / ⌂ revient ; `prefers-reduced-motion` → 0 animation
  - W7 390 px et 1600 px : captures, `scrollWidth` ≤ largeur
- [ ] captures `$B/T016-*.png` listées
- [ ] chaque défaut : `scénario · attendu · obtenu · repro · chemin:L probable`
- [ ] fin : salle-banc tuée par pid, `curl` → 000 ; vrai vault intact (`git status --short vault/` : seulement ton result.md et les fichiers du chef)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/banc-T016i/` | E | banc jetable complet |
| `.cache/banc-T009/setup.py` | L | montage multi-projets |
| `.cache/snap-T011/dash/` | L | livrable (instantané) ; localiser un défaut |
| `vault/projets/agentx-immeuble/taches/T011-vue-d-ensemble-animee-open-space-de-l-immeuble-e/result.md` | L | « Pour la suite » = scénario navigateur |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1 L23-77 · §C3 L93-115 |
| `bin/dash.py` | L | localiser un défaut serveur |

## Contrats
CLI banc :
```
python3 $B/bin/vx.py projet <slug> --titre "<t>"
python3 $B/bin/vx.py tache "<titre>" --projet <slug> --role implementeur
python3 $B/bin/vx.py set T001 --statut pret|en-cours|revue|bloque --projet <slug>
```
`pret` exige un pack lintable (9 sections dans l'ordre, cf. `vault/_templates/context.md`) ; clore = `statut: clos` dans le brief.md du banc.
GET `/state.json?projet=<slug>` ; hash `#/<slug>` = vue ÉTAGE, hash vide = vue IMMEUBLE.

## Décisions actées
- banc jetable seulement — vrai vault jamais muté ; tu ne corriges rien ; verdict binaire `CONFORME | DÉFAUTS`

## Hors périmètre
- `/api/term/*` réel (simuler) ; salle réelle :7777 ; modifier hors `.cache/banc-T016i/` et ton `result.md`

## Environnement
Banc : `B=.cache/banc-T016i; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r .cache/snap-T011/dash $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis `setup.py` (adapter le chemin) ; `python3 $B/bin/dash.py --port 7810 --no-open &`
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`) ; `/api/run` NON intercepté
- `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, chacune journalisée dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, Write (banc + result.md), `Bash(python3:*)`, `Bash(node:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T016i)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git status:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T016
projet: agentx-immeuble
statut: fait | bloque
---
## Livré
- verdict : CONFORME | DÉFAUTS (n)
- D1 · scénario · attendu · obtenu · repro · chemin:L
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts recopiables tels quels dans un pack correctif
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
