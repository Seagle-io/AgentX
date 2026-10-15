---
pack: T019
projet: agentx-immeuble
role: designer
cree: 2026-10-15
---

# Pack T019 — Chef au dernier étage, pas sur le toit

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Installer le chef dans un étage de direction, le dernier étage de l'immeuble (au-dessus des étages de projets), au lieu de le poser sur le toit — dans la tour animée (`svg#tour`), la coupe-liste (`#im-toit`), les libellés de la todo et la consigne du chef — sans changer le serveur.

## Definition of Done
- [ ] tour (`construireTour`) : un niveau « direction » au-dessus de rang 0, même gabarit qu'un étage (dalle, murs, bureau), le chef = mascotte `COULEUR_ROLE.chef` assise à son bureau À L'INTÉRIEUR du niveau, animée comme un agent qui travaille quand `toit.chef.vivant === true`, éteinte/assoupie si `false`, grisée si `null` ; plus aucune mascotte posée sur le toit (le toit reste une simple couverture) ; plaque `É<n+1> · CHEF` (n = nb d'étages de projets) + état + `todo N · U urgent` ; clic / Entrée → `basculerTiroir(true)` (comme `#im-toit` aujourd'hui) ; ascenseur dessert ce niveau
- [ ] coupe-liste `#im-toit` : libellé `TOIT · CHEF` → `É<n+1> · CHEF` (n depuis `immeuble.etages.length`) ; pictogramme triangle (toit) → pictogramme bureau/étage ; position inchangée (en tête) ; `aria-label` « Dernier étage, chef de projet, <état> »
- [ ] todo : étiquette `toit` des items `projet ""` → `chef` (`etiquetteEtage`, classe CSS conservée ou renommée partout)
- [ ] `bin/terminal.py` `CONSIGNE_CHEF` : « tu es au toit » → « tu es au dernier étage » ; seul ce fragment change (`git diff -U0 bin/terminal.py` → 1 hunk) ; `python3 -m py_compile` rc 0
- [ ] commentaires « chef au toit » de `dash/index.html:14`, `dash/dash.css:48`, `dash/dash.js` (en-têtes de section) mis à jour ; `rg -n -i "toit" dash/ bin/terminal.py` → seulement le nom de clé `toit` (donnée serveur), les classes CSS internes si conservées, et la couverture du bâtiment : liste collée et justifiée
- [ ] 0 régression : `node .cache/eval-T015/e2e.mjs` adapté (attendu « TOIT · CHEF » → nouveau libellé) → 0 KO ; 3/8/12 étages + niveau direction : 0 chevauchement, tout dans le cadre ; 390 px `scrollWidth <= 390` ; `prefers-reduced-motion` → 0 animation
- [ ] captures `.cache/T019/tour-1600.png`, `tour-12.png`, `tour-390.png`, `coupe.png` listées ; `node --check dash/dash.js` rc 0 ; 0 erreur console
- [ ] `git diff --stat -- dash/ bin/terminal.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `etiquetteEtage ~:629-633` · `rendreImmeuble ~:1011-1030` · `brancherImmeuble ~:1087` · tour `~:1104-1360` (construireTour, niveauTour, rendreTour, brancherTour) |
| `dash/dash.css` | E | `.im-toit* :48-73,:130,:801` · `.ti-etage.toit :388-389` · `.tour-*` |
| `dash/index.html` | E | `:14-16` commentaire + `#im-toit` |
| `bin/terminal.py` | E | `:26` seulement |
| `.cache/eval-T015/e2e.mjs` | L | non-régression |
| `.cache/T019/` | E | banc, script, captures |

## Contrats
Données (inchangées, serveur) :
```
immeuble.toit = {"chef":{"vivant":true|false|null},"todo":int,"urgent":int,"etages":int,"dormants":int,"alerte":{"niveau":""|"sonde","texte":str}}
immeuble.etages[] (rang 0 = plus haut étage de projet)
ETAT_CHEF = v => v === true ? ['en session','ok'] : v === false ? ['arrêté','off'] : ['injoignable','ko']
```
Phrase actuelle de la consigne : `"ouvert et tu es au toit, tu les pilotes tous. "` → `"ouvert et tu es au dernier étage, tu les pilotes tous. "`.

## Décisions actées
- demande humaine 2026-10-15 : « ne mets pas le chef sur le toit, mets-le au dernier étage »
- clé `immeuble.toit` du serveur conservée (contrat §C1, point de non-retour) : seul l'affichage change
- 0 donnée inventée ; jamais `alert/confirm/prompt` ; même charte visuelle

## Hors périmètre
- `bin/dash.py`, contrat.md ; autres correctifs de la tour (T018, retenue avant toi)

## Environnement
- démarrer APRÈS T018 (même fichier `dash/dash.js`) : lire l'arbre tel qu'il est, repérer par nom de fonction
- salle-banc : `python3 bin/dash.py --port 7812 --no-open &` (vrai vault, GET) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`) ; états chef `false`/`null` et 12 étages : réécrire la route `state.json`
- `garde_bash` refuse les commandes citant push/migrations ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T019
projet: agentx-immeuble
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
