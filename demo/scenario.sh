#!/usr/bin/env bash
# Fait vivre « recherche-floue » beat par beat : la salle suit toute seule.
# Usage : bash scenario.sh [secondes par beat, défaut 7]
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
B=${1:-7}
P=vault/projets/recherche-floue/taches
statut() { python3 bin/vx.py set "$1" --statut "$2" --projet recherche-floue >/dev/null; }
beat() { echo "── $(date +%H:%M:%S)  $*"; sleep "$B"; }

# le dossier existe, pas encore result.md : on résout le dossier puis on écrit
resultat() { cat > "$(ls -d $P/$1*/ | head -1)result.md"; }

echo "scénario recherche-floue — $B s par beat"

beat "1/10  le chef pose les packs de la vague 1"
statut T001 pret; statut T002 pret

beat "2/10  vague 1 dispatchée — deux éclaireurs en parallèle"
statut T001 en-cours; statut T002 en-cours

beat "3/10  T001 rend sa carte"
resultat T001 <<'EOF'
---
tache: T001
statut: fait
---
## Livré
Chemin complet requête → résultat, en coordonnées :
- `api/recherche.ts:12-48` — handler, filtre par `includes()` sur le titre
- `data/catalogue.ts:9` — catalogue chargé au boot, tableau simple, aucun index
- `api/recherche.test.ts:1-61` — 6 cas, **tous en correspondance exacte**

## Vérifié comment
`rg -n "recherche" --type ts` puis lecture des 3 fichiers. Aucun test lancé.

## Écarts
Aucun. Whitelist suffisante.

## Pour la suite
Il n'existe aucun index : la recherche est un `filter` linéaire sur 50 k titres.
Aucun test ne couvre les accents ni les fautes de frappe — tout est à écrire.
L'API renvoie déjà `{resultats: [{id, titre, score}]}`, le score est constant à 1.

## Retour sur le pack
- Manquait : rien.
- Inutile : la mention du classement commercial, hors sujet ici.
EOF
statut T001 fait

beat "4/10  T002 mesure le catalogue, le chef enchaîne sur l'architecte"
resultat T002 <<'EOF'
---
tache: T002
statut: fait
---
## Livré
```
articles: 50 000
titre_len: 8 / 34 / 72 / 180
charset_hors_ascii: [é è ê à ç ô ü œ]
trigrammes_distincts: ~41 000
memoire_catalogue_mo: 47
```

## Vérifié comment
Script de comptage lancé sur `data/catalogue.seed.json` — sortie collée ci-dessus.

## Écarts
Aucun.

## Pour la suite
L'hypothèse « le catalogue tient en mémoire » tient : 47 Mo. L'index trigramme
ajoutera ~18 Mo. 1,8 % des titres font moins de 3 caractères : il faudra les
indexer entiers sinon ils disparaissent.

## Retour sur le pack
- Manquait : le seuil mémoire acceptable n'était pas donné, j'ai mesuré sans cible.
- Inutile : rien.
EOF
statut T002 fait; statut T003 pret

beat "5/10  l'architecte tranche"
statut T003 en-cours

beat "6/10  contrat figé, la vague 3 part en parallèle"
resultat T003 <<'EOF'
---
tache: T003
statut: fait
---
## Livré
Décision ajoutée à `decisions.md`. Contrat figé :
```ts
export type IndexTrigramme = { parTrigramme: Map<string, Set<string>>; taille: number }
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
```
Seuil de distance : 2. Candidats : 200 au plus.

## Vérifié comment
Non vérifié — aucun code produit, c'est un contrat.

## Écarts
Aucun.

## Pour la suite
Le contrat est recopiable tel quel dans T004 et T005 : ils peuvent partir
ensemble sans se parler. Point de non-retour : la mise à jour à chaud de l'index
devient difficile une fois `parTrigramme` figé en `Map`.

## Retour sur le pack
- Manquait : rien.
- Inutile : rien.
EOF
statut T003 fait; statut T004 pret; statut T005 pret

beat "7/10  deux implémenteurs sur des fichiers disjoints"
statut T004 en-cours; statut T005 en-cours

beat "8/10  T004 livre — T005 se bloque sur une ambiguïté du contrat"
resultat T004 <<'EOF'
---
tache: T004
statut: fait
---
## Livré
- `search/index.ts:1-96` — `construireIndex()` et `candidats()`, conformes au contrat
- `search/normaliser.ts:1-24` — pliage des accents avant découpe
- `search/index.test.ts:1-78` — 7 cas dont titres courts et requête vide

## Vérifié comment
`npm test -- search/index` → 7 passed, 0 failed, 1.9 s. Index construit en 6,2 s.

## Écarts
Aucune lecture hors whitelist.

## Pour la suite
Les titres de moins de 3 caractères sont indexés entiers, sous une clé préfixée
`\x00`. Si T005 itère sur les clés, il doit les ignorer.

## Retour sur le pack
- Manquait : le comportement attendu sur titre < 3 caractères était dans la DoD
  mais pas dans le contrat — j'ai tranché seul.
- Inutile : rien.
EOF
statut T004 fait
resultat T005 <<'EOF'
---
tache: T005
statut: bloque
---
## Livré
Rien. Le handler est à moitié réécrit, non commité.

## Vérifié comment
Non vérifié.

## Écarts
Aucun.

## Pour la suite
**Question bloquante** : quand la distance de Levenshtein est égale entre deux
articles, le contrat ne dit pas comment départager. Classement par ordre du
catalogue, ou par nombre de trigrammes communs ? Les deux donnent des résultats
visiblement différents sur « chausure ». Je ne tranche pas à la place de
l'architecte.

## Retour sur le pack
- Manquait : la règle de départage à score égal.
EOF
statut T005 bloque

beat "9/10  le chef répond, corrige le pack et relance"
statut T005 en-cours

beat "10/10  vague 4 : les vérificateurs attaquent"
resultat T005 <<'EOF'
---
tache: T005
statut: fait
---
## Livré
- `api/recherche.ts:12-61` — passe par l'index puis reclasse par distance
- `search/distance.ts:1-38` — Levenshtein borné à 2, sortie anticipée
- `api/recherche.test.ts:1-94` — non-régression exacte + 5 cas de faute

## Vérifié comment
`npm test -- recherche` → 11 passed, 0 failed. p95 mesurée à 61 ms sur 50 k.

## Écarts
Départage à score égal tranché par le chef : nombre de trigrammes communs.

## Pour la suite
« chausure » renvoie bien « chaussure » en tête. La p95 tient avec de la marge.

## Retour sur le pack
- Manquait : la règle de départage — ajoutée après coup.
EOF
statut T005 fait; statut T006 pret; statut T007 pret
sleep "$B"
statut T006 en-cours; statut T007 en-cours

beat "11/12  le vérificateur de l'index rend son verdict"
resultat T006 <<'EOF'
---
tache: T006
statut: fait
---
## Livré
**CONFORME.** Les 5 affirmations de T004 sont reproduites. Ce que j'ai essayé
sans y arriver : requête vide, 1 et 2 caractères ; titre de 180 caractères ;
titre tout en accents ; emoji isolé ; `candidats(idx, "x".repeat(5000))` ;
double `construireIndex()` sur le même tableau.

## Vérifié comment
`npm test -- search/index` → 7 passed. Mes 11 cas ajoutés → 11 passed.
Index reconstruit 3 fois : 6,2 / 6,1 / 6,4 s.

## Écarts
2 lectures hors whitelist (`data/catalogue.seed.json`, `package.json`) pour
fabriquer un catalogue de 50 k lignes réaliste.

## Pour la suite
L'index tient. Seul angle non couvert : une requête pendant la reconstruction —
pas de verrou, mais l'index est construit au boot, donc inatteignable aujourd'hui.

## Retour sur le pack
- Manquait : le volume de catalogue à utiliser pour tester, j'ai dû le fabriquer.
EOF
statut T006 fait

beat "12/12  le vérificateur de l'API se bloque : pas de corpus de référence"
resultat T007 <<'EOF'
---
tache: T007
statut: bloque
---
## Livré
Partiel. 6 cas sur 9 passés, puis arrêt.

## Vérifié comment
`npm test -- recherche` → 11 passed, conforme à ce que T005 annonce.
p95 remesurée : 64 ms (T005 annonçait 61 ms — même ordre, acceptable).

## Écarts
Aucune lecture hors whitelist.

## Pour la suite
**Question bloquante** : la DoD exige « aucune régression sur les requêtes
exactes », mais il n'existe aucun jeu de requêtes de référence dans le dépôt.
Faut-il en capturer un depuis les logs de production, ou la DoD se limite-t-elle
aux 6 cas écrits à la main ?

## Retour sur le pack
- Manquait : d'où vient le corpus de non-régression.
EOF
statut T007 bloque

echo "── fin du scénario. La salle reste dans ce dernier état (T007 bloqué)."
