---
tache: T014
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/publier.py:30 — RE_FEAT verbatim + `ajoute`
- bin/publier.py:81-85 — preuves ≤ 20 + ligne `… N autres`
- bin/publier.py:146-157 — P2 titre selon référence vide (txt/cap/2)
- bin/publier.py:167 — P3 sans `-n 200`, compte complet
- bin/publier.py:181 — titre « N commits de d dont F feat »
- bin/publier.py:232-233 — contrôle `erreur` ⇒ NO-GO
## Vérifié comment
```
python3 -m py_compile bin/publier.py → rc=0
git diff --no-index --stat .cache/seagle-T014/publier.avant.py bin/publier.py → 1 file changed, 12 insertions(+), 8 deletions(-)
python3 bin/publier.py kora → rc=1
  [bloquant] site-branche:kora:29d349b — 6 commits du site hors main touchent Kora ; captures absentes de main
  [bloquant] textes:kora:e15a824 — 410 commits de ortho-front dont 50 feat depuis les textes du site (2026-09-18) : à vérifier par un agent
  [avertissement] commits:kora:b44dc91 — 360 autres commits UI de ortho-front depuis 2026-09-18
  [bloquant] marketing:3214f882 / b43da040 / 16f92ad6 (inchangés)
  preuves : textes 21 lignes, dernière « … 30 autres » ; commits 21, « … 340 autres » ; P4 erreur « T_cap vide (P2) »
python3 bin/publier.py geolens → rc=1 ; commits:geolens:b551616 « 16 autres… depuis 2026-10-02 » ; captures:geolens:2026-10-14 « (2026-10-01) antérieures à l'UI (2026-10-14) »
git -C seagle-website rev-parse --short HEAD → 29d349b ; log main..HEAD -- SP | wc -l → 6
git -C seagle-website ls-tree -r --name-only main | grep -i kora → src/lib/local/{de,en,es,fr,it}/Kora.ts, src/pages/Kora/index.tsx (+ Kora.md, src/assets/Kora-Agent.webp)
git -C seagle-website log -1 --format=%cI main -- pages textes → 2026-09-18T22:13:34+02:00 ; -- public/kora/*.webp → ∅
git -C ortho-front log --no-merges --since=2026-09-18T22:13:34+02:00 master -- src → total 410 ; ~RE_FEAT 50 ; ^ajoute 0 ; rev-list --count 410 ; 1re ligne b44dc91 ; 1er feat e15a824
  RE_FEAT effet kora : 50 → 50 (0 sujet Ajoute dans ortho-front)
git -C Geolens-website log -1 main -- vue-*.webp → 2026-10-01T21:42:47 ; main..HEAD -- SP → 0
git -C geolens-web… log --no-merges --since=2026-10-02T01:27:23 master -- web/src → 16, feat 0, 1re b551616 ; log -1 → 2026-10-14T16:32:39
banc .cache/seagle-T014 (copie vault, produit test = copie depot T013 site/ui) :
  test --acquitter zz:test:0 → « ecart absent de l'evaluation courante » rc=2
  acquit 3 bloquants test → GO rc=0 ; commit site dev → site-branche:test:12841c0→b8391a7 non acquitté, NO-GO rc=1
  P2 fichiers hors main : T_txt vide → « pages et textes absents de main » ; T_cap vide → « 3 commits… ; captures absentes de main » ; les 2 → « pages et textes absents de main ; captures absentes de main »
  kora --taches ×2 → ['T001'…'T005'] puis [] rc=1 ; pack-lint T002 → x marqueurs a remplir
  acquit 5 bloquants kora → NO-GO rc=1 [P4 erreur], bloquants non acquittés [] ; publier.avant.py même banc → GO rc=0
  codes : test GO 0 · kora 1 · seagle/zz/agentx/--motif seul 2 · branche zz-absente 3 · couleur dupliquée 3
bash etat.sh (rev-parse HEAD + status --porcelain|md5 + stash list|md5 + worktree list ×5) avant/après → diff rc=0, 30 lignes
ls vault/projets | grep -c publication → 0 (vrai vault intact)
```
## Écarts
- ∅ lecture hors WL
- banc : commit dans `.cache/seagle-T014/depot/site` (copie, pas dépôt réel) pour l'expiration
- `… N autres` appliqué à tout écart (P1 inclus), via `_ecart`
- P1 garde `-n 50` (§C5 inchangé, hors DoD) : titre P1 tronquable > 50
## Pour la suite
- P1 `-n 50` : même troncature silencieuse possible que P3 — amender §C5
- verdict réel kora NO-GO : site-branche 29d349b (captures absentes), textes e15a824 (50 feat/410), 3 marketing ; P4 erreur ⇒ NO-GO même acquitté
- verdict réel geolens NO-GO : captures:geolens:2026-10-14
- P3 kora : 50 feat en preuves ≤ 20 — la tâche textes ne voit pas les 30 autres
## Retour sur le pack
- Manquait: `verifier()` exige fichiers sur disque → banc P2 = fichiers non suivis hors main | Inutile: decisions.md (amendements recopiés dans Contrats)
