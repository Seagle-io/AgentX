---
pack: T018
projet: agentx-immeuble
role: implementeur
cree: 2026-10-15
---

# Pack T018 — Correctifs tour : rôle hostile, Échap, troncature emoji, focus

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger dans `dash/dash.js` les 3 défauts du vérificateur T016 sur la vue d'ensemble (tour figée par un rôle `constructor`, Échap sans effet en vue étage, emoji coupé en deux) et 2 défauts d'accessibilité notés (focus perdu, hash `#/Beta`), prouvés en rejouant ses scripts.

## Definition of Done
- [ ] D1 : rôle inconnu ou hérité d'`Object.prototype` (`constructor`, `__proto__`, `toString`, `hasOwnProperty`) → couleur de repli (`COULEUR_ROLE` lu par `Object.hasOwn` ou registre sans prototype), 0 TypeError ; `TOUR.sig` posé APRÈS un `construireTour` réussi (un échec retente au poll suivant) ; erreur de rendu de la tour → `console.error` explicite, pas avalée en silence ; `node .cache/banc-T016i/repro-d1.mjs` (adapté à ton banc) → `niveaux` > 0, `plaquesEtage` = `etagesSrv`, sortie collée
- [ ] même garde appliquée aux autres lectures `COULEUR_ROLE[...]`, `GLYPHES[...]`, `COULEUR_STATUT[...]` indexées par une donnée du vault : `rg -n "COULEUR_ROLE\[|GLYPHES\[|COULEUR_STATUT\[" dash/dash.js` collé, chaque site justifié
- [ ] D2 : en vue étage (hash `#/slug`), Échap sans palette ni saisie ouverte et focus hors xterm → retour vue immeuble (`location.hash = '#/'`) ; Échap dans xterm → inchangé (va au terminal) ; ordre de priorité Échap : palette > saisie > plein écran > retour immeuble ; prouvé par `sonde-bords.mjs` adapté
- [ ] D3 : `courtT` (et la troncature d'alerte 48 car.) coupe par caractères (`Array.from` / `Intl.Segmenter` si dispo) → 0 surrogate isolé ; titre `'x'*28+'🚀…'` → `"seulSurrogate":false`, sortie collée
- [ ] focus : après Entrée sur un étage de la tour → focus sur `#vers-immeuble` (ou titre de l'étage) ; après ⌂ → focus sur la plaque de l'étage quitté ; jamais BODY ; mesures collées
- [ ] hash `#/Beta` (majuscules) : slug normalisé en minuscules avant validation, ou hash effacé + vue immeuble — trancher, 1 ligne en Écarts
- [ ] 0 régression : `node .cache/eval-T015/e2e.mjs` (adapté à ton banc) → 0 KO ; scénarios W1-W7 de `.cache/banc-T016i/e2e-T016.mjs` → 0 KO ; `node --check` rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] `git diff --stat -- dash/` (base 625d4fc) → `dash/dash.js` seul (+ `dash.css` si focus visible l'exige, dit en Écarts)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `courtT ~:1124` · couleurs `~:1141-1148` · `rendreTour ~:1319-1320` · `brancherTour ~:1336-1355` · boucle `~:1460` · Échap `~:1705` · `majRegistre :15` |
| `dash/dash.css` | E | focus visible seulement si nécessaire |
| `.cache/banc-T016i/` | L | `setup`, `e2e-T016.mjs`, `repro-d1.mjs`, `sonde-bords.mjs` à rejouer |
| `.cache/eval-T015/e2e.mjs` | L | non-régression évaluateur |
| `vault/projets/agentx-immeuble/taches/T016-casser-la-vue-d-ensemble-animee-dans-chromium/result.md` | L | défauts détaillés |
| `.cache/T018/` | E | ton banc, tes scripts |

## Contrats
Défauts verbatim (T016) :
```
D1 · tâche en-cours avec role: constructor / __proto__ / toString · tour vide ou figée, 0 erreur console
   repro-d1.mjs → {"vue":"immeuble","niveaux":0,"plaquesEtage":0,"etagesSrv":14,"listeImmeuble":14} · console []
   dash.js:1141 COULEUR_ROLE[a.role] hérite de la valeur d'Object.prototype
   dash.js:1148 ombrer(c) → TypeError hex.slice is not a function
   dash.js:1319-1320 TOUR.sig posé avant construireTour → pas de retentative
   erreur avalée par boucle dash.js:1460
D2 · vue étage #/beta + Échap · hash et vue inchangés ≠ « Échap / ⌂ revient »
   dash.js:1705 Échap ne gère que palette et saisie ; brancherTour dash.js:1336-1355 ∅ Échap
D3 · titre 'x'*28+'🚀…' · plaque tronquée …x\ud83d… → glyphe � · courtT dash.js:1124 coupe en unités UTF-16 ; même défaut sur l'alerte 48 car.
hors défauts : #/Beta (hors RE_SLUG_PAGE) → hash conservé, vue immeuble · focus perdu sur BODY après Entrée et après ⌂
```
`ombrer(hex, f)` attend `#rrggbb`. Couleur de repli : `#5d6880` (déjà utilisée pour prio 4).

## Décisions actées
- `roles.json` est le registre : un rôle inconnu s'affiche en gris neutre, jamais une erreur
- Échap dans xterm = interruption de claude : toujours prioritaire, jamais intercepté
- 0 donnée inventée ; jamais `alert/confirm/prompt`

## Hors périmètre
- `bin/*` (validation du rôle côté serveur : autre tâche si besoin) ; mise en page de la tour (débord 12 étages, texte 390 px : notés en todo)
- 1864 CSSTransition `visibility` sous reduce (0 mouvement) : noter seulement

## Environnement
- banc : `B=.cache/T018/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json dash $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis `python3 .cache/banc-T009/setup.py` adapté ; recopier ton `dash/dash.js` dans `$B/dash/` avant chaque essai ; `python3 $B/bin/dash.py --port 7811 --no-open &` ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`)
- `pret` exige un pack lintable (9 sections dans l'ordre) ; `retenir` sur banc sans évaluation : `--sans-eval`
- salle réelle :7777 : ne pas toucher ; vrai vault jamais muté

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/T018/banc)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T018
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
