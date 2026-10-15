---
tache: T007
projet: seagle-pilotage
statut: revue
---
## Livré
- produits.json:L18 — geolens `env` → `vault/projets/geolens-viewer/env.md`
- produits.json:L30 — seagle `sous` → 43 car., sans « juridique »
- bin/produits.py — 0 changement (md5 `631b4ec5…` avant == après)
- .cache/T007/*.json — 6 registres mutés + avant/après git status

## Vérifié comment
`diff .cache/T007/produits.avant.json produits.json` →
```
18c18
<      "entreprise": false, "etat": "actif", "env": "",
>      "entreprise": false, "etat": "actif", "env": "vault/projets/geolens-viewer/env.md",
30c30
<     {"cle": "seagle", "nom": "Seagle", "sous": "entreprise : site, marketing, finance, juridique, RSSI", "couleur": "#e2b04a",
>     {"cle": "seagle", "nom": "Seagle", "sous": "entreprise : site, marketing, finance, RSSI", "couleur": "#e2b04a",
```
`python3 -c "print(len('entreprise : site, marketing, finance, RSSI'))"` → `43`
`python3 -m py_compile bin/produits.py; echo rc=$?` → `rc=0`
DoD L1 #1 → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle`
DoD L1 #2 → `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}` (inclut `env` geolens is_file, produits.py:L266)
`charger(.cache/T007/<n>.json)` ×6 :
- 2entreprise → `RegistreInvalide: produits[3].entreprise : true invalide (déjà kora, exactement 1)`
- couleur_double → `RegistreInvalide: produits[1].couleur : #14b8a6 en double`
- cle_Kora → `RegistreInvalide: produits[0].cle : Kora invalide ([a-z][a-z0-9]{1,19})`
- ui_dotdot → `RegistreInvalide: produits[0].depots[0].ui[0] : '../x' invalide (relatif, sans ..)`
- version2 → `RegistreInvalide: version : 2 invalide (attendu 1)`
- sous49 → `RegistreInvalide: produits[3].sous : 'xxx…x' invalide (1..48 car.)`
absent (`charger.__defaults__` → `.cache/T007/absent.json`) → `erreur() = 'absent.json absent' ; tous() = () ; entreprise() = None ; produit_de = ('', '')` rc=0
`git -C W/{ortho-front,ortho-back,geolens-web-feat-viewer-online,Geolens-website,seagle-website} status --porcelain` avant/après → `diff` rc=0 (5 dépôts)
`git status --short` → inchangé vs début (` M …todo.md` · `?? bin/produits.py` · `?? outils/` · `?? produits.json` · `?? vault/projets/seagle-pilotage/`)

## Écarts
- registre absent : `FICHIER` lié en défaut de `charger` à la def → test via `charger.__defaults__`, pas `p.FICHIER`
- 6e mutation = `sous` 49 car. (≠ T003 `version true`) — prouve règle 48
- lecture hors WL : ∅

## Pour la suite
- `produits.charger` : défaut figé à l'import → monkeypatch `FICHIER` sans effet ; tests futurs : passer `chemin` ou `__defaults__`
- seagle `sous` n'énumère plus « juridique » ; domaine `juridique` reste dans DOMAINES
- seagle-website HEAD `feat/ascii-nuit-etoilee` ≠ `main` : globs site lus sur l'arbre de travail
- L2 (rattacher ×11) débloqué : registre valide

## Retour sur le pack
- Manquait: liste explicite des 5 dépôts « produits/sites » (déduite de produits.json)
- Inutile: ∅
