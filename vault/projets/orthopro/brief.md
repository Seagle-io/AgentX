---
projet: orthopro
titre: OrthoPro — front et back
statut: cadrage
objectif: faire évoluer OrthoPro (front Vite + back NestJS) sur la branche Ultime par vagues d'agents
cree: 2026-10-05
produit: kora
---

# Brief — OrthoPro — front et back

## Objectif
Faire évoluer OrthoPro (front + back) par vagues d'agents, sur la branche `Ultime`,
hors production. Le périmètre précis de chaque vague est cadré via `/projet`.

## Definition of Done du projet
Vague « widgets du dashboard » (ortho-front, branche `Ultime`) :
- [ ] 100 % des `*.util.ts` du dashboard ont un `*.util.test.ts` couvrant chaque export — `node --test 'src/**/*.test.ts'` vert
- [ ] chaque widget rend un état chargement / erreur / vide explicite via le kit UI (pas de case blanche)
- [ ] mode édition : ajout, déplacement, redimensionnement, suppression, undo/redo testés unitairement (`layout-ops`) et en Playwright (`e2e/dashboard/*.spec.ts`)
- [ ] `npm run typecheck` et `npm run lint` verts, 0 `any` nouveau
- [ ] défauts H du top 10 éclaireur corrigés, vérifiés par le `verificateur`
- [ ] 1 commit local par lot sur `Ultime`, recette humaine sur captures

## Contraintes dures
- Deux dépôts GitHub distincts, tous deux sur la branche **`Ultime`** :
  - back : `~/Documents/Workspace/OrthoPro/ortho-back` (NestJS, vitest) — `git@github.com:Seagle-io/ortho-back.git`
  - front : `~/Documents/Workspace/OrthoPro/ortho-front` (Vite + Playwright e2e) — `git@github.com:Seagle-io/ortho-front.git`
- Règles du projet (`OrthoPro/RULE.MD`) :
  - **jamais** de création ni d'exécution de migration sans accord explicite de l'utilisateur ;
  - **jamais** de `git push` sans accord explicite de l'utilisateur ;
  - front : réutiliser le kit UI (page showcase, module `showCase`), ne pas recréer de composants.
- Pas de production : environnement de développement uniquement.

## Hors périmètre
- nouveaux widgets (reporté)
- back `ortho-back` (cette vague)
- refonte visuelle du kit UI

## Hypothèses retenues
- tests unitaires = `node:test` (runner `test:unit`), pas vitest côté front — invalidé si T001 trouve une config vitest

## Questions ouvertes
- ∅

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| Code back | `OrthoPro/ortho-back/src` | NestJS, tests vitest, Makefile, docker-compose |
| Code front | `OrthoPro/ortho-front/src` | Vite, e2e Playwright, `CLAUDE.md` local |
| Règles | `OrthoPro/RULE.MD`, `RULES_CLAUDE.MD` | migrations/push interdits sans accord |
| Plans fonctionnels | `OrthoPro/PLAN_*.md` | un plan par module (agenda, bilan, facturation…) |
| Backlog | `OrthoPro/task.md`, `Trello.md` | |
