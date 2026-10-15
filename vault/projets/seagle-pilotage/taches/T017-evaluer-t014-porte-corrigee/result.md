---
tache: T017
projet: seagle-pilotage
statut: fait
evalue: T014
verdict: retenir
---
## Verdict
retenir — 2 motifs levés, 4 amendements, 0 titre faux
## DoD
DoD T014 :
- [x] motif 1 (P3) sans troncature — `bin/publier.py:167` sans `-n` ; kora → « 410 commits de ortho-front dont 50 feat » ; `git -C ortho-front rev-list --count --no-merges --since=2026-09-18T22:13:34+02:00 master -- src` → 410 ; preuves textes 21 dernière `… 30 autres` ; commits 21 `… 340 autres`
- [x] motif 2 (P2) titre selon vide — banc tcap → `captures absentes de main` ; ttxt → `pages et textes absents de main` ; tdeux → les 2 joints ` ; ` ; kora → `… ; captures absentes de main` ; `ls-tree -r --name-only main` → `src/lib/local/{de,en,es,fr,it}/Kora.ts`, `src/pages/Kora/index.tsx`
- [x] erreur ⇒ NO-GO — `bin/publier.py:232-233` ; 5 bloquants kora acquittés → `NO-GO … P4 erreur … bloquants non acquittés []` rc=1
- [x] RE_FEAT verbatim — `bin/publier.py:30` ; effet kora : nouveau 50, ancien 50 ; banc `ajoute le tri` → compté feat (2 feat)
- [x] écarts réels kora/geolens vs git — 0 contradiction (Vérifié comment)
- [x] non-régression banc — id absent rc=2 ; expiration ok ; `--taches` ×2 → `[T001…T005]` puis `[]` ; codes 0/1/2/3 ; lecture seule diff rc=0
- [x] py_compile rc=0 ; `git diff --no-index --stat .cache/seagle-T014/publier.avant.py bin/publier.py` → `1 file changed, 12 insertions(+), 8 deletions(-)`
- [x] result.md T014 au format — sections Livré/Vérifié comment/Écarts/Pour la suite/Retour présentes
DoD T017 :
- [x] DoD T014 recopiée, re-exécutée — ci-dessus
- [x] verdicts réels rejoués, écart ↔ git — 6 kora + 2 geolens confrontés, 0 faux
- [x] lecture seule ×5 — `diff avant.txt apres.txt` → rc=0, 30 lignes (HEAD+porcelain md5+stash md5+worktree)
- [x] `--taches`/`--acquitter` copie — `[]` au 2e ; expiration textes `9a20d6e`→`a436493`, captures `2026-02-02`→`2026-03-01`, site-branche `a3b0363`→`944887d` ; `zz:test:0` rc=2 ; motif `""`/`"   "`/`a\nb`/absent → rc=2, acquits.md md5 `f38b589b` inchangé
- [x] codes : test GO 0 · kora 1 · seagle 2 · zz 2 · agentx 2 · `--motif` seul 2 · couleur dupliquée 3 · branche zz-absente 3
- [x] 2 motifs levés + 4 amendements — titres = git ; acquit 5 bloquants kora → NO-GO (P4 erreur)
## Motif
∅
## Vérifié comment
```
python3 -m py_compile bin/publier.py → rc=0
python3 bin/publier.py kora → NO-GO rc=1
  site-branche:kora:29d349b — 6 commits du site hors main touchent Kora ; captures absentes de main
  textes:kora:e15a824 — 410 commits de ortho-front dont 50 feat … (2026-09-18)
  commits:kora:b44dc91 — 360 autres commits UI … ; marketing:3214f882/b43da040/16f92ad6 ; P4 erreur « T_cap vide (P2) »
git -C seagle-website rev-parse --short HEAD → 29d349b ; log main..HEAD -- SP | wc -l → 6
git -C seagle-website log -1 --format=%cI main -- pages textes → 2026-09-18T22:13:34+02:00 ; -- public/kora/*.webp → ∅ ; ls-tree main -- public/kora → 0
git -C ortho-front log --no-merges --since=2026-09-18T22:13:34+02:00 master -- src → 410 ; RE_FEAT 50 ; autres 360 ; 1er feat e15a824 ; 1re b44dc91
python3 bin/publier.py geolens → NO-GO rc=1 ; commits:geolens:b551616 « 16 autres … depuis 2026-10-02 » ; captures:geolens:2026-10-14 « (2026-10-01) antérieures à l'UI (2026-10-14) »
git -C Geolens-website log main..HEAD -- SP | wc -l → 0 ; T_txt 2026-10-02T01:27:23+02:00 ; T_cap 2026-10-01T21:42:47+02:00
git -C geolens-web-feat-viewer-online log -1 master -- web/src → 2026-10-14T16:32:39+02:00 ; log --since=T_txt → 16, feat 0, 1re b551616
banc .cache/seagle-eval-T017 (copie vault, dépôts test git init depot/{site,ui,s_cap,s_txt,s_deux,mk}) :
  test acquit 3 bloquants → GO rc=0 ; commit ui « ajoute le tri » → textes/captures ids neufs NO-GO rc=1
  checkout -b dev + commit site → site-branche:test:a3b0363 ; acquit → GO ; commit « retouche » → site-branche:test:944887d NO-GO rc=1
  kora --taches ×2 → ['T001'…'T005'] puis [] ; brief produit: kora ; vx pack-lint T002 → x marqueurs a remplir rc=2
bash etat.sh avant/après (5 dépôts) → diff rc=0 ; ls vault/projets | grep -c publication → 0
```
## Écarts
- ∅ lecture hors WL
- `etat.sh`, `avant.txt`, `apres.txt` dans scratchpad session, pas `.cache/` — hors vault
- dépôts de test créés par `git init` dans `.cache/seagle-eval-T017/depot/` ; 0 commit dans un vrai dépôt
## Pour la suite
- P1 garde `-n 50` : titre site-branche tronquable > 50 — amender §C5 comme P3
- §C5 contrat.md L228 `RE_FEAT` ancien, L247 `preuves ≤ 20` ≠ code (+1 ligne `… N autres`) — mettre le contrat à jour
- tâche textes kora : preuves 20/50 feat ; agent marketing doit relancer la commande git du contrôle pour les 30 autres
## Retour sur le pack
- Manquait: ∅ | Inutile: decisions.md (amendements recopiés dans Contrats)
