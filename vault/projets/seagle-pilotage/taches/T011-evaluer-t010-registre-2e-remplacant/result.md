---
tache: T011
projet: seagle-pilotage
statut: fait
evalue: T010
verdict: retenir
---
## Verdict
retenir — 2 motifs levés, 45 mutés au format
## DoD
DoD T010 :
- [x] motif 1 : tous messages `_valider` au format — `rg -n "raise RegistreInvalide|RegistreInvalide\(" bin/produits.py` → 24 lignes : L30 class, L87-191 ×21 `<ou> : <valeur> invalide (<raison>)`, L199 `absent` / L204 `illisible` = `charger` ; L130 `{ou}.cle : {cle} invalide (en double, déjà produits[{j}])` · L137 idem couleur · L191 `produits : 0 entreprise invalide (exactement 1 entreprise:true)` == formats tranchés
- [x] motif 2 : `sources[].chemin` validé + `verifier` ne lève jamais — L185 `_absolu(s["chemin"], ...)` ; `neuves.py` source_user → `produits[0].sources[0].chemin : '~zzinconnu/x.md' invalide (commence par / ou ~/)` ; `verif.py` src_user → `['~zzinconnu/x.md : illisible (RuntimeError: Could not determine home directory.)']`, 0 exception
- [x] non-régression 26 mutés + DoD L1 #1/#2 — `rejeu.py` → `mutés=26 RegistreInvalide=26 format_ok=26` ; #1 → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle` ; #2 → `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}`
- [x] API inchangée + produits.json md5 — `inspect.signature` ×9 → `charger (chemin: 'Path' = PosixPath('…/produits.json')) -> 'dict[str, Produit]'` · `erreur () -> 'str'` · `tous () -> 'tuple[str, ...]'` · `produit (cle: 'str') -> 'Produit | None'` · `entreprise () -> 'Produit | None'` · `chemin (s: 'str') -> 'Path'` · `produit_de (meta_brief: 'dict') -> 'tuple[str, str]'` · `verifier (p: 'Produit') -> 'list[str]'` · `_valider (brut) -> 'dict[str, Produit]'` == liste T009 ; `md5sum produits.json` → `51822ea03421c166dfd3e855b4f56eb9` == déclaré T010
- [x] py_compile + diff stat — `python3 -m py_compile bin/produits.py; echo rc=$?` → `rc=0` ; `git status --porcelain -- bin/produits.py` → `?? bin/produits.py` ; `git diff --no-index --stat .cache/T010/registre/produits.avant.py bin/produits.py` → `1 file changed, 29 insertions(+), 21 deletions(-)` == déclaré
- [x] result.md T010 au format — 5 sections, `statut: revue`
DoD T011 :
- [x] motif T007 levé, 26 mutés copiés dans `.cache/seagle-eval-T011/` — regex `^(produits\[\d+\](\.[a-z_]+(\[\d+\])?)*|[a-z_]+) : .+ invalide \(.+\)$` → `mutés=26 RegistreInvalide=26 format_ok=26` ; ex. `cle_double → produits[1].cle : kora invalide (en double, déjà produits[0])` · `zero_entreprise → produits : 0 entreprise invalide (exactement 1 entreprise:true)`
- [x] ≥ 5 mutations neuves — `neuves.py` → `neuves=19 RegistreInvalide=19 format_ok=19` ; ex. `couleur_double3 → produits[3].couleur : #6366f1 invalide (en double, déjà produits[2])` · `cle_double3 → produits[3].cle : agentx invalide (en double, déjà produits[2])` · `source_str → produits[0].sources[0] : 'finance' invalide (objet attendu)` · `cal_absolu → produits[1].marketing.calendriers[0] : '/etc/x.md' invalide (relatif, sans ..)` · `env_abs → produits[0].env : '/vault/projets/x.md' invalide ("" ou vault/projets/….md)`
- [x] `verifier` ne lève jamais, ≥ 4 forgés — `verif.py` → `cas 11 exceptions 0` ; `depot_user → ['~zzinconnu/d : illisible (RuntimeError: …)']` · `abs_inexist → ['/zz/inexistant/xyz : absent', '/zz/inexistant/xyz/ui : absent']` · `sans_git → ['…/seagle-eval-T011/nogit : pas un dépôt git']` · `branche_abs → ['~/Documents/Workspace/AgentX : branche zz-branche-absente absente']` · `nul_byte → ['/a\x00b : absent']` · `glob_abs → ['… : illisible (NotImplementedError: Non-relative patterns are unsupported)']` · `branche_opt '--output=/tmp/x' → […absente]`, `ls /tmp/x` → absent
- [x] DoD L1 #1/#2, API, md5 — cf. DoD T010 cases 3-4
- [x] lecture seule 5 dépôts — `rev-parse HEAD` + `status --porcelain` avant/après → `avant==apres True 92` lignes ; HEAD ortho-front `b44dc91b3b07` · ortho-back `3aa51fdceb80` · geolens-web `2bf1f0eb8281` · Geolens-website `6ae6bfee4437` · seagle-website `29d349b1af2a`
- [x] verdict ⇐ 0 case `[ ]` — retenir, Motif ∅
- [x] result.md au format — ce fichier
## Motif
∅
## Vérifié comment
`python3 .cache/seagle-eval-T011/rejeu.py` (copie mut.py, D → seagle-eval-T011) → 26 `→ RegistreInvalide:` + `racine : list invalide (objet attendu)` + `illisible.json illisible : …` + `valide ['kora', 'geolens', 'agentx', 'seagle']` + `mutés=26 RegistreInvalide=26 format_ok=26`
`python3 .cache/seagle-eval-T011/neuves.py` → `neuves=19 RegistreInvalide=19 format_ok=19`
`python3 .cache/seagle-eval-T011/verif.py` → `cas 11 exceptions 0`
`git diff --no-index .cache/T010/registre/produits.avant.py bin/produits.py` → règles : seul ajout `_absolu(s["chemin"], f"{os_}.chemin")` ; `couleurs` set → dict (index j) ; reste = `verifier`/`_sonde`
`stat bin/produits.py` → `00:11:52` < result T010 `00:12:31` — 0 modif après T010
`git status --porcelain` AgentX → == snapshot début de session, 0 fichier hors E T010
## Écarts
- lecture hors WL : `.cache/T010/registre/produits.avant.py` — vérifier 0 changement de règle, diff stat
- T010 déclare `rg` → 25 lignes ; observé 24 — sans effet sur le format, non bloquant
## Pour la suite
- `bin/roles.py:52-77` : messages hors format (noté T010) — tâche séparée si voulu
- §C1 : refléter le message `verifier` `<chemin> : illisible (<Type>: <msg>)`
- `chemin()` lève encore sur `~user/` hors `verifier` — `_valider` l'empêche pour les registres chargés
## Retour sur le pack
- Manquait: copie avant de `bin/produits.py` (`.cache/T010/registre/produits.avant.py`) en WL pour « 0 changement de règle »
- Inutile: contrat.md §C1 L40-116 (Contrats du pack + T010 suffisaient)
