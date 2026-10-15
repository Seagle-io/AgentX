---
pack: T027
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T027 — Branche git de travail affichée sur chaque étage

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Afficher sur chaque étage de la salle (liste `#im-etages` + tour iso) la branche git courante de chaque dépôt du produit, lue dans `.git/HEAD` par `bin/dash.py` (`etages[].depots`), avec un repère quand elle ≠ branche de publication.

## Definition of Done
- [ ] serveur : `python3 bin/dash.py --json | python3 -c '…'` → par étage `[(nom, branche, publication, ecart)]` collé ; attendu réel : kora `ortho-front master master False`, `ortho-back master master False` · geolens `geolens-web-feat-viewer-online master …` · agentx `AgentX master …` · seagle `seagle-website feat/ascii-nuit-etoilee main True`
- [ ] `_branche()` sur banc : HEAD détaché → `détachée <sha7>` ; chemin absent → `etat "ko"`, `branche ""` ; `.git` fichier (`gitdir: …`, worktree) → branche lue ; 0 `subprocess` dans le code ajouté (`grep -n subprocess` du diff → ∅)
- [ ] mode projets (banc sans `produits.json`) : `depots` = `depot:` du brief (1 élément, `publication ""`, `ecart False`) ou `[]` si vide
- [ ] perf §C7 (`vault/projets/agentx-immeuble/contrat.md:242-251`) : chaud médiane ≤ 120 ms, froid ≤ 600 ms, collée
- [ ] front, Chromium sur banc :7830 (copie `bin dash roles.json produits.json`, vault en lien) : chaque `.im-etage` contient `.im-branche` au texte attendu ; seagle `.im-branche.ecart` ; `title` liste `nom · branche (publication X)` ; plaque de la tour `É1 · Seagle · ⎇ feat/ascii-…` ; 390 px `scrollWidth == 390` ; captures 1280 + 390 dans `.cache/seagle-T027/`
- [ ] correctif T026 : `<g class="tour-etage">` n'a plus qu'1 attribut `style` (`--c` et `--retard` fusionnés) → `grep -c 'style=' ` sur le gabarit collé
- [ ] `node --check dash/dash.js` → ∅ ; `python3 -m py_compile bin/dash.py` rc 0 ; `python3 -m unittest discover -s tests` → OK ; `git diff --stat -- bin/dash.py dash/` collé

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | E | `_bloc_produit` :450 (pur, ne pas y lire) · `_etage` :487 · `construire_etat` :575-660 (`aggs` :598, `etages` :649) |
| `dash/dash.js` | E | `rendreImmeuble` :1121 (ligne étage :1140-1158) · tour :1418-1432 · sig `rendreTour` :1468 |
| `dash/dash.css` | E | `.im-nom` :89 ; nouvelle `.im-branche` |
| `bin/produits.py` | L | `Produit.depots: tuple[Depot]` ; `Depot(chemin, branche_publication, ui)` |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C7 perf L242-251 |
| `.cache/seagle-T027/` | E | banc, script Playwright, PNG |

## Contrats
Forme ajoutée (clés existantes inchangées) :
```
etages[].depots: [{"nom": str,            # basename du chemin
                   "chemin": str,         # expanduser
                   "branche": str,        # "master" | "détachée 1a2b3c4" | "" (ko)
                   "publication": str,    # Depot.branche_publication ; mode projets ""
                   "ecart": bool,         # publication != "" and branche not in ("", publication)
                   "etat": "ok"|"ko"}]    # ko = pas de .git lisible
```
```python
def _branche(chemin: str) -> str | None   # lit <chemin>/.git/HEAD (ou .git fichier "gitdir: X" → X/HEAD) ; "ref: refs/heads/B" → B ; sha → "détachée "+sha[:7] ; illisible → None ; 0 subprocess
def _depots(prod: "produits.Produit | None", bmeta: dict) -> list[dict]   # prod → prod.depots ; None → brief `depot:` si non vide
```
- appel dans `construire_etat` après `aggs` (`_bloc_produit` reste pur, 0 IO) ; lu à chaque poll (pas de cache : une bascule de branche apparaît en ≤ 2 s)
Front :
```
ligne étage : <span class="im-nom">Kora <span class="im-branche[ ecart]" title="…">⎇ master</span></span>
  branches toutes égales → 1 libellé ; sinon "nom1 b1 · nom2 b2" ; [] → rien ; etat ko → "⎇ ?"
  ecart → couleur COULEUR_PRIO[2] (#ffcc33) ; ellipsis, jamais de débordement
tour : texte plaque = `É${num} · ${titre} · ⎇ ${branche}` passé à courtT existant ; sig rendreTour += branches
```

## Décisions actées
- source des dépôts d'un étage = `produits.json` (registre), pas les briefs ; mode projets = brief `depot:`
- lecture git par fichier `.git/HEAD`, jamais `git` en sous-processus (budget perf)
- demande humaine 2026-10-16 : « dans chaque étage, la branche sur laquelle on travaille »

## Hors périmètre
- `bin/supervision.py`, `supervision.json`, `produits.json`, `bin/produits.py` (écriture) ; relancer la salle réelle :7777 (le chef le fera)
- avance/retard, fichiers modifiés (déjà dans supervision)

## Environnement
- banc : `B=.cache/seagle-T027/banc; rm -rf $B; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` puis `python3 $B/bin/dash.py --port 7830 --no-open` ; recopier `bin dash` après chaque édition ; kill par pid noté (jamais `pkill -f`)
- Playwright : `import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'` ; jamais `playwright install` ; modèle `.cache/seagle-eval-T026/eval.mjs` (1 lecture tolérée)
- `garde_bash` refuse push/migrations ; sorties `| tail -n 40`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Write (`.cache/seagle-T027/`, `result.md`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T027/banc)`, `Bash(grep:*)`, `Bash(git diff:*)`, `Bash(git -C:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T027
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
