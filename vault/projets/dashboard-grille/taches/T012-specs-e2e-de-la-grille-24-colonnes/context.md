---
pack: T012
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T012 — Specs e2e de la grille 24 colonnes

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Adapter les specs Playwright `e2e/dashboard/` d'ortho-front (`master`, dashboard à mode édition) à la grille de 24 colonnes : le helper de seed envoie `gridCols: 24`, les positions sont en unités 24, et une spec `grille-24.spec.ts` verrouille le contrat API.

## Definition of Done
- [ ] `e2e/support/backend.ts:142` : `seedDashboardLayout` → PUT `{ gridCols: 24, tabs }` (sans quoi le back renvoie 400)
- [ ] `deplacement.spec.ts`, `persistance.spec.ts`, `ajout-widget.spec.ts` : cases seedées en unités 24 (`clock` `w: 8, h: 4` au lieu de `w: 4`) ; déplacement clavier inchangé (1 flèche = 1 colonne → `data-x` 0 → 2) ; assertions conservées
- [ ] `grille-24.spec.ts` (nouveau) : GET → `gridCols === 24` ; PUT sans `gridCols` → 400 ; PUT `gridCols:24` avec `{x:0,w:24}` et `{x:23,w:1}` → 200 ; PUT `{x:20,w:6}` → 400 ; après un enregistrement par l'UI (mode édition → déplacer → enregistrer), GET : toutes cases `x + w ≤ 24`, aucune clé `_grid` dans `config`
- [ ] `npx tsc -p tsconfig.e2e.json` → 0 ; `npx eslint e2e/dashboard e2e/support/backend.ts` → 0 erreur ; sorties collées
- [ ] exécution Playwright : seulement si le front de test répond (`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` ≠ 000) ; sinon `NV — stack absente`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/support/backend.ts` | E | seed :140-147 |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/deplacement.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/persistance.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/ajout-widget.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/grille-24.spec.ts` | E | nouveau |
| `~/Documents/Workspace/OrthoPro/ortho-front/tsconfig.e2e.json` | L | |

## Contrats
```
back (livré T006, base migrée) :
PUT /api/dashboard/layout { gridCols: 24, tabs } ; gridCols absent/≠24 → 400 « Grille de 24 colonnes attendue : rechargez la page »
x ∈ [0,23] · w ∈ [1,24] · x + w ≤ 24 sinon 400 « La case <widget> dépasse la grille » · y ≤ 500 · h ≤ 60 · ids UUID · ≥ 1 onglet
GET → { saved, gridCols: 24, tabs }
front (T007 en parallèle) : PUT porte gridCols: 24 ; testids existants (dash-cell[data-x|data-w], dash-edit, dash-save…) inchangés
// e2e/support/backend.ts:140-147 actuel
await request('PUT', '/dashboard/layout', { tabs }, token)   // → { gridCols: 24, tabs }
return request('GET', '/dashboard/layout', undefined, token)
```

## Décisions actées
- `master` garde le mode édition (manipulation directe = branche Ultime, hors chantier)
- version de grille portée par l'API (`gridCols`), jamais dans `config` — T005

## Hors périmètre
- `src/` ; lancer la stack de test (`make test-e2e` = humain) ; autres dossiers e2e.

## Environnement
- `rg` absent → Grep ; node 24 `~/.nvm/versions/node/v24.15.0/bin`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npx playwright test:*)`, `Bash(curl -s:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T012
statut: fait | bloque
---
## Livré
- chemin:L — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
