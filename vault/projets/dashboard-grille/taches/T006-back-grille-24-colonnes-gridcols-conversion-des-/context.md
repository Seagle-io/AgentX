---
pack: T006
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T006 — Back : grille 24 colonnes, gridCols, conversion des données

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Passer le module `Dashboard/layout` d'ortho-back (`master`) à une grille de 24 colonnes, exiger `gridCols: 24` au PUT et le renvoyer au GET, et **écrire à la main** la classe de migration de données `ConvertDashboardTo24Cols<TS>` (x, w ×2) — que l'humain exécutera.

## Definition of Done
- [ ] `dashboard-widget.catalog.ts:117-118` : `GRID_COLS = 24` (commentaire « 24 colonnes ») ; autres constantes inchangées
- [ ] `dto/save-dashboard.dto.ts` : `SaveDashboardDto.gridCols` avec `@Equals(GRID_COLS, { message: … })` (contrat) ; `DashboardCellDto` inchangé (bornes lisent GRID_COLS)
- [ ] `dashboard-layout.rules.ts` : retour `{ dashboard: { gridCols: dto.gridCols, tabs } }` ; `:25` inchangé
- [ ] `dashboard-layout.service.ts` : `DashboardView.gridCols` ; `get()` renvoie `gridCols: GRID_COLS`
- [ ] `entity/dashboard-cell.entity.ts:6` : commentaire « sur 24 colonnes » ; colonnes inchangées
- [ ] `dashboard-layout.rules.spec.ts` : helper `dashboard()` + `gridCols: 24` ; `:28-30` `{x:10,w:4}` → `{x:20,w:6}` (KO) ; + cas acceptés `{x:0,w:24}` et `{x:23,w:1}` ; `:17` attendu `{ dashboard: { gridCols: 24, tabs: … } }`
- [ ] `dto/save-dashboard.dto.spec.ts` (nouveau, `plainToInstance` + `validate`) : x 23 OK / 24 KO · w 24 OK / 25 KO · gridCols absent KO / 12 KO / 24 OK
- [ ] `src/database/migrations/<TS>-ConvertDashboardTo24Cols.ts` créé **à la main** (Write), TS = `Date.now()` au moment de l'écriture (> 1791306568498), contenu = contrat verbatim
- [ ] `npx vitest run src/modules/Dashboard/layout` et `npx tsc --noEmit` → sorties collées
- [ ] la migration n'est **ni exécutée ni générée** par toi ; commande pour l'humain recopiée dans `## Pour la suite`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-widget.catalog.ts` | E | GRID_COLS :117-118 |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dto/save-dashboard.dto.ts` | E | gridCols |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.ts` | E | retour |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.service.ts` | E | DashboardView |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/entity/dashboard-cell.entity.ts` | E | commentaire |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.spec.ts` | E | tests |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dto/save-dashboard.dto.spec.ts` | E | nouveau |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/database/migrations/` | E | 1 fichier nouveau ; modèle : `1791300266625-AddPatientVoiceRange.ts` (L) |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/dashboard.controller.ts` | L | si le PUT y transite (Grep d'abord) |

## Contrats
```ts
// dashboard-widget.catalog.ts:117-118
/** Bornes de la grille et du tableau de bord. Grille de 24 colonnes (front : grid.constants.ts). */
export const GRID_COLS = 24
// MAX_ROW 500 · MAX_ROWS_PER_CELL 60 · MAX_TABS 12 · MAX_CELLS_PER_TAB 60 · TAB_NAME_MAX 30 · MAX_LINKS 50 : INCHANGÉS
// WIDGET_SETTINGS, checkConfig, isKnownWidget : INCHANGÉS (aucune clé `_grid`, aucune taille)

// dto/save-dashboard.dto.ts
import { Equals /* + imports existants */ } from 'class-validator'
export class SaveDashboardDto {
	/** Version de grille du client. Absente ou ≠ 24 ⇒ 400 : onglet ouvert avant la mise à jour. */
	@Equals(GRID_COLS, { message: `Grille de ${GRID_COLS} colonnes attendue : rechargez la page` })
	gridCols: number
	// tabs : INCHANGÉ
}
// dashboard-layout.rules.ts — seul le retour change
return { dashboard: { gridCols: dto.gridCols, tabs } }
// dashboard-layout.service.ts
export type DashboardView = { saved: boolean; /** Grille des positions renvoyées ; le front migre ×2 ssi ≠ 24. */ gridCols: number; tabs: /* INCHANGÉ */ }
// get() : { saved, gridCols: GRID_COLS, tabs }

// src/database/migrations/<TS>-ConvertDashboardTo24Cols.ts
import { MigrationInterface, QueryRunner } from "typeorm";

/** Tableau de bord : grille 12 → 24 colonnes. x, w ×2 ; y, h inchangés (module 24 px = ancien pas de rangée). */
export class ConvertDashboardTo24Cols<TS> implements MigrationInterface {
	name = 'ConvertDashboardTo24Cols<TS>'

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Données 12 col ⇒ x + w ≤ 12 partout (rules.ts:25). Sinon : déjà converties ⇒ refus (transaction annulée).
		const converted = await queryRunner.query(`SELECT 1 FROM "dashboard_cell" WHERE "x" + "w" > 12 LIMIT 1`);
		if (converted.length > 0) throw new Error('dashboard_cell : case avec x + w > 12, grille déjà en 24 colonnes ? Conversion refusée');
		await queryRunner.query(`UPDATE "dashboard_cell" SET "x" = "x" * 2, "w" = "w" * 2`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// smallint / 2 = division entière ⇒ floor ; (w + 1) / 2 = ceil.
		await queryRunner.query(`UPDATE "dashboard_cell" SET "x" = "x" / 2, "w" = GREATEST(1, ("w" + 1) / 2)`);
	}

}
```
Exemples attendus : PUT sans gridCols → 400 « Grille de 24 colonnes attendue : rechargez la page » · PUT gridCols 24 `{x:23,w:1}`,`{x:0,w:24}` → 200 · `{x:20,w:6}` → 400 « La case revenue dépasse la grille ».

## Décisions actées
- back modifié + migration de données, **exécution par l'humain** — humain 2026-10-08
- version de grille au niveau API (`gridCols`), jamais dans `config` (le back refuse les clés inconnues, catalog.ts:109) — T005
- tailles des widgets : source unique côté front, rien dans le back — T005

## Hors périmètre
- Exécuter, générer ou annuler une migration ; redémarrer le back ; toucher au front.
- `UpdateCellConfigDto`, `checkConfig`, catalogue des réglages.

## Environnement
- le hook `garde_bash.py` refuse toute commande Bash contenant les scripts de migration TypeORM : crée le fichier avec Write, ne lance rien qui les contienne
- back en cours d'exécution (`start:dev`, rechargement auto) : tes modifications seront actives dès l'écriture — c'est attendu, l'humain lancera ensuite la migration
- `rg` absent → Grep

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx vitest run:*)`, `Bash(npx tsc --noEmit:*)`, `Bash(git diff:*)`, `Bash(date +%s%3N)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
---
## Livré
- chemin:L — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, dont la commande exacte de migration pour l'humain
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
