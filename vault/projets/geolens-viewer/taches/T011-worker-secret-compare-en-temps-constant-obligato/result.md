---
tache: T011
statut: fait
---
## Livré
- worker/geolens_worker/secret.py:1-48 — NEUF, contrat verbatim, stdlib + HTTPException
- worker/geolens_worker/secret.py:43-48 — check_secret via hmac.compare_digest, 401
- worker/geolens_worker/secret.py:33-40 — prod sans secret → MissingWorkerSecret ; sinon warning
- worker/geolens_worker/app.py:18 — `import os` supprimé (devenu inutilisé)
- worker/geolens_worker/app.py:36 — import check_secret, require_secret_at_startup
- worker/geolens_worker/app.py:49-52 — `_check_secret` supprimé
- worker/geolens_worker/app.py:106 — create_app() appelle require_secret_at_startup() 1ʳᵉ ligne
- worker/geolens_worker/app.py:116,127,133,149 — 4 appels → check_secret(x_worker_secret)
- worker/tests/test_secret.py:1-63 — NEUF, 7 cas pack, fixture autouse purge env
## Vérifié comment
cwd = G/worker
```
python3 -m pytest -q --noconftest tests/test_secret.py → .......  [100%]  7 passed in 0.14s
python3 -m py_compile geolens_worker/app.py geolens_worker/secret.py → exit 0
rg -n "compare_digest" geolens_worker → geolens_worker/secret.py:47:    if not hmac.compare_digest(expected.encode(), (x_worker_secret or "").encode()):
rg -n "!= expected" geolens_worker → geolens_worker/grid.py:77:    if len(raw) != expected:
git -C G diff --stat →
 web/src/viewer/backend/HttpBackend.ts |  2 ++
 web/src/viewer/backend/install.ts     | 20 ++++++++++++++------
 worker/geolens_worker/app.py          | 18 ++++++------------
 3 files changed, 22 insertions(+), 18 deletions(-)
git -C G status --short worker →
 M worker/geolens_worker/app.py
?? worker/geolens_worker/secret.py
?? worker/tests/test_secret.py
```
- web/* dans diff --stat — autres agents, 0 touché par T011
- tests/test_app.py::test_secret_partage — NV, scipy absent (attendu pack)
## Écarts
- DoD 4 `!= expected` → 1 hit grid.py:77 — comparaison de longueur, sans rapport secret, préexistant, hors WL
- app.py:18 `import os` retiré — hors contrat mais dans plage :16-52, sinon import mort
- lecture hors WL: ∅
## Pour la suite
- app.py:6-7 docstring dit « secret partagé optionnel » — périmé (obligatoire si GEOLENS_ENV=production), plage :1-14 hors WL
- déploiement prod : poser GEOLENS_ENV=production + GEOPLAN_WORKER_SECRET, sinon create_app() lève MissingWorkerSecret
- README worker / compose : documenter GEOLENS_ENV (hors périmètre T011)
- test_app.py::test_secret_partage à relancer là où scipy est installé
## Retour sur le pack
- Manquait: DoD rg `!= expected` aurait dû cibler app.py (grid.py:77 faux positif) ; `import os` devenu mort non anticipé
- Inutile: ∅
