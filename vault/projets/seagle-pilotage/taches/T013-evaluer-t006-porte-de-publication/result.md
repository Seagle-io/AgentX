---
tache: T013
projet: seagle-pilotage
statut: fait
evalue: T006
verdict: virer
---
## Verdict
virer — 2 titres d'écart kora contredits par git
## DoD
DoD T006 :
- [x] API §C5 cmd/evaluer/git, GitErreur, timeout 10 s, main() — `bin/publier.py:49-57,120,318,340` ; `publier.cmd(Namespace(cle='test',…))` → `GO test` rc=0
- [ ] P0-P5 exactement §C5, titres justes — manque : `site-branche:kora:29d349b` titre « pages absentes de main » ; `git ls-tree -r --name-only main -- src/pages/Kora src/lib/local` → 6 fichiers Kora ; seul T_cap vide ; P3 titres « 2 feat / 198 autres depuis 2026-09-18 » ≠ git : 410 commits, 50 feat depuis T_txt (fenêtre `-n 200` remonte au 2026-10-08)
- [x] forme `--json` §C5 — clés produit/verdict/horodate/controles/ecarts/taches_creees ; écart id/type/gravite/titre/preuves/role/acquitte/tache
- [x] 0 écriture git, 0 réseau — `diff avant.txt apres.txt` (HEAD+porcelain+stash+worktree ×5) → rc=0 ; `grep -nE "urllib|socket|http"` → ∅ ; mots git = L151,161,178,181,182 titres, L282 doc
- [x] 4 commandes DoD L3 — kora rc=1 NO-GO, geolens rc=1 NO-GO, seagle rc=2, zz rc=2
- [x] `--acquitter` banc — acquit → `GO test … (acquitté)` rc=0 ; `zz:test:0` → `ecart absent…` rc=2
- [x] `--taches` ×2 banc kora — 1er `['T001'…'T005']` ; 2e `[]` ; `pack-lint T001` → `x … marqueurs a remplir` rc=2 ; brief `produit: kora`
- [x] seagle/zz/registre muté — rc 2/2 ; couleur dupliquée → rc=3 ; `site.branche=zz-absente` → rc=3
- [x] py_compile → rc=0 ; `git status` ∋ `?? bin/publier.py` (autres M/?? : tâches concurrentes, NV attribution)
- [x] result.md T006 au format
DoD T013 :
- [ ] verdicts réels confrontés à git — manque : 2 écarts kora faux (ci-dessus) ; geolens OK : `log -1 … vue-*.webp` → 2026-10-01T21:42:47 ; `log -1 master -- web/src` → 2026-10-14T16:32:39 ; P3 16 lignes, 0 feat ; P5 kora 3 lignes OUVERT ids 3214f882/b43da040/16f92ad6 = recalcul sha1
- [x] lecture seule ×5 avant == après — diff rc=0 (25 lignes)
- [x] `--taches`/`--acquitter` copie — idempotence `[]` ; expiration : commit site → id `32c54bd`→`12841c0` NO-GO rc=1 ; 2e feat ui → `textes:test:6cefc70`→`a26e814` non acquitté ; id absent rc=2 ; motif `""`/`"   "`/`a\nb` → rc=2, acquits.md md5 inchangé
- [x] codes : GO 0 · geolens 1 · seagle/zz/agentx 2 · couleur/branche 3 · sans cle argparse 2
- [x] écarts déclarés jugés — cf. Pour la suite
## Motif
P3 kora faux : fenetre -n 200 tronquee au 2026-10-08, titres 2 feat et 198 autres alors que git donne 410 commits dont 50 feat ; titre pages absentes de main alors que pages et textes y sont
## Vérifié comment
```
git -C seagle-website log -1 --format=%cI main -- Kora.tsx Kora.ts → 2026-09-18T22:13:34+02:00 ; … -- public/kora/*.webp → ∅
git -C seagle-website ls-tree -r --name-only main → src/lib/local/{de,en,es,fr,it}/Kora.ts, src/pages/Kora/index.tsx
git -C seagle-website log main..HEAD -- SP → 6 lignes (rev-list --count 16) ; rev-parse --short HEAD → 29d349b
git -C ortho-front log --no-merges -n 200 --since=2026-09-18T22:13:34 master -- src | wc -l → 200 ; dernière 2026-10-08
git -C ortho-front log --no-merges --since=… master -- src → total 410 feat 50 Ajoute* 0
préfixes -n 200 → Exercices 133, Comptabilité 17, Compta 14, fix(ui) 7 ; ajout* (ci) 0
banc : acquit des 5 bloquants kora → GO [P1 ecart, P2 ecart, P3 ecart, P4 erreur, P5 ecart]
```
## Écarts
- ∅ lecture hors WL
- dépôts de test `.cache/seagle-eval-T013/depot/{site,ui}` + produit `test` dans le produits.json copié
## Pour la suite
- P3 : troncature `-n 200` → titre doit dire « ≥ N (fenêtre jusqu'au <date dernière ligne>) » ou paginer ; §C5 à amender ; bloquant (tâche textes kora voit 2 feat sur 50)
- P2 : titre selon le vide réel — T_txt vide « pages absentes », T_cap vide « captures absentes de B »
- déclaré « RE_FEAT rate Ajoute… (198) » : faux, 0 sujet ortho-front en Ajout ; « Ajoute » = commits seagle-website (P1) ; RE_FEAT FR à élargir quand même (`ajoute?r?`) — suite
- contrôle `erreur` sans NO-GO : prouvé, acquit site-branche kora ⇒ captures jamais jugées, GO — amender §C5 (erreur ⇒ NO-GO) ; suite contrat, pas défaut T006
- P5 non filtré par date : 3 bloquants permanents, conforme §C5 — suite
- pack remplaçant : recopier ces 3 faits git + commande de vérif du titre vs `rev-list --count`
## Retour sur le pack
- Manquait: §C5 muet sur le titre P2 selon T_txt/T_cap et sur la troncature -n 200 | Inutile: ∅
