---
tache: T046
statut: fait
---
## Livré
- vault/connaissances/geolens-web-securite-carte.md:L29-L49 — modules T037-T045 + restes ouverts (53 l)
- vault/connaissances/geolens-web-outillage.md:L26-L35 — faits N2 e2e/pg-mem/git (42 l)
- vault/connaissances/verif-conteneurs-jetables.md — NEUF 32 l : glverif-, rm -fv, 0 prune, bitnamilegacy/minio, cookie Secure, pannes
- vault/_templates/context.md — 4 règles : regex→N sur HEAD, rg symbole+helpers L, test HTTP, docker pull à blanc (81 l)
- vault/projets/geolens-viewer/brief.md:L17-L27 — DoD : 5 [x], 6 [ ] avec raison
  - [x] jeton tuile · config (D12) · journaux (D6) · en-têtes (D6) · lots vérifiés
  - [ ] PT-1..7 · XSS · relais upload · npm audit (nodemailer 10.x) · sauvegarde (D2) · tests verts (lint, web test non rejoués)
## Vérifié comment
python3 bin/vx.py index → index ecrit : vault/INDEX.md (3 projet(s))
python3 bin/vx.py doctor → vault coherent.
wc -l → context.md 81 · securite-carte 53 · outillage 42 · verif-conteneurs-jetables 32
## Écarts
- ∅ lecture hors WL
- DoD brief : PT-1..7, XSS, relais upload non prouvables depuis T033-T045 → laissés [ ] ; [x] jeton tuile cité par note, T0xx source exact NV
- brief.md : annotations ajoutées en fin des lignes DoD cochées/non cochées (≠ section modifiée)
## Pour la suite
- pack vérificateur : citer le fichier réel (storage.ts:47-68 ≠ auth.ts) + helpers.ts (makeTestApp, multipartBody, cookie glx_session, login /api/auth/login) — manque récurrent T034/T035/T040/T041/T045
- pack e2e : décrire l'UI cible (onglets Admin, groupes repliés, confirmDialog) ; prévoir purge des projets orphelins après KO (5 « Upload Proof … » à purger via /admin)
- tâches ouvertes : `req.query.search` toString (server.ts:2136), nodemailer 10.x (accord humain), restauration Scaleway (humain), lint + web test final
- HEALTHCHECK image vs docker-compose.yml/.prod.yml : vérifier divergence ; S3 probe sur vrai bucket NV
## Retour sur le pack
- Manquait: preuves T001-T032 pour PT-1..7/XSS/upload (brief non cochable) ; liste des result.md T001-T032 lisibles
- Inutile: ∅
