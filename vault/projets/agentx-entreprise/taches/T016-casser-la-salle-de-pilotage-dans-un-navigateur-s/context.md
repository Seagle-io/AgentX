---
pack: T016
projet: agentx-entreprise
role: verificateur
cree: 2026-10-15
---

# Pack T016 — Casser la salle de pilotage dans un navigateur, sur banc

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire tomber le poste de pilotage de bout en bout (page → `/api/run` → `vx` → vault → page) dans un vrai Chromium, sur une salle-banc à vault jetable ; rendre `CONFORME` ou `DÉFAUTS` avec repro.

## Definition of Done
- [ ] banc monté (cf. Environnement) ; projet `banc` avec ≥ 1 tâche par statut : a-faire, pret, en-cours, revue (implementeur), revue + évaluation `fait` verdict `virer`, fait, bloque
- [ ] salle-banc lancée : `python3 $B/bin/dash.py --port 7793 --no-open &` ; `curl -s 127.0.0.1:7793/state.json | python3 -c …` → 13 rôles, `taches[].actions` présents
- [ ] script Playwright `$B/e2e-T016.mjs` (chromium headless) exécuté, sortie collée, couvrant :
  - S1 rendu : 13 cartes `#deck`, 12 bureaux dans `#room`, `#rh` rempli, 0 erreur console (`page.on('console')`/`pageerror`)
  - S2 virer par la ligne de tâche : clic `.tbtn[data-act=virer]` → `#saisie-motif` prérempli → vider + Entrée → 0 requête `/api/run` ; motif + Entrée → requête `virer` 200 ; après `charger()` : tâche `rejete`, remplaçante visible, lint FAIL
  - S3 retenir depuis la todo : item « Retenir … » ▶ lancer → statut `fait`
  - S4 palette : Ctrl+K ouvre, « vir » filtre, ↓ Entrée, Échap ferme ; Ctrl+K focus dans `.xterm-helper-textarea` → ignoré
  - S5 tiroir : Ctrl+` bascule `.ouvert` ; rechargement → état conservé ; `#term` jamais `display:none`
  - S6 refus serveur : POST direct `/api/run` `{"action":"set","statut":"rejete"}` → refus ; `{"action":"virer","motif":"a\nb"}` → refus ; `{"action":"retenir",…,"sans_eval":true}` → pas de `--sans-eval` dans `commande`
  - S7 largeur 390 px : 0 scroll horizontal (`document.documentElement.scrollWidth <= 390`)
- [ ] captures `$B/T016-*.png` (pleine page 1600 px, tiroir ouvert, palette ouverte, 390 px) : chemins listés
- [ ] chaque défaut : `scénario · attendu · obtenu · repro (commande) · chemin:L probable`
- [ ] fin : salle-banc tuée par pid, port 7793 libre (`curl` → 000) ; vrai vault intact : `git status --short vault/projets/agentx-entreprise` ne montre que ton `result.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/banc-T016/` | E | banc jetable complet |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C5 L152-276 (CLI) · §C7-C9 L315-468 (état, actions, front) : le comportement attendu** |
| `vault/projets/agentx-entreprise/taches/T011-l4-poste-de-pilotage-actions-par-tache-palette-k/result.md` | L | « Pour la suite » = scénario navigateur |
| `dash/dash.js` | L | localiser un défaut |
| `bin/dash.py` | L | localiser un défaut |
| `bin/vx.py` | L | localiser un défaut |

## Contrats
Requête page → serveur :
```
POST /api/run  headers: Content-Type: application/json, X-AgentX-Jeton: <state.json.jeton>
body {action, projet, tid?, statut?, motif?, role?, modele?}  → {commande, code, out, err}
POST exige Host local ; corps ≤ 65536
```
CLI banc (créer les fixtures) :
```
python3 $B/bin/vx.py projet banc --titre "Banc"
python3 $B/bin/vx.py tache "<titre>" --projet banc --role implementeur [--dep T001]
python3 $B/bin/vx.py set T001 --statut pret|en-cours|revue|bloque --projet banc
python3 $B/bin/vx.py tache "Evaluer T00x" --projet banc --role evaluateur --dep T00x
```
`set fait` d'un implementeur est refusé (livre en revue) : pour une tâche `fait`, prendre un rôle `eclaireur`. Pack non vide requis pour `pret` (copier un context.md lintable d'un exemple que tu écris dans le banc). Évaluation : écrire `result.md` de la tâche evaluateur avec frontmatter `verdict: virer` et `## Motif` 1 ligne, puis `set --statut fait`.

## Décisions actées
- banc jetable seulement — vrai vault jamais muté
- verdict binaire `CONFORME | DÉFAUTS` — pas de « globalement bon »
- tu ne corriges rien

## Hors périmètre
- Boutons ▶ lancer / ■ arrêter du terminal : la salle-banc partage le socket `~/.local/state/agentx-chef.sock` avec la vraie session chef → NE PAS cliquer, NE PAS POST `/api/term/*` (sauf `etat` en lecture)
- Salle réelle (:7777) : ne pas la lancer ni l'arrêter
- Modifier un fichier hors `.cache/banc-T016/` et ton `result.md`

## Environnement
Banc : `B=.cache/banc-T016; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`
- `ROOT` des scripts = dossier parent de `bin/` → la salle-banc lit `$B/vault` ; `supervision.json` absent → panneau « aucune source » (normal)
- Playwright : pas installé dans AgentX ; existant `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0) → `NODE_PATH=…/node_modules node $B/e2e-T016.mjs` ou `import` par chemin absolu ; navigateurs dans `~/.cache/ms-playwright` ; 0 `npm install` dans AgentX
- skill `webapp-testing` dispo (préchargé) : Python playwright ABSENT → utiliser Node
- `node` v22, `google-chrome` dispo ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, chacune journalisée dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, Write (banc + result.md), `Bash(python3:*)`, `Bash(node:*)`, `Bash(NODE_PATH=*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T016)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git status:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T016
statut: fait | bloque
---
## Livré
- verdict : CONFORME | DÉFAUTS (n)
- D1 · scénario · attendu · obtenu · repro · chemin:L
## Vérifié comment
commande → sortie brute (script e2e, curl)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts recopiables tels quels dans un pack correctif
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
