---
pack: T005
projet: agentx-immeuble
role: designer
cree: 2026-10-15
---

# Pack T005 — L2 : coupe d'immeuble et bascule d'étage dans la salle

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter à la salle la coupe d'immeuble (toit = chef, 1 étage par projet ouvert, sous-sol replié) et la bascule d'étage par hash `#/<slug>` dans `dash/dash.js`, `dash/index.html`, `dash/dash.css` — à la lettre de `contrat.md` §C8, en consommant `state.immeuble` livré par L1 (T003).

## Definition of Done
- [ ] HTML §C8 inséré verbatim dans `dash/index.html` entre `:13` et `:14` ; `.pa-label` → `id="pa-label"` texte `ÉTAGE` ; `rg -c 'id="immeuble"' dash/index.html` → 1
- [ ] JS §C8 : `IMMEUBLE`, `RE_SLUG_PAGE`, `etageDemande`, `allerEtage`, `surHash`, `rendreImmeuble`, `sonnerEtages`, `brancherImmeuble` ; modifs de `charger`, `rendre`, `rendreTodo`/`brancherTodo`, `sonnerie`, `annoncer`, `entreesPalette`, `executerEntree`, raccourci Alt+↑/↓, amorçage — signatures existantes inchangées
- [ ] réponse périmée ignorée : `charger()` dont `IMMEUBLE.slug` a changé pendant le fetch → ni `ETAT` ni `rendre` (prouvé par harnais ou Playwright, sortie collée)
- [ ] `s.immeuble === null` (démo) → `#immeuble` caché, 0 erreur
- [ ] état visuel §C8 (sel, dormant 16 px, al-bloque, al-urgent, compteurs 0 à .35, sonne 2.5 s) ; desktop `max-height:40vh` ; ≤ 480 px : 4 pastilles + `+N`, alerte en icône
- [ ] `node --check dash/dash.js` → rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] script `.cache/T005/e2e.mjs` (Playwright) sur salle-banc `:7799` = « DoD L2 » `contrat.md:346-353` : nb étages + toit + `SOUS-SOL · n` ; clic étage → hash `#/slug`, `#projet-nom` = titre de l'étage, `exe.projet` des actions de `taches` = slug (lu dans `state.json` intercepté ou requêtes `/api/run` abortées et comptées) ; `#/zz` → hash effacé ; Alt+↓ change d'étage ; Ctrl+K « étage » → n entrées ; 390 px `scrollWidth == 390` ; 0 erreur console — sortie collée
- [ ] captures `.cache/T005/immeuble-1280.png`, `.cache/T005/immeuble-390.png`, `.cache/T005/etage-zoome.png` listées
- [ ] `git diff --stat -- dash/` collé ; 0 autre fichier hors `.cache/T005/`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | rendreDeck `:42` · rendreTodo `:611` · annoncer `:892` · sonnerie `:909` · rendre `:958` · charger `:1029` · brancherTodo `:1102` · entreesPalette `:1162` · executerEntree `:1201` · raccourcis `:1249` · amorçage `:1475` |
| `dash/index.html` | E | insertion `:13-14`, `.pa-label :16` |
| `dash/dash.css` | E | `.im-*`, `.ti-etage`, responsive |
| `vault/projets/agentx-immeuble/contrat.md` | L | **§C1 L23-77 · §C3 L93-115 · §C4 L116-129 · §C5 L130-155 · §C8 L252-313 · DoD L2 L346-353 : contrat verbatim** |
| `.cache/T005/` | E | e2e, captures |

## Contrats
`contrat.md` §C8 = contrat front, à appliquer à la lettre (HTML, fonctions, modifs de l'existant, état visuel, mise en page). Forme de `state.immeuble` : §C1. Persistance = hash d'URL `#/<slug>` (§C3), jamais localStorage.
Exemple réel d'étage (sortie de L1, T003) :
```
etages[i] = {"slug":"agentx-immeuble","titre":"AgentX immeuble : un étage par projet","statut":"cadrage","rang":0,"num":8,"activite":"2026-10-15 17:31","age_j":0.0,"dormant":false,"compteurs":{"a-faire":1,"pret":0,"en-cours":1,"bloque":0,"revue":0,"fait":4,"abandonne":0,"rejete":0},"total":6,"agents":[{"role":"implementeur","tid":"T003"}],"todo":2,"alerte":{"niveau":"","texte":""},"selection":false}
toit = {"chef":{"vivant":true},"todo":98,"urgent":1,"etages":8,"dormants":0,"alerte":{"niveau":"","texte":""}}
sous_sol[i] = {slug, titre, statut, source, maj, selectionnable}   # aujourd'hui 2 : dashboard-direct (clos), archive/recherche-floue
GET /state.json?projet=<slug> → étage détaillé ; slug inconnu → 200 + immeuble.selection.refus ; vrai vault : 8 étages
```

## Décisions actées
- vue humaine : coupe + étage zoomé au clic ; toit = chef unique (clic → tiroir terminal) ; sous-sol = `<details>` fermé, jamais rouvert par le rendu
- le front affiche, ne calcule aucune règle (ordre, dormance, alertes viennent du serveur)
- 0 donnée inventée ; jamais `alert/confirm/prompt`
- skill `frontend-design` : style cohérent avec la salle existante (mono, panneaux, accents) — pas de nouvelle charte

## Hors périmètre
- `bin/*` (L1/L3 retenus) ; salle SVG `construireSalle`, deck, RH, terminal (sauf `basculerTiroir(true)` appelé)
- défauts 390 px préexistants de `.trow` et de l'en-tête du tiroir (notés ailleurs)

## Environnement
- salle-banc : `python3 bin/dash.py --port 7799 --no-open &` (lit le vrai vault, GET seulement) ; tuer par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; navigateurs `~/.cache/ms-playwright` ; 0 `npm install`
- OBLIGATOIRE dans le script : `page.route('**/api/run', r => r.abort())` (compter les requêtes) ; `/api/term/*` simulé : `open|etat` → `{"vivant":true}` JSON, GET flux → `text/event-stream` vide, `in` → `{}` — la page POST seule `/api/term/open` ; le socket chef est celui de la vraie session
- `.tasks` défile en interne (`max-height` + `overflow:auto`) : mesurer avec `scrollIntoView`
- salle réelle :7777 : ne pas lancer, ne pas arrêter ; `dash.js`/`dash.css`/`index.html` servis à chaque requête

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3 bin/dash.py:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T005
projet: agentx-immeuble
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (e2e, captures)
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : scénario navigateur pour le vérificateur
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
