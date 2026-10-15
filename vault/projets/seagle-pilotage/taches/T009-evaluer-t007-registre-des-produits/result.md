---
tache: T009
projet: seagle-pilotage
statut: fait
evalue: T007
verdict: virer
---
## Verdict
virer — 3 messages `_valider` hors format §C1
## DoD
DoD T007 :
- [x] produits.json 2 valeurs, 0 autre changement — `diff .cache/T007/produits.avant.json produits.json` → `18c18` env geolens-viewer · `30c30` sous sans juridique ; rc=1, 2 hunks seuls ; `len(...)` → `43`
- [x] bin/produits.py 0 changement de règle — `md5sum` → `631b4ec5…` == T007 ; `rg -n LONGUEURS` → `82: {"nom": 24, "sous": 48}`
- [x] 3 cmd DoD L1 (contrat.md:307-311) — #1 → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle` · #2 → `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}` · mutés ×4 ci-dessous
- [x] 6 mutés T007 rejoués + absent — `rejeu.py` → RegistreInvalide ×6 (2entreprise, couleur_double, cle_Kora, ui_dotdot, version2, sous49) ; absent → `'absent.json absent' () None None ('', '')` 0 exception
- [x] git status 5 dépôts avant == après — `diff .cache/T007/avant.txt apres.txt` → rc=0 (87 l.) ; rejoué par moi ci-dessous
- [x] py_compile — `python3 -m py_compile bin/produits.py; echo rc=$?` → `rc=0`
- [x] result.md T007 au format — 5 sections présentes, statut revue
DoD T009 :
- [x] §C1 constantes/dataclasses/9 fonctions — `rejeu.py` → `ETATS ('actif','archive')` · `DOMAINES (...5)` · 3 RE verbatim · `RegistreInvalide(ValueError)` · 5 dataclasses `frozen True`, champs == §C1 · `FrozenInstanceError` sur setattr ; signatures : `charger (chemin: 'Path' = …/produits.json) -> 'dict[str, Produit]'` · `erreur () -> 'str'` · `tous () -> 'tuple[str, ...]'` · `produit (cle: 'str') -> 'Produit | None'` · `entreprise () -> 'Produit | None'` · `chemin (s: 'str') -> 'Path'` · `produit_de (meta_brief: 'dict') -> 'tuple[str, str]'` · `verifier (p: 'Produit') -> 'list[str]'` · `_valider (brut) -> 'dict[str, Produit]'` ; `rg -n "^import|^from"` → `__future__, json, re, subprocess, dataclasses, pathlib` (0 vx/dash)
- [ ] `_valider` ≥10 mutés, message `produits[i].<champ> : … invalide (…)` — 26 mutés `.cache/eval-T009/m_*.json` → RegistreInvalide ×26, valide → OK ; manque : format KO sur 2 règles DoD :
  - `cle_double → produits[1].cle : kora en double` (∅ `invalide (…)`)
  - `zero_entreprise → produits : aucune entreprise:true (exactement 1)` (∅ index, ∅ `invalide`)
  - hors liste : `couleur double → produits[1].couleur : #14b8a6 en double` (idem)
  - conformes : `ent_int → produits[3].entreprise : 1 invalide (bool attendu)` · `nom25 … invalide (1..24 car.)` · `ui_absolu → …ui[0] : '/web/src' invalide (relatif, sans ..)` · `env_hors … invalide ("" ou vault/projets/….md)` · `domaine_inconnu … 'compta' invalide (finance|…)` · `captures_vide … [] invalide (liste non vide attendue)` · `site_depot_rel … invalide (commence par / ou ~/)` · `ent_archive → produits[3].etat : 'archive' invalide (entreprise → actif)` · `version_true → version : True invalide (attendu 1)`
- [x] cache (chemin, st_mtime_ns) — `cache_verif.py` (compteur sur read_text) → `2 appels → lectures 1 même objet True` · `mtime modifié → lectures 2 nouvel objet True` · `contenu modifié → nom KoraBis lectures 3`
- [x] verifier lecture seule + branche absente — `subprocess` seul `rev-parse --verify -q` (L257) ; status --porcelain + rev-parse HEAD ×6 dépôts → `git avant == après True` ; forgé → `['~/…/ortho-front : branche zz-branche-absente absente']` · `['~/…/Geolens-website : branche zz-absente absente']`, 0 exception
- [x] chemins existent, 0 donnée chiffrée — 22 chemins `ls -d` → 22 OK ; globs site : Kora/index.tsx · Kora.ts ×5 · Logiciel.tsx · site.ts · pages.ts · `kora/*.webp` 59 · `vue-*.webp` 7 ; chiffres de produits.json = version, couleurs, noms de fichiers seulement
- [x] virer ⇐ 1 case `[ ]` — appliqué
- [x] result.md au format — ce fichier
## Motif
_valider : 3 messages hors format §C1 « produits.i.champ : valeur invalide (…) » : cle en double, couleur en double, 0 entreprise ; verifier lève RuntimeError sur sources.chemin ~user/
## Vérifié comment
`python3 .cache/eval-T009/rejeu.py` → 6 mutés T007 + absent + constantes + signatures (cités en DoD)
`python3 .cache/eval-T009/mut.py` → 26 lignes `→ RegistreInvalide:` + `racine : objet attendu` + `illisible.json illisible : Expecting property name…` + `valide ['kora', 'geolens', 'agentx', 'seagle']`
`python3 .cache/eval-T009/cache_verif.py` → cache, verifier, git avant/après (cités en DoD) ; HEAD : ortho-front `b44dc91b3b07` · ortho-back `3aa51fdceb80` · geolens-web `2bf1f0eb8281` · Geolens-website `6ae6bfee4437` · seagle-website `29d349b1af2a` · AgentX `b9199fa90756`
hors DoD : `verifier(replace(kora, sources=(Source('finance','~zzinconnu/x.md'),)))` → `EXCEPTION RuntimeError Could not determine home directory.` (§C1 « jamais levé » ; `sources[].chemin` non validé par `_valider`)
`git status --porcelain -- produits.json bin/produits.py` → `?? bin/produits.py` · `?? produits.json` ; `git status --short` == début de session (0 fichier hors E)
## Écarts
- contrat.md:L305-311 lu (DoD L1) — hors plage L40-116 annoncée, même fichier WL
- lecture hors WL : ∅
## Pour la suite
- pack remplaçant : 3 messages à aligner, ≤ 3 lignes `bin/produits.py:L130,L137,L190` ; 0 changement de règle
- contrat à trancher : format du message « 0 entreprise » (pas d'index i) ex. `produits.entreprise : 0 invalide (exactement 1)`
- `verifier` : `chemin()` → `expanduser` lève RuntimeError sur `~user/` ; soit `_valider` impose `sources[].chemin` / ou ~/ (via `_absolu`), soit `verifier` capture
- 0 régression sur données : registre valide, 4 produits verts, T005/T006 non impactés
## Retour sur le pack
- Manquait: DoD L1 de contrat.md (L305-311) non citée en coordonnées ; `sources[].chemin` absent de la liste de règles à muter
- Inutile: T003/result.md (tout redit par T007)
