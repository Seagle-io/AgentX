---
pack: T025
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T025 — L5 front : étage = produit, puces projets, hash #/<cle>/<projet>

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire afficher par la salle (`dash/dash.js`, `dash/index.html`, `dash/dash.css`) les étages-produits que le serveur rend déjà (T021 retenu) : choix d'un projet dans un étage par puces, hash `#/<cle>/<projet>`, sous-sol et todo qui mènent au bon étage — à la lettre de §C3 ci-dessous.

## Definition of Done
- [ ] §C3 appliqué : `IMMEUBLE.projet`, `etageDemande()` → `{etage, projet}`, `allerEtage(cle, projet = null)`, `charger()` envoie `etage=` et `projet=`, `#pa-label` + puces `e.projets[]`, sous-sol, `sonnerEtages`, `etiquetteEtage`/todo, bandeau `produits_erreur`, palette ⌘K (`dash.js:1736`) → étages-produits
- [ ] `node --check dash/dash.js` → ∅ (collé)
- [ ] Chromium sur la salle réelle `http://127.0.0.1:7777` (dash.* servis à chaque requête, 0 relance), script Playwright collé + sorties : 4 étages + direction, seagle en bas (`É1`) ; clic Kora → hash `#/kora/<projet>` ; clic puce d'un autre projet de l'étage AgentX → `state.projet.slug` change et détail (`#tasks`) change ; `#/orthopro` → réécrit `#/kora/orthopro` ; `#/zz` → hash effacé ; clic sous-sol `dashboard-grille` → `#/kora/dashboard-grille`
- [ ] 390 px : `document.documentElement.scrollWidth == 390` ; captures PNG 1280 + 390 dans `.cache/seagle-T025/` (chemins collés)
- [ ] non-régression : tiroir chef (clic direction), palette ⌘K, navigation clavier ↑/↓ des étages, `registre_erreur` → 1 chacun observé dans le script
- [ ] `git diff --stat -- dash/` collé ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `etiquetteEtage` :631 · `IMMEUBLE` :1078 · `etageDemande` :1082 · `allerEtage` :1090 · `surHash` :1095 · `rendreImmeuble` :1107 · `sonnerEtages` :1158 · `brancherImmeuble` :1173 · `construireTour` :1316 · `rendreTour` :1432 · `charger` :1575 · palette :1736 · bandeau :74 |
| `dash/index.html` | E | `#pa-label` :26 |
| `dash/dash.css` | E | `.pa-label` :35 ; puces projets |
| `.cache/seagle-T025/` | E | script Playwright, PNG |

## Contrats
Forme serveur (déjà livrée, `GET /state.json?etage=&projet=`) :
```
immeuble.mode: "produits"|"projets" · immeuble.selection: {slug /*cle étage*/, projet /*== state.projet.slug*/, source, refus}
etages[]: {slug /*cle*/, titre /*nom produit*/, statut, rang, num, activite, age_j, dormant, compteurs, total, agents[{role,tid,projet}],
           todo, alerte{niveau,texte}, selection, produit: {cle, couleur, entreprise} | null,
           projets: [{slug, titre, statut, activite, encours, revue, bloque, actif}],   // actif = projet détaillé
           selectionnable}
sous_sol[]: {…existant (slug, titre, statut, maj, selectionnable)…, produit: str}   // "" si inconnu
todo[]: {…, projet, etage}   // etage = cle ("" = toit) · evenements[]: {…, projet, etage}
produits_erreur: str        // ≠ "" ⇒ mode "projets" : un étage par projet, produit null, projets = [1]
```
Réel aujourd'hui : É4 kora [orthopro] · É3 geolens [3 projets] · É2 agentx [4 projets] · É1 seagle [2 projets] · sous-sol [dashboard-direct, dashboard-grille, 2026-10-05-recherche-floue].
§C3 front (verbatim, contrat) :
```js
const IMMEUBLE = {slug: null, projet: null};       // + projet (garder transit existant)
function etageDemande() -> {etage: string|null, projet: string|null}   // '#/<cle>' | '#/<cle>/<slug>' ; chaque partie RE_SLUG_PAGE
function allerEtage(cle, projet = null)            // hash '#/'+cle (+ '/'+projet)
charger()   : 'state.json?' + (etage ? 'etage=…&' : '') + (projet ? 'projet=…&' : '') + 't=…'
              refus → hash effacé, IMMEUBLE = {slug:null, projet:null}
rendreImmeuble / construireTour : titre = nom produit ; --c = e.produit?.couleur ; e.selectionnable false → non cliquable, title 'aucun projet'
#pa-label  : 'ÉTAGE <titre>' + puces e.projets[] (<button data-projet>) → allerEtage(cle, slug) ; .actif = projet détaillé
sous-sol   : clic → allerEtage(p.produit || p.slug, p.slug)
sonnerEtages(evs) : clés = e.etage || e.projet
rendreTodo : .ti-etage → allerEtage(i.etage, i.projet)
s.produits_erreur → bandeau 'produits.json invalide : …' (même gabarit que registre_erreur)
```
- signature `rendreTour` (dash.js:1432) : ajouter `e.produit?.couleur`, `e.projets.length` à `sig`
- ancien hash `#/<projet>` : envoyé en `etage=` → serveur résout → hash réécrit `#/<cle>/<projet>` par `history.replaceState` (pas de hashchange)
- réponse périmée : comparer `{etage, projet}` demandés, pas seulement `slug` (`charger` :1577)

## Décisions actées
- étage = produit (cadrage humain) ; 0 donnée inventée ; mode « projets » = repli, doit rester fonctionnel
- `projet` invalide + `etage` valide → serveur garde l'étage, `refus ""` (acté chef 2026-10-16) : ne pas effacer le hash dans ce cas

## Hors périmètre
- `bin/dash.py` (serveur, retenu), `bin/*`, `produits.json`, relance de la salle :7777
- refonte visuelle de la tour iso : seulement titre, couleur, cliquabilité

## Environnement
- Playwright : `import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'` ; Chromium déjà installé, jamais `playwright install` ; modèle de harnais : `.cache/eval-T015/e2e.mjs` (L, hors WL toléré : 1 lecture)
- salle réelle :7777 en marche, GET seulement ; jamais `POST /api/*` depuis le script
- `garde_bash` refuse push/migrations ; `grep -nE` si `rg` absent ; sorties `| tail -n 40`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Write (`.cache/seagle-T025/`, `result.md`), `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(mkdir:*)`, `Bash(grep:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T025
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
- ≤ 5 lignes : nouvelles coordonnées dash.js (packs voix à corriger)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
