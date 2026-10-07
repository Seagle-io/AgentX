---
projet: geolens-viewer
titre: GeoLens Web — sécurité et exploitation
statut: cadrage
objectif: geolens-web sans les failles confirmées de l'audit du 28/09 et déployable en exploitation (config sûre, CSP, journaux propres, sauvegarde/restauration), base de tests verte
cree: 2026-10-07
depot: /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
tags: [projet, geolens, securite]
---

# Brief — GeoLens Web — sécurité et exploitation

## Objectif
Fiabiliser l'existant : retirer les failles de sécurité confirmées par l'audit (volet « Stabilisation ») et rendre l'instance exploitable (config de prod sûre, en-têtes + CSP, journaux sans jetons, sauvegarde + restauration testée).

## Definition of Done du projet
- [ ] PT-1 à PT-7 corrigés, chacun avec un test de non-régression API qui échouait avant
- [ ] XSS viewer : champs de manifeste échappés, `showToast` en `textContent`, XSS réfléchie `viewer.html?project=` corrigée, data-URL de POI filtrées, sidecars JSON validés à l'écriture
- [ ] jeton de tuile ajouté seulement aux URLs de l'origine API
- [ ] relais de part d'upload borné (concurrence ou flux)
- [ ] `npm audit` API : fastify, nodemailer, find-my-way, fast-uri corrigés sans montée majeure ; email d'invitation borné
- [ ] config : `assertProductionConfig` refuse de démarrer en prod avec variable critique absente ou mode dev ; compose prod en `${VAR:?}` ; secret worker obligatoire + `hmac.compare_digest`
- [ ] journaux : aucun query string loggé ; rotation Docker (`max-size`/`max-file`) + `log` Caddy
- [ ] en-têtes : CSP portail + viewer sans `unpkg`, `frame-ancestors`, `nosniff`, `Referrer-Policy` ; décodeurs DRACO/KTX2 servis depuis le bundle
- [ ] sauvegarde : script `pg_dump` + copie MinIO ; runbook de restauration joué sur une instance vierge (sortie collée)
- [ ] `npm run typecheck && npm run lint && npm test && npm --prefix web test` verts, sortie collée ; preuves `proof-*.mjs` concernées vertes sous Linux
- [ ] chaque lot d'implémentation passé au `verificateur`

## Contraintes dures
- règles du dépôt (`G/CLAUDE.md`, `G/.claude/rules/*`) : `main.ts`, `workspace.ts`, `server.ts` ne grossissent pas (nouveau code en module dédié) ; fichier neuf ≤ 400 l, fonction ≤ 60 l ; 0 `any`, 0 `@ts-ignore` ; `process.env` seulement dans `api/src/config.ts` ; toute entrée validée par schéma ; fix = test de non-régression ; route = test 401 + test autre-org
- 0 dépendance ajoutée sans justification écrite ; pas de montée majeure (jspdf, maplibre)
- isolation multi-tenant : ne pas régresser (le pentest la juge saine)
- agents : ni commit, ni push, ni migration exécutée ; pas de `.md` à la racine (doc → `docs/`) ; `seed-data/` intouché
- comportement de partage inter-organisations inchangé

## Hors périmètre
- modèle de partage inter-org (décision produit non tranchée)
- jspdf 4, maplibre 6
- refonte architecture (découpage `server.ts`, façade viewer, contrats partagés), état externalisé multi-réplica
- RGPD : politique de confidentialité, rétention, export, effacement complet
- worker : déploiement Docker, lecture LAS bornée, tenant des jobs (seul le secret obligatoire est dans le périmètre)
- 2FA, rôle lecteur, CI

## Hypothèses retenues
- le code de `G` est celui audité le 28/09 (fichiers datés 11/09) — à invalider si un éclaireur trouve une coordonnée d'audit fausse
- PT-2 sans migration : version de mot de passe dérivée du hash, portée dans le JWT — à invalider si l'architecte trouve une colonne existante ou impose une migration (alors accord humain)
- Docker 29.6 dispo sur la machine → restauration testable en local — à invalider si `docker compose up` échoue

## Questions ouvertes
- ∅

## Carte du terrain
G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` (pas de `.git` ; copie de référence : `AgentX/.cache/geolens-baseline-2026-10-07`, diff par `diff -r`)

| Quoi | Où | Note |
|---|---|---|
| API | `G/api/src/server.ts` | 3387 l, ~80 routes, gelé |
| Config | `G/api/src/config.ts` | seul lecteur de `process.env` |
| Viewer | `G/web/src/viewer/main.ts` | 9404 l, gelé |
| Backend viewer | `G/web/src/viewer/backend/HttpBackend.ts:82` | `window.glrAPI` |
| Signature URL | `G/web/src/viewer/backend/install.ts:104` | `window.__glrSignUrl` |
| Route storage | `G/api/src/server.ts:725` | tuiles signées |
| Iframe viewer | `G/web/src/pages/Project.tsx:108` | |
| Infra | `G/docker-compose*.yml`, `G/Caddyfile`, `G/web/nginx.conf` | 3 compose |
| Audit | `AgentX/.cache/geolens-audit/*.txt` | synthèse, axes 1-4, pentest, archi |
| Preuves e2e | `G/e2e/proof-*.mjs` | 52 scripts, chemin `C:/tmp/glw-proofs/` en dur |
| Base 2026-10-07 | typecheck OK · lint 0 err 1 warn · api 64 fichiers 571 tests · web 172 fichiers 1665 tests | node v22.22.1 |
