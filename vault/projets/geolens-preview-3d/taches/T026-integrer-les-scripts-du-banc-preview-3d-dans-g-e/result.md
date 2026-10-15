---
tache: T026
statut: fait
---
## Fait
- `G/e2e/bench-preview/lib.mjs` — t024 lib · 63 l · +`base()` (throw si BASE absent, appelé dans `open()`), +`outDir()` (OUT déf `./out-bench`, mkdir) ; `export const BASE` supprimé
- `png.mjs` — t024 png · 40 l · verbatim
- `ouverture.mjs` — t024 o · 100 l
- `ouverture-entree.mjs` — t024 o3 · 68 l · OUT/mkdir/writeFileSync retirés — jamais écrits, stdout seul
- `vues-ortho.mjs` — t024 h · 31 l · LABEL déf `x`
- `zoom-ortho.mjs` — t024 z · 102 l · `const BG = async () => null` retiré — code mort
- `vues-enregistrees.mjs` — t024 sv3 · 109 l · sv2 ⊂ sv3 (`diff sv2 sv3 | grep '^<'` → ∅) : frustum, midtoggle(P), fly, inject, wheelafter déjà présents
- `3dgs.mjs` — t006 bench · 183 l
- `ajout-lcc2.mjs` — t006 addlcc2 · 9 l · +usage si argv vide
- `nuage-ply.mjs` — t017 genply · 21 l · +usage si argv vide ; mkdirSync inutilisé retiré
- `purge.mjs` — t012 bench-rm · 231 l · OUT déf `.` → `./out-bench`
- `purge-analyse.mjs` — t012 rm · 14 l
- `README.md` — 63 l · prérequis, variables communes, tableau mesures, 10 exemples, « mesurent, ne jugent pas », 3DGS = copie STORE, jamais seed-data
- tous : import `from 'playwright-core'` ; `BASE = base()` ; en-tête ≤ 8 l (but, variables, sortie, prérequis) ; corps copié par script node avec contrôle préfixe par ligne modifiée → mesure inchangée

## Vérifié comment
`for f in G/e2e/bench-preview/*.mjs; do node --check $f; done; echo rc=$?` → `check rc=0` (12 fichiers, 0 sortie d'erreur)
`cd G/e2e && node -e "import('./bench-preview/lib.mjs').then(()=>console.log('ok'))"` → `ok`
`rg -n "/home/|/tmp/|scratchpad" G/e2e/bench-preview | wc -l` → `0`
`cd G/e2e && node bench-preview/ouverture.mjs` (sans BASE) → `Error: BASE obligatoire : URL du front servi par vite preview (cf. README.md)` at lib.mjs:10, rc=1 ; `ls out-bench` → absent (base() avant outDir())
`git -C G status --short` → `?? e2e/bench-preview/` (+ `.serena/`, `RAPPORT_CHARGE_CORRECTIFS.md` préexistants) — 0 fichier hors destination
banc non exécuté — hors DoD, pas de serveur

## Écarts
- ∅ lecture hors WL
- outils : copie/transformation via `node -` (stdin heredoc) au lieu de Write ligne à ligne — 0 retranscription manuelle
- SWS absent de lib.mjs (source t024 = GPU seul) ; SWS conservé dans purge.mjs, GPU=0 dans 3dgs.mjs — comportement source inchangé

## Pour la suite
- vues-ortho / zoom-ortho / vues-enregistrees : `outDir()` avant `open()` → crée `./out-bench` même si BASE absent (0 impact mesure)
- `purge.mjs` sortie `t003-<LABEL>.json`, logs `[t003]` / `[t006]` : préfixes historiques conservés
- README : commande exacte API mémoire et chemin `seed-data/.../3dgs` non détaillés (pack : note vault non citée) — à compléter par le chef si voulu
- commit par le chef : `git -C G add e2e/bench-preview`

## Retour sur le pack
- Manquait: chemin exact `seed-data/.../3dgs` + nom du manifeste STORE ; commande de démarrage API mémoire (README reste générique)
- Inutile: ∅
