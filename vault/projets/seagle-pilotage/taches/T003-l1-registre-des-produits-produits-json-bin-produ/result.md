---
tache: T003
projet: seagle-pilotage
statut: bloque
---
## Livré
- produits.json:L1-L39 — bloc §C1, agentx branche → master
- bin/produits.py:L1-L282 — registre complet §C1, modèle roles.py
- bin/produits.py:L113-L191 — `_valider` pur, règles §C1 complètes
- bin/produits.py:L194-L206 — `charger`, cache (chemin, st_mtime_ns)
- bin/produits.py:L250-L282 — `verifier` : FS + `rev-parse --verify -q` seul

## Vérifié comment
`python3 -m py_compile bin/produits.py; echo rc=$?` → `rc=0`
DoD L1 #1 → `AttributeError: 'NoneType' object has no attribute 'cle'` ; `p.erreur()` → `"produits[3].sous : 'entreprise : site, marketing, finance, juridique, RSSI' invalide (1..48 car.)"`
DoD L1 #2 → `{}` (registre invalide)
copie `.cache/T003/ok.json` (seule modif : seagle `sous` 43 car.) → `('kora', 'geolens', 'agentx', 'seagle') ['seagle']` ; verifier → `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}`
mutés `.cache/T003/*.json`, `charger(chemin)` ×6 :
- 2 entreprise → `produits[3].entreprise : true invalide (déjà kora, exactement 1)`
- couleur double → `produits[1].couleur : #14b8a6 en double`
- cle Kora → `produits[0].cle : Kora invalide ([a-z][a-z0-9]{1,19})`
- ui ../x → `produits[0].depots[0].ui[0] : '../x' invalide (relatif, sans ..)`
- version 2 → `version : 2 invalide (attendu 1)`
- version true → `version : True invalide (attendu 1)`
registre absent → `erreur()` = `'absent.json absent'`, `tous()` = `()`, `produit_de` = `('', '')`, 0 exception
copie ok → `produit_de({'produit':'kora'})` = `('kora','brief')` ; `{}` / `'zz'` → `('seagle','defaut')`
NV sur disque :
- `git -C W/AgentX branch -a` → `refs/heads/master` seul ; `rev-parse --verify -q main` → ∅
- `ls -d W/OrthoPro/ortho-front/src` → existe
- `ls -d W/OrthoPro/PLAN_FACTURATION.md` → existe (conservé)
- `ls vault/projets/geolens-*/env.md` → 3 fichiers (charge-3d, preview-3d, viewer)
- 7 sources, 2 calendriers, globs site → tous existent ; `public/kora/*.webp` → 59
`rg -n 'subprocess\.' bin/produits.py` → 1 appel `git -C d rev-parse --verify -q` seul
`git -C <6 dépôts> status --porcelain` avant/après, `diff` → 5 dépôts identiques ; AgentX +`bin/produits.py`, `produits.json`, `outils/` (T004)
`git status --short` → ` M vault/projets/agentx-entreprise/todo.md` (préexistant) · `?? bin/produits.py` · `?? outils/` (T004) · `?? produits.json` · `?? vault/projets/seagle-pilotage/`

## Écarts
- valeur NV corrigée : agentx `branche_publication` — `"main"` → `"master"` (main inexistante)
- contrat contradictoire : seagle `sous` 54 car. > `sous` 1..48 → non corrigé, BLQ
- NV infirmé non corrigé : geolens `env` "" gardé ; 3 fiches existent, choix = architecte
- `PLAN_FACTURATION.md` existe → conservé (exemple du pack caduc)
- md5 des 3 env.md geolens refusé (classifieur) → contenus non comparés
- lecture hors WL : ∅

## Pour la suite
- BLQ : `seagle.sous` 54 car. ; DoD L1 #1/#2 KO tant que non tranché
- geolens `env` : choisir `vault/projets/geolens-viewer/env.md` ou garder "" (décision chef)
- seagle-website HEAD = `feat/ascii-nuit-etoilee` ≠ `main` : `verifier` globs site = arbre de travail, pas `main`
- `public/kora/*.webp` = 59 (pack disait 61 fichiers tous types)
- `sources[].chemin` : §C1 n'exige pas absolu → non validé (`verifier` le résout)

## Retour sur le pack
- Manquait: contrôle longueurs §C1 vs données ; liste des branches agentx
- Inutile: ∅

Question : pour seagle `sous` (54 car. dans §C1, max 48), faut-il raccourcir la valeur (laquelle) ou porter `LONGUEURS["sous"]` à 56 ?
