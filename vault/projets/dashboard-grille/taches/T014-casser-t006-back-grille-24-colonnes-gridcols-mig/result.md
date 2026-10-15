---
tache: T014
statut: fait
verdict: OK
---
## Livré
- 0 défaut reproductible ; 31 cas de casse verts
- tests : `B/src/modules/Dashboard/layout/verif-t014-dto.spec.ts` (29 : pipe main.ts réel, gridCols ×11, bornes ×17, x/w absents), `verif-t014-get.spec.ts` (2) — laissés en place
- gridCols absent/null/"24"/25/12/[24]/{}/true/24.5 → 400, message exact « Grille de 24 colonnes attendue : rechargez la page » ; 24 et 24.0 → OK
- `_grid` inconnue → retirée en silence (whitelist) ; `_grid` sans gridCols → 400 ; skipMissingProperties ∅ (main.ts:22-26, 0 autre ValidationPipe/UsePipes dans src)
- bornes : {0,24} {23,1} {12,12} OK ; {23,2} {13,12} → rules ; {24,1} {-1,1} {0,0} {0,25} {0,-1} x=1.5 x="0" null 1e20 NaN → DTO 400
- GET : 0 disposition → `{saved:false,gridCols:24,tabs:[]}` ; positions 12 (x6,w6) → gridCols 24, x/w intacts : fenêtre de déploiement confirmée (constat D2)
- migration up ×2 exacte (jeu A) ; up rejoué → refus (garde) ; aller-retour 12→24→12 = identité 78/78 couples
- ×4 non détecté ssi TOUTES les lignes de la table (tous praticiens) ont x+w ≤ 6 avant up ; ×8 ssi toutes ≤ 3 ; résultat reste ≤ 24 (données valides, mise en page ×2 trop large) ; 1 seule case x+w > 6 dans la table → rejeu refusé
- down : max x+w = 12 sur les 300 couples 24 col valides → jamais hors grille ; MAIS 650 paires (a avant b, même rangée, disjointes en 24) se chevauchent après down — ex. (0,1)+(1,1) → (0,1)+(0,1) ; accepté (perte de parité, décision 2026-10-08)
- smallint : débordement seulement sur données hors DTO (x=32767,w=-32767 → up `smallint out of range`, 0 écriture) ; non atteignable via API
SQL de repro (psql, conteneur jetable) :
```sql
CREATE TABLE dashboard_cell (id text PRIMARY KEY, y smallint NOT NULL DEFAULT 0, x smallint NOT NULL, w smallint NOT NULL);
CREATE PROCEDURE up() LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (SELECT 1 FROM "dashboard_cell" WHERE "x" + "w" > 12 LIMIT 1) THEN RAISE EXCEPTION 'deja 24'; END IF; UPDATE "dashboard_cell" SET "x" = "x" * 2, "w" = "w" * 2; END $$;
CREATE PROCEDURE down() LANGUAGE plpgsql AS $$ BEGIN UPDATE "dashboard_cell" SET "x" = "x" / 2, "w" = GREATEST(1, ("w" + 1) / 2); END $$;
INSERT INTO dashboard_cell(id,x,w) VALUES ('b1',0,6),('b2',0,3),('b3',2,4),('b4',5,1);
CALL up(); CALL up();  -- b1 (0,24) b2 (0,12) b3 (8,16) b4 (20,4) : x4 silencieux ; 3e CALL → refus
TRUNCATE dashboard_cell; INSERT INTO dashboard_cell(id,x,w) VALUES ('d4',0,1),('d5',1,1); CALL down();  -- d4=d5=(0,1) chevauchement
```
## Vérifié comment
- `npx vitest run src/modules/Dashboard/layout` (avant ajout) → `Test Files 3 passed (3) · Tests 15 passed (15)`
- `npx tsc --noEmit` (après ajout) → `tsc exit=0`
- `npx vitest run src/modules/Dashboard/layout/verif-t014` → `Test Files 2 passed (2) · Tests 31 passed (31)`
- `rg -n "ValidationPipe|UsePipes|skipMissing" src` → seul main.ts:22 (+ 3 commentaires)
- `git -C B diff rules.ts dto catalog` → avant T006 : GRID_COLS=12, rules x+w ≤ 12 déjà ⇒ garde up valide sur données réelles
- `docker run -d --name glverif-pg-t014 --pull never -e POSTGRES_PASSWORD=verif postgres:16` → `743460bbd79e…` ; psql : A.up1 full(0,24) mid(12,24) x11(22,2) w1(0,2) a(6,8) ; A.up2 → `ERROR: … Conversion refusee` ; C.exhaustif → `max_sum 12 | n 300` ; C.chevauchements → `650` ; D.roundtrip → `ecarts 0 | n 78`
- `docker rm -fv glverif-pg-t014` → `glverif-pg-t014` ; `docker ps -a --filter name=glverif- -q | wc -l` → `0`
- `git -C B status --short` → T006 inchangé + 2 `?? verif-t014-*.spec.ts`
- NV — migration via TypeORM (interdit) : up/down rejoués en SQL équivalent (procédures plpgsql)
## Écarts
- lecture hors WL: `B/src/modules/Dashboard/layout/dashboard-layout.controller.ts` (rg ciblé) — @Body() SaveDashboardDto lié à save:30
- lecture hors WL: `rg ValidationPipe src` — exclure un pipe local avec skipMissingProperties
## Pour la suite
- T006 back : OK, 0 défaut ; migration sûre si lancée une fois via TypeORM (table `migrations` empêche le rejeu)
- rejeu manuel hors TypeORM : ×4 silencieux seulement si toute la table a x+w ≤ 6 — base quasi vide ; sinon refus
- down crée des chevauchements (650 paires possibles) : si rollback réel, prévoir compaction côté front
- fenêtre back 24 + données 12 : GET dit 24 sur positions 12 → ordre arrêt back → migration → back est obligatoire
## Retour sur le pack
- Manquait: result.md de T006 (claims implémenteur non rejoués 1 à 1, DoD base faite à la place) ; controller.ts (liaison @Body)
- Inutile: ∅
