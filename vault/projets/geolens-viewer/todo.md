---
projet: geolens-viewer
tags: [todo]
---

# Todo chef — geolens-viewer

- [x] proof-viewer.mjs:71 `mem.geometries >= 30 && mem.textures >= 10` reste dur → minTiles ou décision (T012) → fait (T023)
- [x] worker : documenter GEOLENS_ENV=production + GEOPLAN_WORKER_SECRET (README worker / app.py:6-7 docstring périmée) (T011) → fait (T023)
- [x] Caddyfile : HSTS absent du contrat T006 → ajouter `Strict-Transport-Security` (lot infra suivant) → fait (T039)
- [x] e2e réel : humain `cd e2e && npm ci` + stack → lancer upload, persistence, range, ortho, export → fait (T036/T038)
- [x] PRIORITÉ humain 2026-10-08 : N comptes sur le même modèle 3D sans saturer le serveur (T062 reco charge tuiles) → fait (T062-T070 ; reste humain : bucket, CORS, flag)
- [ ] HUMAIN : accord pour mettre à jour l'API du serveur de test (C1 trustProxy) — redémarre l'API, migrate() no-op sur base à jour
- [ ] HUMAIN : mesure Chrome manuelle en vue rapprochée (preset haute) pour confirmer la fin du thrash C2
- [ ] HUMAIN : déplacer le mot de passe en clair de ~/k6-run.sh vers ~/.env.k6 sur le serveur de test
- [ ] valider les hypothèses de coût (sessions/mois, utilisateurs actifs) — artefact « Charge viewer GeoLens »
- [ ] commit des correctifs C2/C3 dans G quand l'humain le décide (mission : pas de commit)
