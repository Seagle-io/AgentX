---
pack: T011
projet: agentx-immeuble
role: designer
cree: 2026-10-15
---

# Pack T011 — Vue d'ensemble animée : open space de l'immeuble entier

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter à la salle une vue d'ensemble animée : l'immeuble entier en coupe isométrique, chaque étage = un open space miniature où les agents actifs de ce projet travaillent (mascottes animées), le chef au toit, le sous-sol en bas — dans le même langage visuel que la salle d'étage existante (`#room`), alimentée uniquement par `state.immeuble`.

## Definition of Done
- [ ] bascule de vue dans le panneau `.salle` : hash vide ou `#/` → vue IMMEUBLE (`svg#tour`) ; `#/<slug>` → vue ÉTAGE (`svg#room` existant, inchangé) ; bouton `⌂ immeuble` visible en vue étage (→ `location.hash = '#/'`) ; clic sur un étage de la tour → `allerEtage(slug)` ; transition ≤ 400 ms (zoom/fondu CSS), 0 rechargement
- [ ] `#tour` : 1 dalle iso par `immeuble.etages[]` (ordre `rang`, rang 0 en haut sous le toit), toit (chef : mascotte `COULEUR_ROLE.chef`, état `toit.chef.vivant`), sous-sol (`sous_sol.length` cartons/archives, repliés) ; étiquette par étage `É<num> · titre court` + compteurs en-cours/revue/bloqué
- [ ] agents : 1 mascotte par `etages[i].agents[]` (couleur `COULEUR_ROLE[role]`, ≤ 12 puis `+N`), assise à un bureau de l'étage, animation de travail (bob, écran qui clignote) ; étage sans agent = bureaux vides, lumière baissée ; `dormant` = étage éteint ; `alerte.niveau` `bloque` = gyrophare rouge, `urgent` = jaune ; étage `selection` = contour accent ; 0 agent inventé (comparaison mascottes ↔ `agents` collée)
- [ ] vie : événement `sonnerie` d'un étage (`e.projet`) → l'étage s'illumine 2.5 s (réutiliser `sonnerEtages` ou équivalent) ; ascenseur qui se déplace vers l'étage sélectionné
- [ ] hauteur : tour lisible de 3 à 12 étages dans la hauteur actuelle de `.room-wrap` (dalles compressées au-delà de 8, mesure collée à 3, 8, 12 étages par réécriture de `state.json`)
- [ ] perf : `#tour` re-rendu seulement si la signature (slugs, rangs, agents, alertes, sélection, dormants) change ; animations CSS (pas de boucle JS par frame) ; `prefers-reduced-motion: reduce` → 0 animation (mesure `getAnimations().length` collée)
- [ ] accessibilité : chaque étage focusable (`tabindex=0`, `role=button`, `aria-label` « Étage N, titre, n en cours, n bloqués »), Entrée → `allerEtage`
- [ ] 390 px : tour visible, `scrollWidth <= 390`
- [ ] `node --check dash/dash.js` rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ ; 0 erreur console
- [ ] script `.cache/T011/e2e.mjs` + captures `.cache/T011/tour-1600.png`, `tour-390.png`, `tour-12-etages.png`, `transition-etage.png` listées ; `git diff --stat -- dash/` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | iso/boite/mascotte/bureau `:116-220` (réutiliser, ne pas casser `#room`) · construireSalle · immeuble (`IMMEUBLE`, `allerEtage`, `surHash`, `rendreImmeuble`, `sonnerEtages`) · `rendre` |
| `dash/index.html` | E | `.salle-body` / `.room-wrap :55-57` : ajouter `svg#tour` + bouton |
| `dash/dash.css` | E | `.room-wrap`, animations, `.tour-*` |
| `vault/projets/agentx-immeuble/contrat.md` | L | **§C1 L23-77 (forme `immeuble`) · §C3 L93-115 (hash) · §C8 L252-313 (coupe, fonctions)** |
| `.cache/T011/` | E | e2e, captures |

## Contrats
Projection existante (globale, pour `#room`) :
```js
const TW = 32, TH = 16, ZH = 20, OX = 300, OY = 120;
const iso = (x, y, z=0) => [OX + (x - y) * TW, OY + (x + y) * TH - z * ZH];
function boite(x, y, z, w, d, h, couleur, extra='')     // boîte iso 3 faces, via pts() → iso()
function mascotte(sx, sy, couleur, taille=1, retard=0)  // billboard écran ; .mascotte animée « bob » en CSS
function bureau(cle, nom, gx, gy, couleur, agents = 0)  // poste complet, 1+ instances
```
`boite` dépend de `iso` global : pour la tour, écrire une projection paramétrée (`isoT(x, y, z, ox, oy, s)` ou équivalent) sans modifier `iso`/`boite` utilisés par `#room`.
Données (`state.immeuble`, réel, cf. §C1) :
```
etages[i] = {"slug","titre","statut","rang","num","activite","age_j","dormant","compteurs":{…8 statuts…},"total","agents":[{"role","tid"}],"todo","alerte":{"niveau":""|"bloque"|"urgent","texte"},"selection"}
toit = {"chef":{"vivant":true|false|null},"todo","urgent","etages","dormants","alerte":{"niveau":""|"sonde","texte"}}
sous_sol[i] = {slug, titre, statut, source, maj, selectionnable}
s.immeuble === null en démo → vue IMMEUBLE masquée, vue ÉTAGE seule
```
Hash (§C3, livré T005) : `etageDemande()` → slug | null ; `allerEtage(slug)` ; `surHash()` sur `hashchange` ; `#/zz` inconnu → hash effacé.

## Décisions actées
- demande humaine 2026-10-15 : « une vue d'ensemble animée, comme l'open space, de l'immeuble entier » — supersède le hors-périmètre « immeuble 3D » du brief
- choix chef : vue IMMEUBLE par défaut sans hash ; la coupe-liste `#immeuble` (T005, retenue) reste la navigation compacte au-dessus
- 0 donnée inventée : 0 mascotte sans agent réel ; le front affiche, ne calcule aucune règle (dormance, alerte, ordre = serveur)
- skill `frontend-design` : même charte (couleurs de rôle, fond sombre, iso) ; jamais `alert/confirm/prompt`

## Hors périmètre
- `bin/*` ; logique de `#room` (salle d'étage) au-delà de l'afficher/masquer
- terminal, palette, todo (T010 vient de les toucher)

## Environnement
- base : commit 48a6888 (T005, T010, T012 inclus) ; ton diff = `git diff -- dash/` ; lignes ci-dessus approximatives (repérer par nom de fonction)
- T012 a ajouté `IMMEUBLE.transit` et `#tasks.inert=true` pendant une bascule : ne pas les casser ; styler `#tasks[inert]` (grisé, `cursor:not-allowed`) fait partie de ta tâche
- salle-banc : `python3 bin/dash.py --port 7804 --no-open &` (vrai vault, GET) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; 0 `npm install`
- OBLIGATOIRE : `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}` JSON, GET → `text/event-stream` vide, `in` → `{}`) ; jamais le vrai socket chef
- vrai vault : peu d'agents actifs → réécrire la route `state.json` pour 3/8/12 étages, agents multiples, dormant, bloque, urgent
- salle réelle :7777 : ne pas toucher ; `dash.*` servis à chaque requête

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3 bin/dash.py:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T011
projet: agentx-immeuble
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (e2e, mesures, captures)
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : scénario navigateur pour le vérificateur
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
