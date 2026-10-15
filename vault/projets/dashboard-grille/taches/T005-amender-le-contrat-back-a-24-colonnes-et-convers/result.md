---
tache: T005
statut: fait
---
## Livré
Contrainte qui décide : back refuse toute clé config inconnue ⇒ pas de marqueur en bande ; base = seul lieu atomique ⇒ conversion SQL globale ; risque restant = fenêtre de versions mixtes ⇒ version au niveau API.
Options : A bête = GRID_COLS 24 + migration, sans version (0 coût ; onglet front 12 ouvert ⇒ PUT demi-largeur silencieux) · B = A + `gridCols:24` PUT requis / GET renvoyé (retenue ; champ API permanent) · C = garder `_grid` autorisé dans checkConfig, sans SQL (2 formats à vie, back ne peut borner x par format). Tailles : back n'a AUCUNE taille (catalog.ts:34-92 = réglages seuls) ⇒ tableau T004 reste source unique côté front, pas de duplication. → decisions.md#2026-10-08 (2e entrée, supersède T004 détection/migration)
```ts
// ═══ BACK (ortho-back/src/modules/Dashboard/layout) ═══
// ── dashboard-widget.catalog.ts:117-118
/** Bornes de la grille et du tableau de bord. Grille de 24 colonnes (front : grid.constants.ts). */
export const GRID_COLS = 24
// MAX_ROW 500 · MAX_ROWS_PER_CELL 60 · MAX_TABS 12 · MAX_CELLS_PER_TAB 60 · TAB_NAME_MAX 30 · MAX_LINKS 50 : INCHANGÉS
// WIDGET_SETTINGS, checkConfig, isKnownWidget : INCHANGÉS (aucune clé `_grid`, aucune taille)

// ── dto/save-dashboard.dto.ts
// DashboardCellDto : décorateurs INCHANGÉS ⇒ x ∈ [0,23] · w ∈ [1,24] · y ∈ [0,500] · h ∈ [1,60] (T004 maxH max = 32 ⇒ OK)
import { Equals /* + imports existants */ } from 'class-validator'
export class SaveDashboardDto {
	/** Version de grille du client. Absente ou ≠ 24 ⇒ 400 : onglet ouvert avant la mise à jour. */
	@Equals(GRID_COLS, { message: `Grille de ${GRID_COLS} colonnes attendue : rechargez la page` })
	gridCols: number
	// tabs : INCHANGÉ
}
// UpdateCellConfigDto : INCHANGÉ

// ── dashboard-layout.rules.ts — seule ligne changée : le retour
//   :25 `cell.x + cell.w > GRID_COLS` INCHANGÉ (lit 24)
return { dashboard: { gridCols: dto.gridCols, tabs } }

// ── dashboard-layout.service.ts
export type DashboardView = {
	saved: boolean
	/** Grille des positions renvoyées ; le front migre ×2 ssi ≠ 24 (back ancien). */
	gridCols: number
	tabs: /* INCHANGÉ */
}
// get() : { saved, gridCols: GRID_COLS, tabs } (import GRID_COLS du catalog) ; save()/updateCellConfig : INCHANGÉS

// ── entity/dashboard-cell.entity.ts:6 commentaire « sur 12 colonnes » → « sur 24 colonnes » ; colonnes INCHANGÉES

// ── src/database/migrations/<TS>-ConvertDashboardTo24Cols.ts   (TS = Date.now() à la création, > 1791300266625 et > toute migration du dossier)
// créée À LA MAIN (hook bloque la commande de création) ; JAMAIS exécutée par un agent
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
		// smallint / 2 = division entière ⇒ floor (x ≥ 0) ; (w + 1) / 2 = ceil. floor(x/2) + ceil(w/2) ≤ ceil((x+w)/2) ≤ 12.
		await queryRunner.query(`UPDATE "dashboard_cell" SET "x" = "x" / 2, "w" = GREATEST(1, ("w" + 1) / 2)`);
	}

}
// Idempotence
// - migration:run 2× → 2e = no-op (nom enregistré dans la table des migrations TypeORM)
// - up rejoué hors TypeORM sur données converties → throw si ∃ x+w>12 (cas réel : DEFAULT today x16 w8) ; si TOUTES les cases tiennent à gauche → ×4 non détecté (limite acceptée)
// - down : perte des x/w impairs créés après up (arrondis) ; down ⇒ redéployer back 12 + front 12
// - préférence legacy `dashboardWidgets` (readTabs) : NON couverte par SQL → convertie côté front (ci-dessous)

// ═══ FRONT — delta vs contrat T004 (le reste de T004 tient verbatim) ═══
// ── grid.constants.ts : SUPPRIMER GRID_MARK_KEY, GRID_MARK ; GARDER LEGACY_COLS = 12
// ── dashboard-layout.util.ts
export const migrateLegacyCells = <C extends Box>(cells: readonly C[]): C[]   // GARDÉE (T004 verbatim) ; facteur = GRID_COLS / LEGACY_COLS
export const cleanLayout = (items: unknown[], hasModule: (key: string) => boolean, catalog: LayoutCatalog, opts?: { legacy?: boolean }): LayoutCell[] // GARDÉE T004
// SUPPRIMÉES : isLegacyLayout, stripMark (n'existent pas dans le code actuel ⇒ ne pas créer)
// fromServer : legacy = layout.gridCols !== GRID_COLS ; cells → { i: id, ...cell } (config telle quelle) → cleanLayout(…, { legacy })
// readTabs   : toujours cleanLayout(…, { legacy: true }) — préf. = 12 col figées, plus jamais écrites
// toServer   : INCHANGÉ (code actuel :176-183), aucun marqueur
// ── src/api/dashboard-layout.ts
export type DashboardLayout = { saved: boolean; gridCols?: number; tabs: /* INCHANGÉ */ }  // absent = back 12 col
// fonction PUT : corps = { gridCols: GRID_COLS, tabs } (import grid.constants) ; signature appelant INCHANGÉE
// PATCH config : INCHANGÉ (plus de marqueur)

// Invariants (remplacent T004 I3 ; I1, I2, I4, I5, I6 tenus)
// J1 base = 24 col uniquement après migration ; aucune lecture serveur n'est migrée si gridCols === 24
// J2 tout PUT porte gridCols: 24 ; back 24 refuse sinon (400) ⇒ aucune écriture 12 col en base 24
// J3 aucun `_grid` nulle part (back le refuse : 400 « Réglage inconnu »)
// Exemples
// PUT { tabs:[…{x:0,w:24},{x:23,w:1}] } sans gridCols → 400 "Grille de 24 colonnes attendue : rechargez la page"
// PUT { gridCols:24, tabs:[…{x:23,w:1},{x:0,w:24}] } → 200 ; GET → { saved:true, gridCols:24, … }
// PUT { gridCols:24, …{x:20,w:6} } → 400 "La case revenue dépasse la grille"
// up : (x8,w4) → (16,8) · (0,12) → (0,24) ; down : (23,1) → (11,1) · (13,11) → (6,6) · (0,24) → (0,12)
```
Ordre de déploiement (tranché) :
- dev : lot B codé → humain arrête le back → humain lance la migration (`npm run migration:run` NV nom de script) → back redémarré → gates curl → lots front
- prod : 1 release back (code B + migration) : arrêt de TOUTES les instances back (pas de roulant) → migration → back 24 → front 24 aussitôt
- fenêtre back 24 + front 12 (onglets ouverts) : GET affiché bridé par l'ancien fitCell ; PUT → 400 « rechargez » ⇒ 0 corruption
- fenêtre front 24 + back 12 (ordre violé) : gridCols absent ⇒ affichage ×2 correct ; PUT → 400 (x>11/w>12) sauf layout tenant à gauche ⇒ ne pas inverser
- interdit : back 24 sans migration (GET gridCols 24 sur données 12 ⇒ demi-largeur persistée au 1er PUT)

Lots finaux (B = ortho-back/src ; F = ortho-front/src/modules/dashboard ; W = F/components/widget). Dépôts distincts ⇒ 0 doublon. Ordre : B → migration humaine → F0, F1–F4 parallèles → F5. IDs T004 (T005–T010) à renuméroter : collision avec cette tâche.
- **B back (8)** : B/modules/Dashboard/layout/{dashboard-widget.catalog.ts, dto/save-dashboard.dto.ts, dashboard-layout.rules.ts, dashboard-layout.service.ts, entity/dashboard-cell.entity.ts, dashboard-layout.rules.spec.ts, dto/save-dashboard.dto.spec.ts (NOUVEAU)} · B/database/migrations/<TS>-ConvertDashboardTo24Cols.ts (NOUVEAU)
  DoD : rules.spec — helper `dashboard()` + `gridCols: 24` ; :28-30 `{x:10,w:4}` → `{x:20,w:6}` (KO) ; + accepte `{x:0,w:24}` et `{x:23,w:1}` ; :17 attendu `{ dashboard: { gridCols: 24, tabs: … } }` · dto.spec (plainToInstance + validate) : x 23 OK / 24 KO, w 24 OK / 25 KO, gridCols absent KO / 12 KO / 24 OK · catalog.spec INCHANGÉ · `npx vitest run src/modules/Dashboard/layout` + `npx tsc --noEmit` → sorties collées · migration ni lancée ni générée par l'agent
- **F0 cœur (10)** : liste T004 « T005 cœur » verbatim (grid.constants, util, util.test, dashboard-widgets.tsx, grid.tsx, layout-ops.core(.test), W/types.ts, src/api/dashboard-layout.ts, showCase/DashboardWidgetsSection.tsx)
  DoD révisée : étape 0 curl (back B + migration) PUT sans gridCols → 400 ; PUT gridCols 24 `{x:0,w:24}`,`{x:23,w:1}` → 200 ; GET → `gridCols:24` (sinon BLQ) · étape 0bis Grep `dashboardWidgets` dans ortho-front/src : toute ÉCRITURE de la préf. ⇒ BLQ · tests util : 6 exemples migrateLegacyCells ; fromServer gridCols 24 → non migré, absent → ×2 ; toServer sans `_grid` ; readTabs objets migrés / liste non migrée ; Grep `_grid|GRID_MARK|isLegacyLayout|stripMark` → ∅ · reste DoD T004 (catalogue fictif 24, boundsOf, tsc)
- **F1 agenda/patients (12)** · **F2 facturation/docs/messagerie/forum/compte (12)** · **F3 perso/plaisir (12)** · **F4 hors WidgetCard (11)** : = T004 T006/T007/T008/T009 verbatim, inchangés
- **F5 e2e (4)** : ortho-front/e2e/dashboard/{ajout-widget,persistance,deplacement}.spec.ts (T004 verbatim) + `grille-24.spec.ts` remplace migration-grille.spec.ts : GET `gridCols===24` ; PUT sans gridCols → 400 ; enregistrement UI → GET : cases sans `_grid`, x+w ≤ 24
## Vérifié comment
- catalog.ts:118 GRID_COLS=12 · :119-124 MAX_ROW 500, MAX_ROWS_PER_CELL 60 · :34-92 réglages seuls, 0 taille · :101-115 checkConfig, :109 clé inconnue ⇒ erreur
- dto.ts:14 `@Max(GRID_COLS - 1)` x · :17 y ≤ MAX_ROW · :20 `@Max(GRID_COLS)` w · :23 h ≤ 60 · :52-59 SaveDashboardDto tabs seul
- rules.ts:25 `x + w > GRID_COLS` · :32 retour `{ dashboard: { tabs } }`
- service.ts:13-17 DashboardView · :35-48 get · :55-86 save (delete+save cases, transaction) · :89-101 PATCH = fusion + checkConfig
- dashboard-cell.entity.ts:12 table `dashboard_cell` · :28-38 x,y,w,h smallint · :40 config jsonb · :6 commentaire 12 col
- dashboard-tab.entity.ts:10 `dashboard_tab`, aucune géométrie
- rules.spec.ts:10-12 helper, :17 retour attendu, :28-30 dépassement {x10,w4} · catalog.spec.ts : 0 test de grille
- migration modèle 1791300266625:1-14 (queryRunner.query, guillemets doubles)
- front util.ts:115-127 cleanLayout, :143-159 readTabs (préf. brute), :162-170 fromServer, :176-183 toServer — isLegacyLayout/stripMark ∅ dans le code
- preuves PUT pack : 400 x>11/w>12 ⇔ dto.ts:14,20 ; 400 `_grid` ⇔ catalog.ts:109 ; 200 {x0,w5} config {}
- borne down : floor(a/2)+ceil(b/2) ≤ ceil((a+b)/2) ; (23,1)→(11,1) ; (1,23)→(0,12)
## Écarts
- lecture hors WL : ∅
- NV : route PATCH réelle (404 pack ; contrôleur hors WL) — sans objet, marqueur abandonné · options ValidationPipe (skipMissingProperties ⇒ gridCols absent passerait ; dto.spec le couvre hors pipe seulement) · nom du script de migration et de la table des migrations · écriture front de la préf. `dashboardWidgets` (gate F0)
## Pour la suite
- Back = GRID_COLS 24 + `gridCols:24` requis au PUT / renvoyé au GET ; base convertie 1 fois par SQL (humain)
- INTERDIT : `_grid` ou toute clé de version dans `config` ; dupliquer les tailles widgets côté back
- INTERDIT : back 24 servi sans migration, ou ancien back vivant après migration (pas de déploiement roulant)
- Front : migration ×2 seulement si `gridCols !== 24` ou préf. legacy ; INTERDIT d'écrire `dashboardWidgets`
- Point de non-retour : 1ère migration prod + 1ère édition 24 col (x/w impairs ⇒ down avec perte)
## Retour sur le pack
- Manquait: contrôleur Dashboard (route PATCH réelle, ValidationPipe global) · src/api/dashboard-layout.ts (type DashboardLayout, fonction PUT) · package.json back (script migration) · lieu d'écriture de la préf. `dashboardWidgets`
- Inutile: dashboard-widget.catalog.spec.ts (0 test de grille) · dashboard-tab.entity.ts (0 géométrie)
