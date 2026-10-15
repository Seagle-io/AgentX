---
projet: dashboard-grille
maj: 2026-10-15
tags: [env]
---

# Environnement — dashboard-grille

Conventions : [[conventions-orthopro]] (non recopiées) ; même dépôts que orthopro (voir `vault/projets/orthopro/env.md`). Format : `fait — source`.

## Dépôts et branches
- ortho-front · ortho-back sous `~/Documents/Workspace/OrthoPro/`, branche `master` à l'époque (2026-10-08) — dashboard-grille/T001
- règle OrthoPro : jamais migration ni push sans accord explicite — dashboard-grille/T014
- le cœur de grille change `grid.constants.ts` et `grid.tsx` en parallèle : ne pas y toucher hors tâche — dashboard-grille/T008

## Lancer, tester, linter
- node 24 : `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH` — dashboard-grille/T007
- typecheck front : `npx tsc -b` (peut casser hors de tes fichiers pendant la vague : vérifier seulement tes fichiers) — dashboard-grille/T008
- back : NestJS + class-validator ; tests `npx vitest run <chemin>` depuis le back ; alias `@/` ; `import 'reflect-metadata'` requis dans les specs DTO (modèle `save-dashboard.dto.spec.ts`) — dashboard-grille/T014, dashboard-grille/T006
- `rg` absent dans ces packs → outil Grep — dashboard-grille/T012
- mesure navigateur : Chrome système `executablePath: '/usr/bin/google-chrome'` ; `playwright` importé depuis `ortho-front/node_modules` ; jamais `playwright install` — dashboard-grille/T002, dashboard-grille/T003

## Comptes et données de test
- psql : `localhost`, user/base dans `ortho-back/.env` · DB_USERNAME, DB_DATABASE ; mot de passe `ortho-back/.env` · DB_PASSWORD via `PGPASSWORD="$(grep ^DB_PASSWORD .env | cut -d= -f2-)"`, jamais affiché ; `SELECT` seulement — dashboard-grille/T001
- jeton d'API : `auth_token` du navigateur ; sa lecture est refusée par le classifieur (« Credential Exploration ») → gate lancée par l'humain/chef — dashboard-grille/T007
- compte de test : données de démo présentes (8 patients, factures) ; modules messagerie/documents/facturation parfois absents → widget indisponible = NV, pas défaut — dashboard-grille/T013
- messagerie non configurée en local (clé absente) : `unread-messages`/`quick-reply` en erreur → noter, ne pas contourner — dashboard-grille/T003
- contraintes API layout : UUID, `y ≤ 500`, `tabs ≥ 1`, `gridCols` 24 obligatoire (PUT sans → 400) — dashboard-grille/T002, dashboard-grille/T007

## Versions
- grille cible 24 colonnes, module carré 24-48 px ; px à module 24 = 40n − 16 (w5 = 184 px, w9 = 344 px) — dashboard-grille/T008
- avant : 12 col fluides, rangée 24 px, gouttière 16 px — dashboard-grille/T001
- vitest ^4 côté back — dashboard-grille/T014

## Ports, URL, fuseau
- front `http://localhost:5173` (Vite, master) et back `:3000` (`start:dev`, rechargement auto) déjà lancés : ne pas les relancer — dashboard-grille/T013
- écrire un fichier back = actif aussitôt (rechargement auto) ; l'humain lance ensuite la migration — dashboard-grille/T006
- base migrée en 24 col avant T007/T013 (gate étape 0 par l'humain) — dashboard-grille/T007, dashboard-grille/T013
- Playwright attend chromium 1243, absent — dashboard-grille/T002

## Rouge d'avance
- `date %3N` non tronqué sur cette machine — dashboard-grille/T006
- forum : hauteur mesurée non fiable (corps hors flux) ; 7 widgets non mesurés (messaging/documents/billing) — dashboard-grille/T003, dashboard-grille/T004

## Interdits
- garde `garde_bash` : toute commande Bash contenant `migration:run|generate|revert|create` refusée → créer le fichier avec Write, citer la commande dans `result.md` — dashboard-grille/T005, dashboard-grille/T006
- lecture `ortho-back` / `.env` / psql hors autorisation explicite du pack : refusée par le classifieur — dashboard-grille/T001, dashboard-grille/T004
- Docker : conteneur jetable `glverif-pg-t014` (`POSTGRES_PASSWORD` factice, pas de port publié) ; jamais `prune` / `volume rm` — dashboard-grille/T014

## Bancs et scripts de référence
- `$S` = scratchpad de la tâche (éphémère) pour les scripts de mesure — dashboard-grille/T007
