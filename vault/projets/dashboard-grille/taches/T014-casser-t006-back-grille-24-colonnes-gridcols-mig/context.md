---
pack: T014
projet: dashboard-grille
role: verificateur
cree: 2026-10-13
---

# Pack T014 — Casser T006 : back grille 24 colonnes, gridCols, migration x/w

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer le livrable T006 du back OrthoPro (grille 24 colonnes, champ d'API `gridCols`, migration SQL x/w ×2) : validation, bornes, réponse GET, migration up/down sur une base jetable ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

B = `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back` (branche Ultime ; T006 NON commité dans l'arbre — ne rien committer, ne rien annuler)

## Definition of Done
- [ ] base : `npx vitest run src/modules/Dashboard/layout` et `npx tsc --noEmit` depuis B → synthèses collées
- [ ] DTO : `gridCols` absent, `null`, `"24"`, `24.0`, `25`, `12`, tableau → 400 ? ValidationPipe global (main.ts:22-25 : whitelist true, forbidNonWhitelisted false) : une clé inconnue (`_grid`) est-elle retirée en silence ? `skipMissingProperties` absent ? (D décisions : si présent, gridCols absent passerait)
- [ ] bornes : x ∈ [0, 23], w ∈ [1, 24], x + w ≤ 24 (rules.ts:25) ; `{x:0,w:24}`, `{x:23,w:1}` OK ; `{x:23,w:2}`, `{x:24,w:1}`, `{x:-1}`, `{w:0}`, `{w:25}` refusés ; message 400 de gridCols = « Grille de 24 colonnes attendue : rechargez la page »
- [ ] GET : `DashboardView.gridCols === 24` toujours (service.ts) ; défaut sans disposition enregistrée → gridCols présent ?
- [ ] migration (conteneur jetable `glverif-pg-t014`, image `postgres:16` locale, 0 pull) : créer la table `dashboard_cell` minimale (colonnes x, w smallint + id) et jouer le SQL `up` puis `down` À LA MAIN (psql), pas via TypeORM : jeu 12 col (x+w ≤ 12, dont w=12, w=1, x=11) → up ×2 exact ; up rejoué → refus (garde x+w>12) ; MAIS rejoué sur une base où toutes les cases tiennent ≤ 12 après up (ex. seules cases x=0,w≤6 avant) → ×4 non détecté : chiffrer ; down sur valeurs 24 col impaires (x=23,w=1 ; x=13,w=11 ; x=1,w=23) → x+w ≤ 12 toujours ? chevauchements créés ? smallint : débordement possible ?
- [ ] fenêtre de déploiement : back 24 + données 12 non migrées → GET renvoie gridCols 24 sur positions 12 → le front ne migre pas : confirmer (constat, pas défaut — D2 2026-10-08)
- [ ] verdict + reproductions ; tests de casse UNIQUEMENT `B/src/modules/Dashboard/layout/verif-t014-*.spec.ts` (listés dans result.md, laissés en place) ; SQL de repro dans result.md
- [ ] nettoyage : `docker rm -fv glverif-pg-t014` ; `docker ps -a --filter name=glverif- -q` → ∅ collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dto/save-dashboard.dto.ts` | L | 69 l, gridCols :54-55, bornes :14-20 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dto/save-dashboard.dto.spec.ts` | L | modèle validate() |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.ts` | L | 33 l |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.rules.spec.ts` | L | modèle checkDashboard |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-layout.service.ts` | L | 135 l, DashboardView |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/dashboard-widget.catalog.ts` | L | :110-124 constantes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/layout/entity/dashboard-cell.entity.ts` | L | colonnes x, w |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/database/migrations/1791478545214-ConvertDashboardTo24Cols.ts` | L | up/down |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-back/src/main.ts` | L | :20-30 ValidationPipe |

## Contrats
```ts
// catalog.ts:118
export const GRID_COLS = 24
// save-dashboard.dto.ts
	@IsInt() @Min(0) @Max(GRID_COLS - 1)   // x (:14)
	@IsInt() @Min(1) @Max(GRID_COLS)       // w (:20)
	@Equals(GRID_COLS, { message: `Grille de ${GRID_COLS} colonnes attendue : rechargez la page` })
	gridCols: number
// rules.ts:25 / :32
			if (cell.x + cell.w > GRID_COLS) return { error: `La case ${cell.widget} dépasse la grille` }
	return { dashboard: { gridCols: dto.gridCols, tabs } }
// service.ts : DashboardView.gridCols: number ; renvoyé gridCols: GRID_COLS
```
```sql
-- migration up
SELECT 1 FROM "dashboard_cell" WHERE "x" + "w" > 12 LIMIT 1;   -- ligne → throw « grille déjà en 24 colonnes ? »
UPDATE "dashboard_cell" SET "x" = "x" * 2, "w" = "w" * 2;
-- down
UPDATE "dashboard_cell" SET "x" = "x" / 2, "w" = GREATEST(1, ("w" + 1) / 2);
```

## Décisions actées
- 2026-10-08 (2ᵉ bloc decisions.md) : GRID_COLS=24 back, migration lancée par l'humain, `gridCols` requis @Equals(24), GET renvoie 24 ; ordre arrêt back → migration → back 24 → front 24
- down perd la parité (x, w impairs arrondis) : accepté ; ×4 si migration rejouée hors TypeORM : risque connu, à CHIFFRER pas à corriger

## Hors périmètre
- toute édition hors `verif-t014-*.spec.ts` ; front (ortho-front) ; commit, push, `npm run migration:*`, TypeORM CLI (interdits, hook garde_bash)
- base de dev/locale du projet : 0 accès ; seule base = conteneur jetable
- `git stash`/`checkout`/`reset` dans B : jamais (T006 non commité)

## Environnement
- NestJS + class-validator ; vitest ^4 (`npx vitest run <chemin>` depuis B) ; alias `@/` ; `import 'reflect-metadata'` requis dans les specs DTO (idiome de save-dashboard.dto.spec.ts)
- docker : images locales `postgres:16`, `postgres:16-alpine` ; conteneur `glverif-pg-t014` (`-e POSTGRES_PASSWORD=verif`, pas de port publié, `docker exec … psql -U postgres`) ; jamais prune / volume rm
- règle OrthoPro : jamais migration ni push sans accord explicite

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npx vitest, npx tsc --noEmit, rg, docker run/exec/rm -fv glverif-pg-t014, git -C B status/diff), Write (verif-t014-*.spec.ts, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom ; jamais de nettoyage global.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T014
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- défaut n : symptôme · repro (fichier:cas ou SQL) · gravité
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
