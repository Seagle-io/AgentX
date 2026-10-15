---
pack: T028
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T028 — Evaluer T027 (branche par étage)

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable T027 (`bin/dash.py` `_branche`/`_depots`/`etages[].depots` ; `dash/dash.js`, `dash/dash.css` : branche git sur chaque étage) contre la DoD de SON pack → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T027-branche-git-de-travail-affichee-sur-chaque-etage/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par TOI (ton banc, ton script)
- [ ] bascule réelle sans toucher aux dépôts : dépôt git jetable `.cache/eval-T028/depot` (`git init`, 1 commit) déclaré dans un `produits.json` de banc → `git -C <jetable> switch -c essai` → la salle de banc affiche `⎇ essai` en ≤ 4 s, sans relance
- [ ] hostiles `_branche` : `.git/HEAD` vide, `ref:` sans `refs/heads/` (ex. `ref: refs/remotes/x`), `gitdir:` vers chemin absent, branche de 80 car. → 0 exception, rendu borné (390 px `scrollWidth == 390`)
- [ ] captures `.cache/seagle-T027/cap-1280.png`, `cap-390.png` regardées (Read) : branche lisible, rien de coupé hors ellipsis → constat 1 ligne chacune
- [ ] isolation : `md5sum bin/dash.py dash/dash.js dash/dash.css produits.json` avant == après ; `git -C <d> status --porcelain | md5sum` des 5 vrais dépôts avant == après ; ports de banc → 000
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T027-branche-git-de-travail-affichee-sur-chaque-etage/context.md` | L | DoD + contrat de référence |
| `vault/projets/seagle-pilotage/taches/T027-branche-git-de-travail-affichee-sur-chaque-etage/result.md` | L | affirmations |
| `bin/dash.py` | L | livrable (`_branche` :488, `_depots` :507) |
| `dash/dash.js` | L | livrable |
| `dash/dash.css` | L | livrable |
| `.cache/seagle-T027/` | L | captures, script T027 (modèle, pas preuve) |
| `.cache/eval-T028/` | E | bancs, dépôt jetable, script |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T028 · projet: seagle-pilotage · statut · evalue: T027 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.
5 vrais dépôts : `~/Documents/Workspace/OrthoPro/ortho-front`, `~/Documents/Workspace/OrthoPro/ortho-back`, `~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`, `~/Documents/Workspace/AgentX`, `~/Documents/Workspace/seagle-website` — lecture seule.
`produits.json` (forme d'un produit) : `{"cle","nom","sous","couleur","entreprise","etat":"actif","env","depots":[{"chemin","branche_publication","ui":[]}],"site","marketing","sources"}` — partir d'une copie du vrai et ne changer que `depots` d'un produit.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- troncature `courtT` par segment (titre 30, branche 24) sur la plaque : acceptée
- champ brief `depot` lu via `champ()` : accepté

## Hors périmètre
- toute écriture dans `bin/*`, `dash/*`, `produits.json` réels ou dans les 5 vrais dépôts (aucun `switch`, `checkout`, `commit` hors du dépôt jetable) ; relancer :7777

## Environnement
- banc : `B=.cache/eval-T028/banc; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` puis `python3 $B/bin/dash.py --port 7831 --no-open` ; kill par pid noté (jamais `pkill -f`)
- Playwright : `import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'` ; jamais `playwright install`
- `garde_bash` refuse push/migrations/git destructif ; sorties `| tail -n 40`

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T028/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(md5sum:*)`, `Bash(git -C .cache/eval-T028/depot:*)`, `Bash(git init:*)`, `Bash(git -C:*)` (status/branch seulement sur les vrais), `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections de « Contrats ».
