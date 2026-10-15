---
tache: T022
projet: seagle-pilotage
statut: revue
---
## Livré
- `tests/test_produits.py` L1-349 — 16 tests (34 sous-cas registres invalides) ; module importé par chemin depuis `AGENTX_BIN` (défaut `bin/`), `charger.__defaults__` + `FICHIER` → registre tmp
- `tests/test_publier.py` L1-341 — 15 tests ; monde jetable : `bin/*.py` + `vault/_templates` + `roles.json` copiés en tmp, `produits.json` tmp, dépôts `git init` tmp datés (`GIT_COMMITTER_DATE`, fast-import pour 250 commits), `publier.py` en sous-processus
- test_produits L80-131 `RegistreValide` → ordre fichier, dataclasses, `tous/entreprise/produit`, `produit_de` brief/defaut/inconnu, registre invalide → `()`/`None`/`("","")`, absent/illisible, bords 24/48 car., vrai `produits.json` valide (lecture)
- test_produits L132-243 `test_une_regle_un_message` → 34 règles `_valider`, message exact `produits[i].<champ> : … invalide (…)`
- test_produits L245-283 `Cache` → 2 appels = 1 `_valider` ; mtime +1 s = relu ; même mtime = pas relu
- test_produits L284-349 `Verifier` → `[]` si tout présent ; `~user/` inconnu → 4 KO `illisible (RuntimeError…)` sans lever ; sans `.git` ; branche absente ; absents env/ui/site/calendrier/source
- test_publier L138 GO → exit 0, 6 contrôles ok, `ui: []` (V, commit plus récent) ignoré ; texte `GO kora`
- L148 P1 → id `site-branche:kora:<HEAD>`, devops, titre `1 commits du site hors main touchent Kora`, commit hors SP ignoré, status+refs du site inchangés
- L169/L180 P2 → titres exacts `captures absentes de main` / `pages et textes absents de main`, P4/P3 `erreur`
- L190 P3 250 commits dont 7 feat → titre `250 commits de ui dont 7 feat …`, preuves `… 223 autres` ; L210 `RE_FEAT` feat/ajout/ajoute/FEAT oui, ajouts/featuring/refeat/nouveautés non, avant T_txt et hors ui exclus
- L223 P4 → `captures:kora:2026-01-03`, designer, titre + preuves exactes ; L237 P5 → 3 ids sha1 attendus, doublon de ligne compté 1, insensible casse, `[x]` et autre motif ignorés
- L255 acquit → GO, ligne `acquits.md` au format ; nouveau HEAD → nouvel id, NO-GO ; L269 erreur P3 + tout acquitté → NO-GO
- L282 `--taches` ×2 → 2 tâches puis `[]`, mêmes TID, 2 packs citant les ids ; L300 0 bloquant → 0 projet créé
- L315/L325/L333 codes → 2 (zz, entreprise, site null, `--motif` seul, id absent, motif vide), 3 (verifier KO, registre invalide, absent), 0/1
## Vérifié comment
défauts injectés sur copies `$SP/defaut-*` (script `$SP/injecter.py`, `assert count==1`), `AGENTX_BIN=$SP/defaut-<n> python3 -m unittest discover -s tests` → ROUGE :
```
1-try-verifier      ERROR test_tilde_user_inconnu_ne_leve_pas — RuntimeError: Could not determine home directory.
2-n200-p3           FAIL  test_p3_sans_troncature — titre '200 autres commits UI…', 0 écart textes (7 feat perdus)
3-erreur-nogo       FAIL  test_controle_en_erreur_nogo_meme_tout_acquitte — AssertionError: 0 != 1
4-message-valider   FAIL  test_une_regle_un_message [nom long] [sous vide] — '(1..24 caracteres)' != '(1..24 car.)'
5-re-feat-sans-ajoute FAIL test_p3_sans_troncature, test_re_feat
6-taches-doublon    FAIL  test_taches_idempotent
7-cache-sans-mtime  FAIL  test_mtime_change_relu
chaque run : Ran 31 tests in 2.8s FAILED (failures|errors=1..2)
```
`python3 -m unittest discover -s tests -v` (bin/ réel) → VERT :
```
Ran 31 tests in 2.800s
OK
real 0m2,856s
```
`md5sum bin/*.py produits.json` avant/après → produits.py a9d2ad8d…, publier.py 04ab40b1…, vx.py a4150995…, produits.json 51822ea0… identiques ; seul diff `bin/dash.py` = T021 en parallèle
`git -C <d> status --porcelain | md5sum` avant == après pour seagle-website, Geolens-website, ortho-front, ortho-back, geolens-web-feat-viewer-online ; AgentX : + `tests/` (+ fichiers d'autres agents)
`bin/__pycache__/produits.cpython-314.pyc` mtime 00:14 inchangé ; `sys.dont_write_bytecode` posé
## Écarts
- ∅ lecture hors WL ; `grep "^def\|^VAULT\|^ROOT\|^STATUT_OUVERT" bin/vx.py` (noms seuls) pour isoler le vault — résolu par racine copiée, sans lire vx
## Pour la suite
- `publier.py:217-218` P5 : `read_text` hors `try` → calendrier supprimé entre P0 et P5 = traceback, pas `erreur`
- `produits.py:94-96` `_absolu` refuse `~user/` → la branche « ~user/ ne lève pas » de `verifier` n'est atteignable qu'avec un `Produit` construit à la main
- git 2.53 : `%cI` rend `Z` pour +0000 → `T_cap … Z` dans preuves/ids selon le fuseau du commit (ids stables, format hétérogène)
- `publier.py:154` titre `1 commits` — pluriel non accordé (cosmétique)
- contrat §C5 L228 `RE_FEAT` sans `ajoute` ≠ code (amendement decisions 2026-10-16 non reporté au contrat)
## Retour sur le pack
- Manquait: `--taches`/`--acquitter` passent par `vx` (hors WL) — préciser « copier la racine (bin + vault/_templates + roles.json) en tmp » ; pas de variable d'env registre (constaté)
- Inutile: ∅
