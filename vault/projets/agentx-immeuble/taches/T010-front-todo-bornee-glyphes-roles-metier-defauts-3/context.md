---
pack: T010
projet: agentx-immeuble
role: designer
cree: 2026-10-15
---

# Pack T010 — Front : todo bornée, glyphes rôles métier, défauts 390 px

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Empêcher la todo du chef d'allonger la page (plainte humaine : « la liste s'agrandit à chaque tâche en plus »), dessiner 6 glyphes pour les rôles métier, corriger 2 défauts 390 px — dans `dash/dash.css`, `dash/dash.js`.

## Definition of Done
- [ ] F1 todo bornée : hauteur de `.todo-card` ≤ hauteur de `.room-wrap` (salle) ; `#todo` défile en interne ; hauteur de page (`document.documentElement.scrollHeight`) identique à ±2 px entre `state.json` réécrit avec 4 items todo et avec 40 items — mesures collées à 1600×1000 et 1280×800
- [ ] F1 mesure de départ collée (constat chef : `#todo` h=3699 px pour 40 items, page 6215 px à 1600×1000)
- [ ] F2 glyphes : 6 clés ajoutées à `GLYPHES` (`dash.js:299-335`) : `avis` (juriste), `budget` (tresorier), `specs` (produit), `contenus` (marketing), `risques` (rssi), `cahier` (syndicat) ; même grammaire SVG que les existants (viewBox implicite ±7, `stroke="${c}"`, `stroke-width` 1.2-1.6, 0 couleur en dur) ; capture `.cache/T010/glyphes.png` des 6 + 2 existants
- [ ] F3 390 px : bouton de la dernière `.trow` cliquable (`elementFromPoint` au centre du bouton = le bouton), tiroir ouvert et fermé
- [ ] F4 390 px : en-tête du tiroir fermé tient en 34 px (texte « CHEF DE PROJET » sur 1 ligne ou abrégé) ; `scrollWidth <= 390`
- [ ] 0 régression : coupe d'immeuble (`#immeuble`), deck, tiroir 1600 px — capture avant/après `.cache/T010/1600-avant.png` / `1600-apres.png`
- [ ] `node --check dash/dash.js` rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] `git diff --stat -- dash/` collé (dash.css, dash.js seulement) ; script `.cache/T010/mesure.mjs` ; 0 erreur console
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.css` | E | `.hud :272` · `.todo-card :273` · `.todo :290` · `.tasks :386` · `.tiroir` · media ≤ 480 `~:715-734` |
| `dash/dash.js` | E | `GLYPHES :299-335` seulement |
| `dash/index.html` | L | structure `.hud`/`.todo-card :66-72`, `#tasks :125-130` |
| `.cache/T010/` | E | script, captures |

## Contrats
CSS actuel :
```css
/* la colonne droite épouse la hauteur de la salle, la todo prend le reste */
.hud{display:flex;flex-direction:column;gap:9px;height:100%;min-height:0}
.todo-card{flex:1;display:flex;flex-direction:column;min-height:170px}
.todo{display:flex;flex-direction:column;gap:5px;flex:1;min-height:0;overflow:auto;padding-right:3px}
.tasks{max-height:252px;overflow:auto}
```
Intention du commentaire = la bonne : la salle fixe la hauteur de la rangée, la todo prend le reste et défile. Aujourd'hui la todo pousse la rangée.
Glyphe existant (référence de style) :
```js
resultat: c => `<path d="M-4.6-6.5h6l3.6 3.6v9.4h-9.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>…`,
```
Couleurs des rôles (roles.json, pour la capture) : juriste #94a3b8 · tresorier #16a34a · produit #0891b2 · marketing #ca8a04 · rssi #b91c1c · syndicat (à venir, prendre #f97316 pour la capture).

## Décisions actées
- todo agrégée plafonnée à 40 items côté serveur (contrat immeuble §C4) : ne pas la tronquer côté page, la faire défiler
- 0 nouvelle couleur de charte ; jamais `display:none` du terminal
- skill `frontend-design` : rester dans le langage visuel existant

## Hors périmètre
- `bin/*`, `roles.json`, `dash/index.html` (lecture seule)
- coupe d'immeuble : n'y toucher que si une régression mesurée l'exige (le dire en Écarts)

## Environnement
- T008 (évaluateur) et T009 (vérificateur) lisent `dash/*` en parallèle sur leurs bancs : écris des changements ciblés
- salle-banc : `python3 bin/dash.py --port 7803 --no-open &` (vrai vault, GET seulement) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; 0 `npm install`
- OBLIGATOIRE : `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}` JSON, GET → `text/event-stream` vide, `in` → `{}`) ; jamais le vrai socket chef
- 4 vs 40 items : réécrire la route `state.json` (`todo` tronqué à 4, `todo_total` 4)
- `dash.*` servis à chaque requête ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3 bin/dash.py:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
projet: agentx-immeuble
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (mesures F1-F4, captures)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
