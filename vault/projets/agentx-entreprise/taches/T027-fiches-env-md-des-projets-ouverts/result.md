---
tache: T027
projet: agentx-entreprise
statut: fait
---
## Livré
- `vault/_templates/env.md` — gabarit 8 sections, tel que Contrats
- `vault/projets/orthopro/env.md` — 38 lignes-faits, 38 sources (op/T001-T043 + skill L8,L16,L17,L25,L39,L47)
- `vault/projets/seagle-site/env.md` — 36 faits, 36 sources (ss/T001-T028)
- `vault/projets/geolens-viewer/env.md` — 44 faits, 44 sources (gv/T001-T076)
- `vault/projets/geolens-preview-3d/env.md` — 38 faits, 38 sources (gp/T001-T026)
- `vault/projets/geolens-charge-3d/env.md` — 37 faits, 37 sources (gc/T001-T035 + skill L51,L87)
- `vault/projets/dashboard-grille/env.md` — 28 faits, 28 sources (dg/T001-T014)
- sections vides supprimées (aucune restante) ; skills `conventions-*` liés, non recopiés
- contradictions en `H:` : port back OrthoPro `:3000` (dg/T013 10-08) vs `:4000` (gv/T033 10-07) ; `:5183` stack e2e OrthoPro interdite vs banc gp ; `:4000` = API Geolens dev (gv/T049)
- lacune connue : branche réelle OrthoPro = `master` constatée, `Ultime` = cible (skill L8) ; branche seagle-site non répétée après T004

## Vérifié comment
`rg -n -i "password|passwd|secret|token|apikey|api_key" vault/projets/*/env.md` → 6 occurrences, toutes nom de variable/clé/chemin, 0 valeur :
- dashboard-grille/env.md:24 — `DB_PASSWORD` + `PGPASSWORD="$(grep ^DB_PASSWORD .env …)"` (nom, jamais valeur)
- dashboard-grille/env.md:25 — `auth_token` (nom de clé navigateur)
- dashboard-grille/env.md:48 — `POSTGRES_PASSWORD` (nom ; valeur absente)
- geolens-viewer/env.md:33 — `DEMO` (adminPassword, memberPassword : noms de champs, `api/src/seed.ts:25-125`)
- orthopro/env.md:30 — `ortho-back/.env` · `DB_PASSWORD`
- orthopro/env.md:31 — `auth_token` (nom)
`wc -l vault/projets/*/env.md` → dg 51 · gc 60 · gp 61 · gv 58 (après coupe, 68 avant) · op 61 · ss 59 ; corps (hors frontmatter 5 l) ≤ 60 partout : `awk 'NR>5' gv/env.md | wc -l` → 58
`python3 bin/vx.py integrer --projet <p> | wc -l` → op 1043 · ss 787 · gv 2288 · gp 752 · gc 869 · dg 290 (lus par rg ciblé sur sections Environnement/Manquait)
`rg -c '^- Manquait' vault/projets/<p>/taches/*/result.md | wc -l` → op 42 · ss 28 · gv 77 · gp 26 · gc 35 · dg 13 fichiers
Manquait non vides à thème environnement (regex large, borne haute) : op 16/41 · ss 11/27 · gv 52/65 · gp 15/29 · gc 13/29 · dg 8/11 → 115 repris ou couverts
`python3 bin/vx.py index` → `index ecrit : vault/INDEX.md (9 projet(s))`
`python3 bin/vx.py doctor` → `vault coherent.`
NV : exactitude de chaque HEAD/test count au présent (aucune commande exécutée, lecture seule) ; ordre chrono des faits `H:` daté par `cree:` de la tâche source

## Écarts
- lecture hors WL: `vault/projets/<p>/taches/T*/context.md` `rg -m1 "^cree:"` (11 tâches) — dater les faits contradictoires (≤ 1 rg, pas de lecture de fichier)
- `vx integrer` n'expose pas « Retour sur le pack » : couverture faite par script `python3` sur `result.md` (lecture WL), pas par `integrer`
- vx `integrer` + `rg -h` : `-h` = aide rg 14, utilisé `-I -N` / awk

## Pour la suite
- T026 : recopier `env.md` à l'identique dans `## Environnement` ; 58-61 l/fiche = ≈ 2× la place d'un Environnement actuel → recopier par section utile à la tâche (ex. `## Interdits` + `## Lancer…`)
- les fiches datent (HEAD G, comptes de tests) : le scribe rafraîchit `maj:` à `/clore` ; HEAD à re-lire par `git log -1`
- tâches à ouvrir (humain) : `ortho_test` absente (`op/T042` bloque depuis 2026-10-05) ; branche `Ultime` à créer/checkout
- gap gabarit : 0 champ « branche vérifiée le » — ajouter `maj` par section si les faits dérivent

## Retour sur le pack
- Manquait: règle de numérotation des sources quand le fait vient d'un skill (choisi `skill:Lxx`) ; consigne pour fait en désaccord entre deux projets (port :4000) ; outil `python3 -c` hors liste (utilisé pour couverture) ; plafond 60 l contre ~8 sections × 7 faits (gv a dû être coupé)
- Inutile: `vault/syndicat/2026-10-15-tous.md` (catégories déjà dans le pack) ; `.claude/skills/conventions-orthopro` entier (4 lignes citées)
