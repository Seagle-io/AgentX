---
pack: T006
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T006 — Specs e2e de la manipulation directe

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réécrire les 3 specs Playwright `e2e/dashboard/` pour le dashboard en manipulation directe (∅ mode édition, auto-save) : déplacement, ajout de widget, persistance ; + 1 spec `annulation.spec.ts` (retirer + Annuler, Ctrl+Z, erreur de sauvegarde).

## Definition of Done
- [ ] `deplacement.spec.ts` : case focalisée + 2×ArrowRight → `data-x='2'` ; attendre `dash-save-status[data-status=idle]` ; ∅ `dash-edit`/`dash-save`
- [ ] `ajout-widget.spec.ts` : `dash-add-widget` → `dash-catalogue-item[data-widget=clock]` clic → `dash-cell[data-widget=clock]` ; + variante `dragTo` sur `dash-grid` → case présente (si RGL instable au drag : `test.fixme` motivé, pas de test vert mensonger)
- [ ] `persistance.spec.ts` : déplacement → status idle → `page.reload()` → `data-x='2'` ; API `getDashboardLayout` → `saved=true`, `x=2`
- [ ] `annulation.spec.ts` : `dash-cell-remove` → case absente → toast « Annuler » → case revenue · Ctrl+Z après déplacement → `data-x='0'` → reload → `0` · `page.route('**/dashboard/layout', PUT → 500)` → `data-status=error` → bouton Réessayer → route rétablie → idle
- [ ] aucun sélecteur mort : rg `dash-edit|dash-placement|dash-save\b|dash-grip` e2e → 0
- [ ] `npx tsc -p tsconfig.e2e.json` → 0 erreur ; `npx eslint e2e/dashboard` → 0 erreur ; sorties collées. Exécution Playwright : `npx playwright test e2e/dashboard` **seulement si** back+front de test tournent (`make test-e2e` est interdit à l'agent) ; sinon `NV — stack absente`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/deplacement.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/ajout-widget.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/persistance.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/annulation.spec.ts` | E | à créer |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/support/backend.ts` | L | `seedDashboardLayout`, `getDashboardLayout` |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/config.ts` | L | base URL |
| `~/Documents/Workspace/OrthoPro/ortho-front/playwright.config.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/tsconfig.e2e.json` | L | |

## Contrats
Repères DOM livrés par T003/T004/T005 (le code n'existe peut-être pas encore quand tu écris : écris contre ce contrat) :
```
survivants : [data-testid=dash-grid] · [data-testid=dash-cell][data-widget|data-cell-id|data-x|data-y|data-w|data-h] · dash-cell-remove · dash-catalogue-item[data-widget] · dash-confirm · [data-tour=dash-grid] · [data-tour=dash-customize]
supprimés  : dash-edit · dash-placement · dash-save · .dash-grip · .dash-selected · .dash-pushed · .dash-grid-editing
nouveaux   : dash-cell-settings · dash-catalogue · dash-add-widget · dash-undo · dash-redo
             dash-save-status[data-status=idle|pending|saving|error] (idle : ∅ texte ; error : bouton « Réessayer »)
             dash-tab[data-tab-id] · dash-tab-add · dash-tab-menu · dash-tab-rename-input · dash-tab-color[data-color] · dash-tab-remove · dash-more · dash-reset
classes    : .dash-grid · .dash-grid-interactive · .dash-grid-dropping · .dash-cell-chrome (focalisable, tabIndex=0, dans chaque dash-cell) · .dash-nodrag
clavier    : global Ctrl+Z undo · Ctrl+Maj+Z | Ctrl+Y redo · Ctrl+S flush
             .dash-cell-chrome focalisé : flèches déplacer (1 col/rangée) · Maj+flèches redimensionner · Suppr retirer · Entrée réglages · Échap blur
auto-save  : PUT /dashboard/layout débouncé 800 ms après le dernier geste ; toast erreur « Disposition non enregistrée » + action « Réessayer »
toast retrait : « Widget retiré » + action « Annuler »
```
Modèle existant à conserver (session, seed, viewport) — `deplacement.spec.ts:1-30` :
```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { seedDashboardLayout } from '../support/backend.js'
const session = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', '.fixtures', 'session.json'), 'utf8')) as { token: string }
test.use({ viewport: { width: 1440, height: 900 } })
// beforeEach : seedDashboardLayout(session.token, [{ id, name: 'Accueil', color: null, cells: [{ id: cellId, widget: 'clock', x: 0, y: 0, w: 4, h: 4, config: {} }] }])
// afterEach  : seedDashboardLayout(session.token, [])
// focaliser une case : page.locator(`[data-cell-id="${cellId}"] .dash-cell-chrome`).focus()
// attendre la sauvegarde : await expect(page.getByTestId('dash-save-status')).toHaveAttribute('data-status', 'idle')
```

## Décisions actées
- plus de mode édition ; tout geste est sauvegardé seul — humain 2026-10-06
- le glisser souris RGL est réputé instable en e2e (commentaire deplacement.spec.ts:1-2) : clavier pour déplacer ; `dragTo` seulement pour le dépôt catalogue, `fixme` motivé si instable
- ∅ screenshot comparison dans ces specs — zones variables

## Hors périmètre
- Tout fichier `src/` ; lancer la stack (`make test-e2e`, back, DB) : interdit à l'agent, l'humain s'en charge.
- Autres dossiers e2e.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npx playwright test:*)`, `Bash(rg:*)`, `Bash(curl -s http://127.0.0.1:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
