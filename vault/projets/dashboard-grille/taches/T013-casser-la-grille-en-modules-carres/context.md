---
pack: T013
projet: dashboard-grille
role: verificateur
cree: 2026-10-08
---

# Pack T013 — Casser la grille en modules carrés

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter, au navigateur et par les tests, la livraison T006–T012 (dashboard OrthoPro `master` en 24 colonnes à modules carrés, cartes à la taille de leur contenu). Verdict `CONFORME` / `DÉFAUTS` / `NON VÉRIFIABLE`.

## Definition of Done
- [ ] statique : `npx tsc -b`, `npx eslint src/modules/dashboard e2e/dashboard`, `PATH=…node24 npm run test:unit`, `npm run build` (front) ; `npx vitest run src/modules/Dashboard/layout`, `npx tsc --noEmit` (back) → sorties collées
- [ ] rejeu : chaque ligne « Vérifié comment » des result.md T006–T012 ; tout écart déclaré ≠ observé = défaut n°1
- [ ] carré : à viewport 1024, 1280, 1440, 1920 (Chrome système, compte de test) : 1 case `w:1,h:1` → largeur = hauteur ± 1 px ; module = `moduleOf(width)` attendu (24–48) ; grille ≤ 1520 px ; < 944 px de conteneur ⇒ pile
- [ ] cartes : disposition = **tous** les widgets disponibles à leur taille **par défaut** puis à leur **taille mini** (`minW × minH`), à 1280 et 1920 : pour chaque widget, corps sans débordement horizontal, sans texte coupé hors ellipsis volontaire, défilement vertical seulement pour les listes (famille L) ; capture PNG par widget ; tableau widget → OK/KO + preuve
- [ ] cas signalés : `greeting` à minW 5 (bouton « Ouvrir la journée ») · `forum` minW 13 (mode compact mort ?) · `weather` 5×6 : 3 jours si étroit, 4 si ≥ 14rem, rien d'étiré · `mascot` saut rogné · `today` minW 8 (noms tronqués) · `daily-game` h3 · seuils px (`kpi` 90, `greeting` 80, `weather` 120/150) à module 48
- [ ] disposition livrée (`DEFAULT_CELLS`) : nouveau compte vide ⇒ 24×31 sans trou ni chevauchement (capture 1440)
- [ ] conversion : PUT direct d'une disposition à 24 col → GET `gridCols:24` → affichage sans migration (x,w inchangés) ; PUT sans `gridCols` → 400 ; mode édition : déplacer + Enregistrer → 200
- [ ] fin : compte de test remis à 1 onglet « Accueil » vide
- [ ] `result.md` : verdict en tête, défauts du plus grave au plus bénin, `fichier:ligne` + scénario + repro

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-grille/taches/` | L | result.md T006–T012 (affirmations), T004/T005 result.md (contrats, tableau des tailles) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | DEFAULT_CELLS |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | conversion |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/` | L | Grep `grid:` + fichiers des widgets KO |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/` | L | |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/T013/orthopro-session.json` | L | `{"auth_token":"…"}` compte de test, déposé par l'humain — jamais affiché ; injecter en `localStorage.auth_token` + en-tête `Authorization: Bearer` |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/T013/verif/` | E | harnais Playwright (à écrire, ∅ existant) + PNG |

## Contrats
```ts
GRID_COLS = 24 · GRID_GAP = 16 · MODULE_MIN = 24 · MODULE_MAX = 48 · GRID_MAX_WIDTH = 1520 · STACK_BELOW = 944
moduleOf(width) = min(48, max(24, (width − 23·16) / 24)) · modulesToPx(n, m) = n·m + (n−1)·16
// API : PUT /api/dashboard/layout { gridCols: 24, tabs } · GET → { saved, gridCols: 24, tabs } · ids UUID · y ≤ 500 · ≥ 1 onglet
// DOM : div.react-grid-item[data-testid=dash-cell][data-widget][data-x][data-w] ; master = mode édition (dash-edit, dash-save)
// weather 5×6 [5..7]×[4..7] ; greeting 12×3 [5..24]×[3..5] ; forum 24×7 [13..24]×[4..14] ; today 8×16 [8..24]×[8..32]
```

## Décisions actées
- tu ne corriges rien ; tu rapportes avec repro — rôle
- un test vert sans sortie collée = non vérifié = défaut

## Hors périmètre
- Écrire dans ortho-front / ortho-back ; migrations ; seeds ; relancer les serveurs ; stack e2e (`make test-e2e` = humain).

## Environnement
- front `http://localhost:5173` (Vite master), back `:3000` (`start:dev`), base migrée en 24 col
- Chrome système `/usr/bin/google-chrome` ; `playwright` depuis `~/Documents/Workspace/OrthoPro/ortho-front/node_modules` ; node 24 `~/.nvm/versions/node/v24.15.0/bin`
- compte de test : données de démo présentes (8 patients, factures) ; modules messagerie/documents/facturation peut-être absents → widgets non disponibles = NV, pas défaut
- `rg` absent → Grep

## Budget
- Lectures hors whitelist : **5 maximum**, journalisées dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, Write (verif/, result.md), `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npx vitest run:*)`, `Bash(npm run test:unit:*)`, `Bash(npm run build:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T013
statut: fait | bloque
---
## Livré
VERDICT: CONFORME | DÉFAUTS | NON VÉRIFIABLE
- Dn (grave→bénin) fichier:ligne — scénario → constat — repro ; tableau widgets OK/KO ; chemins PNG
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : ce qu'une tâche de correction doit recopier
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
