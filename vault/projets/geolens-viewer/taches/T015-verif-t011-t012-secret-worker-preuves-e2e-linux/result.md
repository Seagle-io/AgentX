---
tache: T015
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 OK — secret.py:47 compare_digest ; 0 `!=` app.py
- A2 OK — app.py:106 1ʳᵉ ligne ; __main__.py:18 appelle create_app
- A3 OK — warning émis, check_secret passe
- A4 OK — 4 routes :116,127,133,149 ; rg ∅
- A5 OK — 7 passed
- A6 OK — compile OK, 0 nom `os` (ast)
- B1 OK — rg proof-* ∅ ; DIR $OUT||tmpdir, mkdir
- B2 OK — false (0 .b3dm/.pnts) ; true si 1 .pnts
- B3 KO — fonction conforme ; interaction:39 non branché (D1)
- B4 OK — SKIP + exit 0, avant zip/launch
- B5 OK — 12/12 node --check
- B6 confirmé — proof-viewer.mjs:71 dur ; hors T012
## Défauts
- D1 · e2e/proof-interaction.mjs:39 · `rg -n "minTiles|>= 20" e2e/proof-interaction.mjs` → `6:import { DIR, minTiles }` + `39:…__tileCount)) >= 20` · attendu `>= minTiles(20)` / obtenu seuil dur 20, import mort → assets absents = FAIL exit 1 malgré D4 ; PROOF_MIN_TILES ignoré
- D2 · e2e/_proofEnv.mjs:22 · `PROOF_MIN_TILES=abc node -e "import('./_proofEnv.mjs').then(m=>{const t=m.minTiles(30);console.log(t,1000>=t)})"` → `NaN false` · attendu rejet/warn / obtenu NaN, 0 warn, toute assertion tuiles FAIL
- D3 (bénin) · e2e/_proofEnv.mjs:25 · harness ASSETS_PRESENT=true + `PROOF_MIN_TILES=5` → `SEUIL ASSOUPLI 30→5 : assets 3D absents` · message faux si seuil forcé par env
## Vérifié comment
- `python3 -m pytest -q --noconftest tests/test_secret.py` → `7 passed in 0.36s`
- `rg -n "_check_secret|\bos\." geolens_worker/app.py` → ∅ ; `rg -n "!=" app.py` → ∅ ; `rg -n "@app\."` → 4 routes + exception_handler
- `python3 -m py_compile app.py` → OK ; ast Name `os` → False
- require_secret_at_startup : production/""/"   "/PRODUCTION/" production\n" sans secret → REFUS ; "prod"/""/absent → start + warning ; production+"x" → start
- TestClient app minimale + check_secret : header absent → 401 ; b"" → 401 ; b"s3cret" → 200 ; secret "sécret" + header utf-8 → 401 ; latin-1 → 401
- check_secret direct : "S3CRET"→401 ; "s3cret\x00"→401 ; 100k chars → pass ; "🔑"=="🔑" → pass
- `rg -n "C:/" e2e/proof-*.mjs` → exit 1 (∅)
- `node --check` _proofEnv + 11 proof-* modifiés → 12× OK
- `find seed-data/storage/villelaure-real -iname '*.b3dm' -o -iname '*.pnts' | wc -l` → 0 ; .gitignore:43 ignore `**/*.pnts`
- minTiles défaut → 30/150/12→0 + 3 warn ; ""→0 ; "-5"→-5 ; " 12 "→12 ; "0x10"→16 ; "1e9"→1e9 ; "abc"→NaN ; OUT=rel/out → relatif au cwd, créé ; OUT="" → /tmp/glw-proofs
- harness scratchpad (copie package/cloudpkg + stubs playwright/yazl) : .pnts absent → `SKIP proof-package.mjs : …` exit=0, idem cloudpkg ; .pnts présent → `ZIP` exit=4 (pas de SKIP) ; AP true
- `git -C G diff --stat -- worker e2e` → 12 fichiers, 25+/29- ; status ?? _proofEnv.mjs, secret.py, test_secret.py ; 0 hors WL T011/T012
## Écarts
- ∅ lecture hors WL ; rg (recherche) sur worker/, e2e/, G pour GEOLENS_ENV/create_app/C: ; ls seed-data
## Pour la suite
- T012-bis : proof-interaction.mjs:39 `>= 20` → `>= minTiles(20)` (import déjà présent :6)
- _proofEnv.mjs:22 : PROOF_MIN_TILES non numérique (NaN) → warn + fallback ; message :25 dire « forcé par PROOF_MIN_TILES » si env posé
- GEOLENS_ENV posé nulle part (rg G : 0 compose/Dockerfile/.env) → refus prod inerte tant que déploiement ne le pose pas ; doc app.py:6, worker/README.md:58 disent encore « optionnel »
- secret worker non-ASCII inutilisable via HTTP (header décodé latin-1, compare utf-8) ; comportement pré-existant → imposer secret ASCII (hex)
- e2e/diag-*.mjs (6 fichiers) gardent `'C:/tmp/glw-proofs'` en fallback ; skip package/cloudpkg teste .pnts seul, pas ortho.tif lu ensuite
## Retour sur le pack
- Manquait: coordonnée exacte seuil interaction (:39, pack dit :36) ; Inutile: ∅
