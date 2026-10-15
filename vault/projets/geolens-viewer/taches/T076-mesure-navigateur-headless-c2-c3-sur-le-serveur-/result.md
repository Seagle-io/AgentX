---
tache: T076
statut: fait
---
## Mesures (apres)
| scénario | run | palier 1 (t, tuiles, Mo) | stable (t, tuiles, Mo) | distinctes | ratio | heap max |
|---|---|---|---|---|---|---|
| open (0 interaction) | 1 | 4.4 s, 58, 5.3 | 4.4 s, 58, 5.3 | 58 | 1.00 | 41.5 Mo |
| open (0 interaction) | 2 | 4.3 s, 58, 5.3 | 4.3 s, 58, 5.3 | 58 | 1.00 | 39.5 Mo |
| open3d (clic « Explorer en 3D ») | 1 | 4.1 s, 63, 6.4 | 11.4 s, 66, 7.1 | 66 | 1.00 | 46.5 Mo |
| open3d (clic « Explorer en 3D ») | 2 | 4.1 s, 64, 6.8 | 12.0 s, 67, 7.4 | 67 | 1.00 | 45.1 Mo |
| nav 300 s (7 cycles) | 1 | — | fin 300 s : 90, 13.2 | 90 | 1.00 | 60.2 Mo |
- tileMem final : open geom=76-77 tex=66-67 lru=87 23 Mo · open3d geom=107-110 tex=97-100 lru=97-98 32-34 Mo · nav geom=163 tex=153 lru=126 77 Mo
- open : bouton « Explorer en 3D » encore visible à 180 s (explorer3d=1) → viewer resté sur l'accueil
- vs référence 08/10 (≈ 2 500 t / 600 Mo ; nav 3,9×) : ouverture 58-67 t / 5-7 Mo ; nav ratio 1,00 ; < seuils 800 t / 100 Mo
- headless swiftshader : tuiles/Mo fiables ; mémoire GPU (tileMem) non représentative ; boucle rendu ≈ 22 fps (tick 3900 en 177 s)
## Vérifié comment
`node measure.mjs apres` → exit=0, sortie brute :
```
[apres] open run=1 | palier1 t=4.4s 58t 5.3Mo | stable t=4.4s 58t 5.3Mo | calme10 t=4.4s 58t 5.3Mo | fin 58t/58d 5.3Mo | heapMax=41.5MB | geom=76 tex=66 lru=87 23MB | 4xx=0 401/403=0 5xx=0 | json=37 | pw=58 | explorer3d=1
[apres] open run=2 | palier1 t=4.3s 58t 5.3Mo | stable t=4.3s 58t 5.3Mo | calme10 t=4.3s 58t 5.3Mo | fin 58t/58d 5.3Mo | heapMax=39.5MB | geom=77 tex=67 lru=87 23MB | 4xx=0 401/403=0 5xx=0 | json=37 | pw=58 | explorer3d=1
[apres] open3d run=1 | palier1 t=4.1s 63t 6.4Mo | stable t=11.4s 66t 7.1Mo | calme10 t=11.4s 66t 7.1Mo | fin 66t/66d 7.1Mo | heapMax=46.5MB | geom=107 tex=97 lru=97 32MB | 4xx=0 401/403=0 5xx=0 | json=39 | pw=66 | explorer3d=0
[apres] open3d run=2 | palier1 t=4.1s 64t 6.8Mo | stable t=12s 67t 7.4Mo | calme10 t=12s 67t 7.4Mo | fin 67t/67d 7.4Mo | heapMax=45.1MB | geom=110 tex=100 lru=98 34MB | 4xx=0 401/403=0 5xx=0 | json=39 | pw=67 | explorer3d=0
[apres] nav run=1 | 90 req / 90 distinctes ratio=1 | 13.2Mo | heapMax=60.2MB | geom=163 tex=153 lru=126 77MB | cycles=7 | 4xx=0 401/403=0 5xx=0 | json=44 | explorer3d=0
```
- cohérence : tuiles binaires/ouverture 58-67 (≥ 1 OK) · 401/403 tuiles = 0 · CDP = Playwright requestfinished (pw=58/66/67) · `__glrTileMem` lu, non-null 178/178 · 175/175 · 295/295 échantillons
- audit fuite (script node : chaque valeur de .env.k6 cherchée dans 5 JSON + log + script) → `leaks=0 cookie/token=false` ×7 ; URLs de tuiles (portent ?token=) jamais écrites
- fichiers : S/apres-open-1.json, apres-open-2.json, apres-open3d-1.json, apres-open3d-2.json, apres-nav.json, apres-run.log ; clés JSON = label,scenario,run,startedAt,samples,reperes
## Écarts
- lecture hors WL : ∅
- flag `--enable-precise-memory-info` ajouté aux args — sinon heapMB quantifié, inexploitable
- scénario `open3d` ajouté (×2) + `nav` clique « Explorer en 3D » avant les cycles — sans clic, viewer reste sur l'accueil
- repère supplémentaire `calme10` (1re arrivée suivie de 10 s sans tuile) ; `stable` = dernière arrivée si ≥ 10 s avant la fin, sinon 180 s
## Pour la suite
- avant : déployer l'ancien front, puis `cd S && node measure.mjs avant` (≈ 19 min, séquentiel, 1 seul à la fois — rate-limit 5000/min)
- debug : `ONLY=open,open3d,nav OPEN_S=40 NAV_S=60 NO_WRITE=1 node measure.mjs avant`
- 90 tuiles distinctes en 5 min = 2 % du modèle 4 558 → vérifier que la caméra par défaut / zoom 5×100 px couvre une zone comparable à l'observation humaine (NV)
- comparer avant/apres sur `open3d` + `nav` (open seul = accueil, pas l'entrée 3D)
## Retour sur le pack
- Manquait: écran d'accueil « Explorer en 3D » du viewer.html (proof-viewer.mjs le clique) — le scénario « 0 interaction » ne mesure que l'accueil ; heap Chromium quantifié sans flag ; rôle `verificateur` pour une tâche d'écriture de script
- Inutile: ∅
