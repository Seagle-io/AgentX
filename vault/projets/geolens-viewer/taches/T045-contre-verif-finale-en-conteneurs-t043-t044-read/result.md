---
tache: T045
statut: fait
verdict: DÉFAUTS
---
## Livré
- B1 OK — ready 200 ok/ok/ok ; health healthy à t=8 s
- B2 OK — ready 503 storage ko ; unhealthy streak=3 ; upload 502 ; log 1 ; secrets 0
- B3 OK — stop pg → 503 db ko 0,004 s ; start → 200 t=1 s
- B4 OK — 1 créé, 2 « email déjà utilisé » ; org Race=1 ; users=1
- B5 OK — 3 refus exit=1, règle JWT / DATABASE_URL / S3 affichée
- B6 OK — rg -c "token=[^\[]" → ∅ (exit 1) ; HSTS max-age=31536000 présent
- B7 OK — 77 fichiers, 690 tests verts ; typecheck exit=0
- 1 défaut hors B1-B7 (D1, bénin) : org dupliquée sous concurrence
## Défauts
- D1 · api/src/scripts/create-platform-admin.ts:L35-L38 — 3 admins concurrents, emails ≠, même `--org` → 2 orgs homonymes, admins répartis — repro : `for i in 1 2 3; do (docker exec glverif-api node dist/scripts/create-platform-admin.js --email r3x$i@verif.local --org "Race3")& done; wait` puis `select count(*) from organizations where name='Race3'` → 2 (2/2 essais) ; organizations : seul index = pkey — correctif : `pg_advisory_xact_lock(hashtext(nom))` en tête de transaction, ou UNIQUE(name) + ON CONFLICT
## Vérifié comment
docker build -t glverif-api G/api → EXIT 0
B1 : boucle inspect+curl → t=8s health=healthy ready=200 ; `{"ok":true,"db":"ok","storage":"ok"}`
B2 : run bads3 → `Up 6 seconds (health: starting)` ; ready → `{"ok":false,"db":"ok","storage":"ko"} 503` ; health → `{"ok":true} 200`
B2 : upload -F archive=@t.zip (cookie glx_session) → `{"error":"storage_transfer_failed",…} 502` ; grep -c "écriture stockage échouée" → 1 ; "readiness KO" → 4
B2 : err loggé = S3ServiceException SignatureDoesNotMatch ; grep -cF secret S3 / access key / pg pwd / JWT / mdp admin → 0 0 0 0 0 (2 conteneurs)
B2 : inspect bads3 → `unhealthy failing=3`
B3 : stop pg → `{"ok":false,"db":"ko","storage":"ok"} 503 0.004409s` ; start → `t=1s {"ok":true,…} 200`
B3 bis : network disconnect pg → `503 3.004301s` puis 0,002 s ; reconnect → 200 t=0 s
B3 ter : stop minio → `storage ko 503 0.54s` ; disconnect minio → `503 0.39s` ; reconnect → 200
B4 : 3 × exec parallèles → exit 0 / exit=1 « email déjà utilisé » ×2 ; psql count Race → 1 ; users → `race@verif.local|t|org_admin`
B4 bis : emails ≠, org "Race2" → 2 lignes `Race2` (ids cfc9dd23…, 20275cad…) → D1
B5 : Production + a×40 → `- JWT_SECRET absent, trop court…` exit=1
B5 : DATABASE_URL USER:PASSWORD@HOTE → `- base en mémoire (USE_MEM_DB) ou DATABASE_URL absente / d'exemple` exit=1
B5 : S3_BUCKET=__X__ → `- stockage non S3, S3_BUCKET absent / d'exemple…` exit=1
B6 : upload 201 ; tileset.json 200 ; tri.gltf 200 ; token=xyz 403 ; logs → `3 token=[redacted]",`
B6 bis : `?tok%65n=<jeton>` → 200, loggé `tok%65n=[redac…` ; `?x=1&token=` → 200, redacté ; jeton brut dans logs → 0
B6 : curl -si /api/ready → `Strict-Transport-Security: max-age=31536000; includeSubDomains`
B7 : npm --prefix api test → `Test Files 77 passed (77)` `Tests 690 passed (690)` ; typecheck → exit=0
docker exec glverif-api id -un → node
nettoyage : rm -fv glverif-api glverif-api-bads3 glverif-minio glverif-pg ; network rm glverif-net ; rmi glverif-api → Deleted sha256:f6fbc175…
docker ps -a --filter name=glverif- -q → ∅ ; network ls --filter name=glverif → ∅
volume ls avant = après : ortho-back_orthopro_pgdata, workspace_postgres_data (anonymes pg/minio supprimés par -v)
git -C G status --short → ∅ ; rm -r /tmp/glverif-pImqZz → ls → absent
## Écarts
- ∅ lecture hors WL
- bitnamilegacy/minio:latest pullé (absent avant), laissé — non glverif-*, D13
- B6 : tuile via route `/api/projects/:id`, lue par grep dans server.ts (WL)
## Pour la suite
- D1 : create-platform-admin.ts:L34-L38 — sérialiser par nom d'org (advisory lock) ; test : 3 appels concurrents même org → 1 org
- NV : épuisement pool pg si requêtes en vol figées (docker pause non autorisé) ; sonde bornée mais requête abandonnée reste en vol
- /api/ready publique : 1 HeadBucket + 1 SELECT par appel, plafond 300/min/IP seulement
## Retour sur le pack
- Manquait: nom du cookie (`glx_session`) + route login `/api/auth/login` ; zip : yazl dans G/api/node_modules (pas racine) ; `docker network disconnect` et `docker pause` absents de la liste d'outils
- Inutile: ∅
