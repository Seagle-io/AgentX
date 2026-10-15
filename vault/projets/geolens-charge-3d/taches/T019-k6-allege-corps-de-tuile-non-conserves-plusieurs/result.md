---
tache: T019
statut: fait
---
## Livré
- G/tools/load/viewer-navigation.js:L42-43 — doc : octets = Content-Length, 0 si chunked
- G/tools/load/viewer-navigation.js:L251-253 — storage/tile, tile-revisit : `responseType: 'none'`
- G/tools/load/viewer-navigation.js:L263,L276 — tile_bytes / s3_bytes = Content-Length seul
- G/tools/load/viewer-navigation.js:L270 — s3/tile : `responseType: 'none'`
- G/tools/load/Makefile:L3 — usage `make run VUS=30 PER=10`
- G/tools/load/Makefile:L19,L30 — `PER ?= 1` ; `NK6 = $(shell expr $(VUS) / $(PER))`
- G/tools/load/Makefile:L41 — check `+@test` VUS % PER, actif sous `-n`
- G/tools/load/Makefile:L51,L58,L62,L64 — boucles `seq 1 $(NK6)`, `-e VUS=$(PER)`
- G/tools/load/Makefile:L88 — report « utilisateurs : $(VUS) »
## Vérifié comment
`HOME=/tmp/x make -n run VUS=30 PER=10 PROJECT_ID=x USERS=a:b` → exit=0 ; `for i in $(seq 1 3)` ×3 ; `-e VUS=10 -e DURATION=2m` ; `test $(( 30 % 10 )) -eq 0 …`
`HOME=/tmp/x make -n check VUS=30 PER=7 PROJECT_ID=x USERS=a:b` → `VUS=30 non multiple de PER=7 (VUs par conteneur)` / `make: *** [Makefile:41: check] Error 1` / exit=2
`HOME=/tmp/x make -n run VUS=3 …` (PER défaut) → `seq 1 3` ×3, `-e VUS=1` — identique à avant
`make -n report VUS=30` → `print(f"utilisateurs : 30")`
`docker run --rm -v G/tools/load:/s:ro -e PROJECT_ID=x -e USERS=a:b -e SCENARIO={navigation,redirect} grafana/k6:0.54.0 inspect /s/viewer-navigation.js` → navigation exit=0 ; redirect exit=0 (JSON options ramping-vus)
stub scratchpad/stub.py (9 l, 200 + CL 102400, /redir 302→/tile) + t.js k6 0.54 →
```
tile status=200 body=null CL=102400
redir status=302 body=null Location=/tile
s3 status=200 body=null CL=102400
defaut body.length=102400
exit=0
```
`git -C G status --short -- tools/load/` → `M tools/load/Makefile` / `M tools/load/viewer-navigation.js` ; diff 28 lignes +/-
## Écarts
- ∅
## Pour la suite
- `make run VUS=30 PER=10` → 3 conteneurs k6-u1..3, `__VU` 1..10 par conteneur ; sessions round-robin inchangées
- sous chunked (sans Content-Length) tile_bytes/s3_bytes = 0 : Mo/s et Ko/tuile faussés
- check VUS%PER exécuté même sous `make -n` (préfixe `+`) ; PER=0 → erreur shell division
- CPU k6 après allègement NV : à mesurer sur serveur (D18)
## Retour sur le pack
- Manquait: `make -n` n'exécute pas check → préciser si `+`/`$(error)` attendu ; image k6 tourne en uid ≠ hôte → `--user $(id -u)` pour monter le scratchpad
- Inutile: ∅
