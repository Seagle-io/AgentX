---
tache: T007
statut: fait
---
## Livré
- src/pages/AgentX/index.tsx:L36-49 — IntersectionObserver 200px : play entrée, pause sortie
- src/pages/AgentX/index.tsx:L50-58 — `autoPlay` retiré, `preload="none"`, reduced-motion → ∅ play
- artefacts/seagle-site/T007/measure.mjs — mesure Playwright (charge, défilement, onglets, RM)

## Vérifié comment
`npx tsc --noEmit -p .` → `tsc exit 0`
`git diff --stat -- src/pages/AgentX/index.tsx` → `1 file changed, 14 insertions(+), 4 deletions(-)` ; hunks L36-58 seuls (RoomVideo)
`npx vite build --outDir …/T007/dist` → `✓ built in 5.28s`
`node measure.mjs` (preview :4402) →
```
390x844 load+4s: video bytes=855225 hits=[room.webm 206 855225]
  hero: paused=false visible=false top=916 ; onglets: paused=true top=4850
1440x900 load+4s: video bytes=855225 hits=[room.webm 206 855225]
  hero: paused=false visible=true top=779 ; onglets: paused=true top=3743
scroll→tabs: hero paused=true top=-2869 ; onglets paused=false visible=true top=91
scroll→top: hero paused=false ; onglets paused=true
tab 2 click: onglets src=board.webm paused=false ; hits += board.webm 206 959066
reduced-motion: bytes=0 ; 2 vidéos paused=true
```
- 1440×900 : hero visible (top 779 < 900) → chargement légitime
- avant (T001) 1 seul room.webm aussi ; onglet ne charge plus rien avant approche
- HTML prérendu : NV — prérendu réservé au chef
- preview arrêté (pid vite 2809102), port 4402 libre → `ss -ltn | grep -c 4402` → `0`

## Écarts
- DoD 3 KO à 390×844 : hero top=916, pli 844, marge 200 → 916 < 1044 → chargé
- avec rootMargin < 72px : hero hors zone → 0 o (déduit de la géométrie, NV)
- effet dépend de `[name]` — ré-observe si `name` change sans remontage

## Pour la suite
- RoomVideo lazy : 0 o vidéo si hors écran+marge ; reduced-motion 0 o (poster seul)
- mobile 390×844 : hero 72 px sous le pli → chargé avec marge 200px
- trancher rootMargin : 200px (anticipation) vs ≤ 50px (0 o mobile au chargement)
- onglets : changement → board.webm chargé + lu, `key={name}` OK

Question : garder rootMargin 200px (hero mobile chargé car 72 px sous le pli) ou passer à 0px pour obtenir 0 o à 390×844 ?

## Retour sur le pack
- Manquait: position hero mobile (top 916) → rootMargin 200 ≠ « 0 o à 390×844 »
- Inutile: ∅

## Reprise après BLQ
- réponse chef : rootMargin `0px` → index.tsx:L45 ; commentaire L36 « arrivée à l'écran »
- measure.mjs : scrollIntoView de la vidéo après le hover de la tablist (marge 0)
`npx tsc --noEmit -p .` → `tsc exit 0`
`git diff --stat -- src/pages/AgentX/index.tsx` → `1 file changed, 14 insertions(+), 4 deletions(-)` (RoomVideo seule)
`npx vite build --outDir …/T007/dist` → `✓ built in 11.94s`
`node measure.mjs` (preview :4402) →
```
390x844 load+4s: video bytes=0 hits=[] ; hero paused=true top=916
1440x900 load+4s: video bytes=855225 hits=[room.webm 206 855225] ; hero visible=true top=779 paused=false
scroll→tabs: hero paused=true ; onglets paused=false visible=true top=91
scroll→top: hero paused=false ; onglets paused=true
tab 2 click: onglets src=board.webm paused=false ; hits += board.webm 206 959066
reduced-motion: bytes=0 ; 2 vidéos paused=true
```
- 1440×900 : hero visible au chargement → chargement légitime
- DoD 1-7 OK ; écart DoD 3 levé ; question BLQ close
- preview arrêté, `ss -ltn | grep -c 4402` → `0`
