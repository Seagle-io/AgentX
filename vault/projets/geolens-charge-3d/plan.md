---
projet: geolens-charge-3d
titre: GeoLens — charge serveur du rendu 3D
maj: 2026-10-12
tags: [plan]
---

# Plan — GeoLens — charge serveur du rendu 3D

Phases de l'epic Trello pzR8vwst ; mesure k6 entre chaque phase (D1).

## Découpage
| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | eclaireur | carte route tuile, logs, viewer | — | — |
| T002 | architecte | contrats 0.2 chrono · 1.2 logs · 1.3 304 sans SELECT | T001 | T003-T005 |
| T003 | eclaireur | DDL de migrate() + risque → validation humaine | — | T002, T004, T005 |
| T004 | architecte | contrat exposition MinIO test pour le 302 (1.1) | T001 | T002, T003, T005 |
| T005 | implementeur | k6 dans tools/load + 3 scénarios + p95 agrégé (0.1) | — | T002-T004 |
| à venir | implementeur ×N | lots issus de T002 et T004 | T002/T004 | selon fichiers E |
| à venir | verificateur | casser chaque lot | lots | — |
| à venir | humain | redéploiement API + MinIO test, mesures k6 5/10/30 | lots vérifiés, T003 validé | — |
| à venir | architecte + impl. | 2.1 cache viewer Cache Storage | mesure après phase 1 < objectif | — |

## Vagues
- **V1** : T001
- **V2** : T002, T003, T004, T005
- **V3** : implémentation phases 0.2/1.2/1.3 + 1.1 (lots disjoints)
- **V4** : vérification ; puis déploiement test (humain) + mesure

## Synchronisations
- après V2 : humain valide la liste DDL (T003) et l'exposition MinIO (T004 : port/chemin)
- après V4 : mesure k6 → décide phase 2, puis phase 3

## Risques
| Risque | Signal | Parade |
|---|---|---|
| migrate() destructif au boot | T003 trouve DROP/UPDATE de masse | pas de redéploiement, décision humaine |
| 302 vers hôte injoignable (SigV4 Host) | 403 SignatureDoesNotMatch | contrat T004 : endpoint public de présignature |
| 304 inutile (URL change toutes les 4 h) | tile_304 ≈ 0 en k6 revisit | coupler à 2.1 |
| test 4 vCPU ≠ prod 2 vCPU | API > 2 cœurs en palier | limiter le conteneur api à 2 CPU pour la mesure |
