---
projet: geolens-viewer
titre: GeoLens Web — sécurité et exploitation
maj: 2026-10-07
tags: [plan]
---

# Plan — GeoLens Web — sécurité et exploitation

## Découpage
1 tâche = 1 livrable + 1 rôle + WL ≤ 12 fichiers. Au-delà : couper.

| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | eclaireur | carte terrain, santé, parité | — | fait |
| T002 | eclaireur | coordonnées + correctif minimal : PT-1..PT-7, relais upload, email invitation, `npm audit` api | — | T003-T005 |
| T003 | eclaireur | coordonnées XSS viewer (manifeste, toast, réfléchie, POI, origine jeton) + CSP + décodeurs unpkg | — | T002,T004,T005 |
| T004 | eclaireur | coordonnées exploitation : config prod, compose, Caddy/nginx, logger, worker secret, sauvegarde | — | T002,T003,T005 |
| T005 | eclaireur | preuves e2e sous Linux : prérequis, chemins Windows, preuves pertinentes par lot | — | T002-T004 |
| T006 | architecte | contrats : sessions (PT-2) + jetons de tuile (PT-3/PT-7) ; stratégie CSP + décodeurs ; ordre d'édition de `server.ts` | T002,T003 | T004,T005 |

## Lots d'implémentation (tâches créées après V1, WL exactes issues des recos)
| Lot | Contenu | Dépend de | Zone |
|---|---|---|---|
| A1 | rate-limit trustProxy + clé par utilisateur (PT-1), `npm audit fix` api sans majeure, borne email invitation | T002 | api config/server/package |
| A2 | sessions invalidées au changement de mot de passe (PT-2), jetons de tuile sous contrôle session + fenêtre réelle (PT-3, PT-7) | T006 | api auth/tokens/tenancy |
| A3 | sidecars JSON validés à l'écriture (PT-4), relais de part d'upload borné | T002 | api upload/userLayers |
| A4 | PT-5 énumération, PT-6 longueur mot de passe unique | T002 | api routes admin |
| V1 | `showToast` textContent, XSS réfléchie viewer, data-URL POI filtrées, jeton ajouté seulement à l'origine API | T003 | viewer ui/backend |
| V2 | échappement des champs de manifeste (~10 sites) | T003 | viewer |
| C1 | CSP portail + viewer, décodeurs DRACO/KTX2 bundlés, en-têtes Caddy/nginx | T006 | web html/vite, Caddyfile, nginx |
| X1 | `assertProductionConfig`, secret worker obligatoire + `compare_digest` | T004 | api config, worker |
| X2 | compose `${VAR:?}`, rotation journaux, `log` Caddy, sérialiseur sans query string | T004 | compose, Caddyfile, logger |
| X3 | script sauvegarde pg_dump + MinIO, runbook restauration joué | T004 | scripts/, docs/ |
| E1 | preuves e2e exécutables sous Linux | T005 | e2e/ |
| vérifs | 1 `verificateur` par lot ou paire de lots | lot | entre eux |

## Vagues
- **V1** : T002, T003, T004, T005 (4 éclaireurs, lecture seule)
- **V2** : T006 (architecte) ∥ packs A1, A3, A4, V1, V2, X1, X3, E1
- **V3** : lots à fichiers disjoints en parallèle ; lots partageant `server.ts`, `Caddyfile` ou `config.ts` séquencés (ordre fixé par T006)
- **V4** : A2, C1, X2 + vérificateurs de V3
- **V5** : vérificateurs restants, preuves e2e, scribe

## Synchronisations
- après V1 : WL exactes → création des tâches de lots
- après T006 : contrats recopiés dans A2, C1
- chaque lot : `verificateur` avant `fait`

## Risques
| Risque | Signal | Parade |
|---|---|---|
| collision d'édition sur `server.ts` | 2 lots E sur le même fichier | séquencer, jamais même vague |
| CSP casse le viewer (110 k l, inline) | preuve `proof-viewer` rouge | CSP sans `unsafe-inline` script seulement si T003 le prouve faisable, sinon nonce/hash |
| PT-2 exige une migration | T006 la conclut nécessaire | accord humain, commande fournie |
| correctif `npm audit` casse fastify | tests api rouges | revenir à la version, tâche dédiée |
| preuves e2e non lançables | T005 BLQ | juge = tests unitaires + verificateur, preuve NV signalée |
