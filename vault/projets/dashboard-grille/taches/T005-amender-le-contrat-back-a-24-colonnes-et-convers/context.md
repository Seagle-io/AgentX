---
pack: T005
projet: dashboard-grille
role: architecte
cree: 2026-10-08
---

# Pack T005 — Amender le contrat : back à 24 colonnes et conversion des données

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Le contrat T004 suppose un back inchangé ; c'est faux (preuves ci-dessous). Amender : le back `master` (module `src/modules/Dashboard/layout/`) passe à 24 colonnes (validations, catalogue de tailles, règles), une migration TypeORM de données convertit les dispositions enregistrées (x,w ×2), et le front abandonne le marqueur `_grid`. Produire les contrats back + le delta front + les lots d'implémentation finaux.

## Definition of Done
- [ ] lecture du module back : `save-dashboard.dto.ts` (bornes x/w/y/h), `dashboard-widget.catalog.ts` (tailles, réglages autorisés), `dashboard-layout.rules.ts`, entités `dashboard-cell`/`dashboard-tab` (colonnes, types), service — coordonnées `chemin:L`
- [ ] contrat back : nouvelles bornes DTO (x ≤ 23, w ≤ 24, y, h), catalogue = tableau T004 (même source de vérité ? dupliqué ? tranché), règles/tests back à mettre à jour (`*.spec.ts` listés)
- [ ] migration de données : classe TypeORM `ConvertDashboardTo24Cols<timestamp>` — `up` : x = x*2, w = w*2 (SQL exact sur la table réelle) ; `down` : x = floor(x/2), w = greatest(1, ceil(w/2)) ; idempotence (que se passe-t-il si lancée 2×) ; préférences legacy (`readTabs`, LAYOUT_PREFERENCE côté user) couvertes ou non — tranché
- [ ] ordre de déploiement : migration ↔ code back ↔ code front (fenêtre où un front 12 col parle à un back 24 col) — tranché pour le dev local et pour la prod
- [ ] delta front vs T004 : `_grid`, `isLegacyLayout`, `stripMark`, `migrateLegacyCells` → supprimés ou gardés (préférence legacy) ; liste exacte
- [ ] lots finaux (fichiers E, aucun en double, ≤ 12) : 1 lot back (DTO, catalogue, règles, specs, migration) + lots front T004 révisés
- [ ] `decisions.md` : 1 entrée append qui supersède celle de T004 (lien)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-grille/taches/T004-contrat-unite-module-carre-conversion-taille-de-/result.md` | L | contrat à amender |
| `vault/projets/dashboard-grille/decisions.md` | E | append |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dto/save-dashboard.dto.ts` | L | bornes |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-widget.catalog.ts` | L | tailles + réglages |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.ts` | L | règles |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.service.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/entity/dashboard-cell.entity.ts` | L | table, colonnes |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/entity/dashboard-tab.entity.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.spec.ts` | L | tests à réviser |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-widget.catalog.spec.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/database/migrations/1791300266625-AddPatientVoiceRange.ts` | L | modèle de classe de migration |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | readTabs, préférence legacy |

## Contrats
Preuves (PUT réel sur le compte de test, 2026-10-08) :
```
x=19,w=5 / w=24 → 400 ["tabs.0.cells.0.x must not be greater than 11","tabs.0.cells.1.w must not be greater than 12"]
config {"_grid":24} sur weather → 400 "Réglage inconnu pour weather : _grid"
config {} x=0 w=5 h=6 → 200 saved:true
PATCH /api/dashboard/cells/:id/config → 404 (route absente ou autre chemin)
```
T004 retenu (à conserver sauf contradiction) : `GRID_COLS=24 · GRID_GAP=16 · module = clamp((W−368)/24, 24, 48) · grille ≤ 1520 px · STACK_BELOW=944` ; conversion x,w ×2, y,h identiques ; tableau des 47 widgets en modules.

## Décisions actées
- back modifié + migration de données lancée par l'humain — humain 2026-10-08
- branche `master` ; migrations : jamais créées/exécutées par un agent sans accord — accord donné pour **créer** celle-ci, **exécution** = humain
- 24 colonnes, module carré — T004

## Hors périmètre
- Code de production ; exécuter quoi que ce soit en base ; widgets côté rendu (T004 couvre).

## Environnement
- le hook `garde_bash.py` refuse toute commande contenant `migration:run|generate|revert|create` : n'en écris pas dans tes commandes Bash ; cite-les dans result.md
- `rg` absent : utilise Grep/Glob

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (decisions.md, result.md), Edit (decisions.md)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T005
statut: fait | bloque
---
## Livré
- contrats back verbatim ; migration (SQL) ; delta front ; lots finaux (fichiers E, DoD)
## Vérifié comment
coordonnées lues ; preuves PUT reprises
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
