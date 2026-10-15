---
tache: T031
projet: agentx-entreprise
statut: fait
evalue: T030
verdict: virer
---
## Verdict
virer — fence non fermée masque titres ; manques 33 %
## DoD
DoD T030, re-jouée sur `.cache/banc-T031` :
- [x] motif T026 / scaffold vraie fiche — orthopro T001 : `#{1,2}` hors code → `10 8:# Pack T001 | 13:## Mission | 16:## Definition of Done | 23:## Fichiers autorisés | 34:## Contrats | 45:## Décisions actées | 50:## Hors périmètre | 54:## Environnement | 115:## Budget | 123:## Format de sortie` ; seagle-site idem `113:## Budget 121:## Format de sortie` ; fiche L55-104 en `**X**`
- [x] marqueur filtré — fiche forgée `- TODO-PACK a completer` → § Env `**Versions**` `- node 24 — x` ; `rg -c TODO-PACK` pack=6 = gabarit=6
- [x] pack-lint étranger/doublon/ordre/sain — forge T002 → `x titre hors gabarit : ## Notes libres` rc 2 · T003 → `x section dupliquee : ## Contrats` rc 2 · T004 → `x sections dans le desordre` rc 2 · T001 sain → `OK — pack dispatchable.` rc 0
- [x] non-régression en-cours|pret — 5 TID figés, avant(HEAD)/après : `T030 0/0 · T031 0/0 · immeuble T011 0/0 · T012 0/0 · T014 0/0` (rc avant/après)
- [x] `\b` manques, 3 exemples — `comportement du widget → autre` · `toolbar absente → autre` · `chunks rejetes → autre` ; témoins port/tools/type/api/ligne/TZ → bonne cat.
- [x] integrer/manques intacts — `rg -c "^   -- Retour sur le pack"` → `42` ; `manques --json` → `257 8`
- [x] py_compile + doctor — `py=0` · `vault coherent.` `doctor=0`
- [x] git diff stat — `bin/vx.py | 124 … 118 insertions(+), 6 deletions(-)` ; hunks `-50,0 +51 … -822,0 +931,4` = déclarés
- [x] result.md T030 — 5 sections exactes, 41 lignes corps ≤ 60
DoD T031 :
- [x] motif T026 levé, 6 fiches — dashboard-grille/geolens-charge-3d/geolens-preview-3d/geolens-viewer/orthopro/seagle-site → chacune `10` = 1 H1 + 9 sections dans l'ordre ; pack-lint → seul `x le pack contient encore des marqueurs a remplir` (gabarit)
- [ ] pack-lint robuste — `##` dans ``` ignoré OK (forge T005 → `OK`) ; mais forge T009, ```` ```bash ```` non fermé L60 puis `## Notes etrangeres` L71 + `## Mission` dupliqué L75 → `OK — pack dispatchable.` rc=0 : faux OK ; T006 fence non fermée + bloc Format → rc 2 mais messages faux `x titre hors gabarit : ## Livre`… ; `~~~` non reconnu → T007 `x titre hors gabarit : ## Faux titre tilde` ; PACK_SECTIONS HEAD `8` → après `9` OK
- [x] non-régression tout le vault — packs `fait 271 · revue 2 · en-cours 3 · bloque 1 · a-faire 1 · rejete 1 · abandonne 1` ; nouveaux ✗ hors fermés : `orthopro T042 bloque x section manquante : ## Environnement` seul ; jugé OK — pack bloqué antérieur, remplaçante scaffoldée neuve
- [ ] manques 15 lignes — `random.seed(31)`, 257 lignes → 5/15 mal classées = 33 % > 30 % : #4 `∅ · Inutile: ∅ (…)` extrait comme Manquait → autre · #5 `make -n à autoriser` → autre ≠ outil · #11 `syntaxe vx.py set --statut · git show` → autre ≠ outil · #13 `décompte réel…` → environnement via `compte` ≠ contrat · #15 `la forme de shouldAutoRefine` → autre ≠ contrat ; 4 ambiguës non comptées #7 #10 #12 #14
- [x] périmètre — `git diff --stat -- bin dash roles.json .claude` → `bin/vx.py | 124` seul
- [x] verdict cohérent — 2 `[ ]` ⇒ virer
- [x] result.md — ce fichier
## Motif
pack-lint : bloc de code non fermé masque les titres suivants, OK dispatchable sur pack à titre étranger et Mission dupliquée ; manques 5/15 mal classés soit 33 %, ex décompte→compte
## Vérifié comment
banc `.cache/banc-T031` (commande du pack) ; 6 projets banc, `cp env.md` réel, `vx tache essai` ; titres hors code par script python (toggle ```)
forge `projet forge` T001-T009 = copies de T030/context.md modifiées → `pack-lint` rc relevés ci-dessus
avant = `git show 48a6888:bin/vx.py` importé, chemins ROOT/VAULT du dépôt → `cmd_pack_lint` sur chaque pack, ✗ comparés
`categorie_manque('décompte réel fichiers modifiés')` → `environnement` ; `_manques_result("- Manquait: ∅ · Inutile: ∅ (plages)")` → `['∅ · Inutile: ∅ (plages)']`
`pack-lint T042 --projet orthopro` → `x section manquante : ## Environnement` rc=2
## Écarts
- lecture hors WL: `vault/_templates/context.md` (`rg -n '^## '`) — ordre des 9 sections
- banc T009-T010 : T010 vide créé par relance, sans effet
## Pour la suite
- `cmd_pack_lint` : après la boucle `if code: erreurs.append("bloc de code non ferme")` ; reconnaître `~~~` comme fence
- `MANQUES_CATEGORIES` : `\bcompte` ; outil += `make -n|syntaxe|git show` ; contrat += `forme de|semantique`
- `_manques_result` : ligne commençant par `∅` = vide (séparateur `·` ≠ `|`)
- `_avec_fiche_env` : `# `/`## ` et lignes vides traités aussi dans les ``` de la fiche ; ligne vide avant chaque `**X**` (rendu Obsidian collé)
- DoD remplaçant : pack forgé fence non fermée → ✗ ; échantillon seed 31 rejoué ≤ 4/15
## Retour sur le pack
- Manquait: critère « mauvaise catégorie » non borné (ligne ∅ mal extraite, lignes multi-catégories) ; ordre des 9 sections non recopié | Inutile: ∅
