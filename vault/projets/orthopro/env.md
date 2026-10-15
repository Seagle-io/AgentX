---
projet: orthopro
maj: 2026-10-15
tags: [env]
---

# Environnement — orthopro

Conventions : [[conventions-orthopro]] (non recopiées). Format : `fait — source`.

## Dépôts et branches
- ortho-back (NestJS) · ortho-front (Vite) sous `~/Documents/Workspace/OrthoPro/` — `.claude/skills/conventions-orthopro/SKILL.md:L8`
- branche de travail `Ultime` ; checkout constaté `master` sur les 2 dépôts au 2026-10-15 → `git branch --show-current` avant d'écrire — idem:L8
- arbre ortho-front modifié en parallèle par d'autres lots (34-35 `M` non commités le 2026-10-05) — orthopro/T003
- utils non suivis par git → `git diff --stat` inopérant, prévoir `sha256sum` — orthopro/T031
- copies locales = working-tree, pas HEAD — orthopro/T017

## Lancer, tester, linter
- front, cwd `ortho-front` : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` — orthopro/T001
- tests : `npm run test:unit` (node:test, util seulement, 0 test .tsx) — orthopro/T001, orthopro/T040
- test ciblé : `node --test <fichier>.test.ts` — orthopro/T014
- typecheck : `npm run typecheck` = `tsc -p tsconfig.app.json --noEmit && … e2e … && … node …` ; 22 s à froid — orthopro/T003
- imports relatifs avec suffixe `.ts` dans tout `*.util.ts` testé (`@/` non résolu par node:test) — orthopro/T009, orthopro/T025
- e2e : `npx tsc -p tsconfig.e2e.json` ; run `make test-e2e` réservé à l'humain — orthopro/T042
- lint ciblé : `npx eslint src/modules/dashboard e2e/dashboard` — orthopro/T042

## Comptes et données de test
- e2e : session `.fixtures/session.json` écrite par `global-setup` ; seed layout via `e2e/support/backend.ts:135-147` (`seedDashboardLayout`, `getDashboardLayout`) — orthopro/T042
- DB d'une tâche e2e : `ortho_test` ; rôle `kora` sans CREATEDB ni superuser — orthopro/T042
- identifiants BDD : `ortho-back/.env` · DB_USERNAME, DB_DATABASE, DB_PASSWORD — dashboard-grille/T001
- jeton d'API : lecture `auth_token` refusée par le classifieur → gate lancée par l'humain/chef — dashboard-grille/T007

## Versions
- node 24.15.0 requis (`.nvmrc` 24) ; node 22.22.1 système → `ERR_UNKNOWN_FILE_EXTENSION ".ts"`, 58 KO — orthopro/T001, orthopro/T003
- RGL ^2.2.4 — voir [[rgl-v2-api-reelle]] — conventions-orthopro:L25
- Playwright attend chromium_headless_shell-1243 ; 1234 installé — conventions-orthopro:L16

## Ports, URL, fuseau
- back dev `:3000` (`start:dev`, rechargement auto), front dev `:5173` — dashboard-grille/T013 (2026-10-08)
- H: `:4000` « node OrthoPro » — geolens-viewer/T033 (2026-10-07)
- stack e2e `127.0.0.1:5183` : interdite aux agents ; `000` au curl = e2e NV — conventions-orthopro:L17
- page dashboard `/dashboard` ; widgets `clock` 4×7 minW2 minH4, `greeting` minW 6 — orthopro/T042
- `TZ=` vide = UTC sous Node → tester `TZ=Europe/Paris` et `TZ=America/Martinique` — orthopro/T014, orthopro/T039

## Rouge d'avance
- lint repo-wide KO : 755 erreurs / 816 problèmes (2026-10-05), 801 (T006) → préexistant, ne pas isoler — orthopro/T003, orthopro/T006
- DoD lint = fichiers de la WL, pas global — orthopro/T005
- `test:unit` instable pendant une vague : fails hors WL d'un lot concurrent (pomodoro, clock.probe P11/P12) — orthopro/T028, orthopro/T019
- sondes `*.probe.test.ts` d'autres vérificateurs polluent `test:unit` — orthopro/T018
- base `test:unit` : 300 (2026-10-05) → 406 ; 353 ≠ 315 selon l'instant — orthopro/T003, orthopro/T025

## Interdits
- `git stash`, checkout --, reset, clean : arbre partagé (incident `stash -u` + pop refusé) — orthopro/T006
- jamais `git push`, jamais migration, jamais `make deploy` — l'humain les lance ; tâche en `bloque` + commande exacte — conventions-orthopro:L47
- `make test-e2e` : migrations + seed + `fuser -k 3000 5183` → refusé par le classifieur — orthopro/T042
- `psql CREATE DATABASE ortho_test` refusé (permission) — orthopro/T042
- garde Bash refuse toute commande contenant un script de migration : fichier via Write — dashboard-grille/T005

## Bancs et scripts de référence
- e2e : `npx playwright test e2e/dashboard` (4 fichiers, 6 tests) ; viewport 1440×900 — conventions-orthopro:L39
- mutation par copie (vérificateur sans Edit) — orthopro/T031
