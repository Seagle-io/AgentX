---
tache: T010
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/produits.py:L87,L115,L120 — 3 messages « objet/liste attendu » au format
- bin/produits.py:L122,L130,L137-138 — doublons cle/couleur : `invalide (en double, déjà produits[j])`
- bin/produits.py:L185 — `sources[].chemin` validé par `_absolu`
- bin/produits.py:L191 — 0 entreprise : format tranché par chef
- bin/produits.py:L265-290 — `_sonde` : exception par chemin → message ; `verifier` jamais levé
## Vérifié comment
`python3 .cache/T010/registre/mut.py` (copie de eval-T009/mut.py, D → .cache/T010/registre) → 26 mutés `→ RegistreInvalide` ×26, au format ; extraits :
`cle_double → produits[1].cle : kora invalide (en double, déjà produits[0])`
`zero_entreprise → produits : 0 entreprise invalide (exactement 1 entreprise:true)`
`couleur_double → produits[1].couleur : #14b8a6 invalide (en double, déjà produits[0])`
`cle_double_3 → produits[3].cle : geolens invalide (en double, déjà produits[1])`
`produits_vide → produits : [] invalide (liste non vide attendue)` · `produits_dict → produits : {} invalide (…)`
`produit_str → produits[0] : 'kora' invalide (objet attendu)` · `racine_liste → racine : list invalide (objet attendu)`
`source_user → produits[0].sources[0].chemin : '~zzinconnu/x.md' invalide (commence par / ou ~/)`
`source_rel → produits[0].sources[0].chemin : 'x.md' invalide (commence par / ou ~/)`
`valide ['kora', 'geolens', 'agentx', 'seagle']`
verifier forgé (replace(kora, …)) → 0 exception :
`'~zzinconnu/x.md' ['~zzinconnu/x.md : illisible (RuntimeError: Could not determine home directory.)']`
`'a\x00b' ['a\x00b : absent']` · `depots ['~zz/x : illisible (RuntimeError: …)']` · `site ['~zz : illisible (RuntimeError: …)']` · `marketing ['~zz/m : illisible (RuntimeError: …)']`
`site pages=('/abs/*.tsx','**x')` → `['~/Documents/Workspace/seagle-website : illisible (NotImplementedError: Non-relative patterns are unsupported)']`
DoD L1 #1 → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle` · #2 → `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}`
DoD L1 mutés → `2ent → produits[3].entreprise : true invalide (déjà kora, exactement 1)` · `cle_Kora → produits[0].cle : Kora invalide ([a-z][a-z0-9]{1,19})` · `ui_dotdot → …ui[0] : '../x' invalide (relatif, sans ..)` · couleur_double ci-dessus
`rg -n "raise RegistreInvalide|RegistreInvalide\(" bin/produits.py` → 25 lignes ; L87-191 toutes `<champ> : <valeur> invalide (<raison>)` ; L199 `{name} absent`, L204 `{name} illisible : …` = `charger`, hors `_valider`
`python3 .cache/T010/registre/sig.py | diff sig.avant.txt -` → `sig identiques` (9 fonctions, ex. `verifier (p: 'Produit') -> 'list[str]'`)
`md5sum produits.json` avant → `51822ea03421c166dfd3e855b4f56eb9` · après → `51822ea03421c166dfd3e855b4f56eb9`
`python3 -m py_compile bin/produits.py; echo rc=$?` → `rc=0`
`git diff --stat -- bin/produits.py` → ∅ (fichier `??` non suivi) ; `git diff --no-index --stat .cache/T010/registre/produits.avant.py bin/produits.py` → `1 file changed, 29 insertions(+), 21 deletions(-)`
## Écarts
- DoD « TOUS les messages » → 3 messages hors motif alignés aussi (L87, L115, L120) ; valeur = `!r`, racine = nom de type
- `rg` hors WL sur `bin/` (messages consommés ailleurs ?) → seul `bin/roles.py` même texte, 0 consommateur ; 1 lecture
- `_sonde` capture `Exception` — §C1 « jamais levé », vu RuntimeError, NotImplementedError
- `.cache/T010/` déjà occupé (captures PNG autre projet) → essais dans `.cache/T010/registre/`
- mut.py rejoué depuis copie : l'original écrit dans `.cache/eval-T009/` (L seul)
## Pour la suite
- `bin/roles.py:52-77` : mêmes 5 messages hors format (en double, objet attendu) — hors périmètre
- texte `verifier` nouveau : `<chemin> : illisible (<Type>: <msg>)` — à refléter dans §C1 si l'UI le filtre
- `chemin()` inchangé, lève encore sur `~user/` hors `verifier`
## Retour sur le pack
- Manquait: messages L87/L115/L120 non cités alors que DoD dit « TOUS » ; `.cache/T010/` déjà pris par un autre projet
- Inutile: contrat.md §C1 (Contrats du pack suffisaient)
