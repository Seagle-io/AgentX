#!/usr/bin/env bash
# Monte le projet de démonstration « recherche-floue » dans le vault.
set -e
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
P=vault/projets/recherche-floue

python3 bin/vx.py projet recherche-floue --titre "Recherche tolérante aux fautes" >/dev/null

python3 bin/vx.py tache "Cartographier la recherche actuelle" --projet recherche-floue --role eclaireur >/dev/null
python3 bin/vx.py tache "Relever le volume et la forme du catalogue" --projet recherche-floue --role eclaireur >/dev/null
python3 bin/vx.py tache "Trancher l'algorithme et le seuil" --projet recherche-floue --role architecte --dep T001 --dep T002 >/dev/null
python3 bin/vx.py tache "Index trigramme en memoire" --projet recherche-floue --role implementeur --dep T003 >/dev/null
python3 bin/vx.py tache "Brancher l'API de recherche" --projet recherche-floue --role implementeur --dep T003 >/dev/null
python3 bin/vx.py tache "Casser l'index trigramme" --projet recherche-floue --role verificateur --dep T004 >/dev/null
python3 bin/vx.py tache "Attaquer l'API sur les bords" --projet recherche-floue --role verificateur --dep T005 >/dev/null
python3 bin/vx.py tache "Corriger les defauts remontes" --projet recherche-floue --role implementeur --dep T006 --dep T007 >/dev/null
python3 bin/vx.py tache "Capitaliser la recherche floue" --projet recherche-floue --role scribe --dep T008 >/dev/null

# ── brief ───────────────────────────────────────────────────────────────
cat > "$P/brief.md" <<'EOF'
---
projet: recherche-floue
titre: Recherche tolérante aux fautes
statut: en cours
objectif: trouver « chaussure » quand l'utilisateur tape « chausure », sous 80 ms
cree: 2026-10-04
---

# Brief — Recherche tolérante aux fautes

## Objectif
La recherche du catalogue renvoie le bon produit malgré une faute de frappe,
en moins de 80 ms sur 50 000 articles.

## Definition of Done du projet
- [ ] « chausure », « chaussur », « chasure » renvoient tous « chaussure » en tête
- [ ] p95 sous 80 ms sur le catalogue complet
- [ ] aucune régression sur les requêtes exactes
- [ ] index reconstructible à froid en moins de 10 s

## Contraintes dures
- Pas de service externe : tout tourne dans le processus applicatif.
- Pas de dépendance nouvelle non justifiée — l'équipe refuse Elasticsearch ici.
- L'API publique `/api/recherche` ne change pas de forme.

## Hors périmètre
- La recherche par facettes et les filtres.
- Le classement commercial (boost, sponsorisé).
- La recherche multilingue.

## Hypothèses retenues
- Le catalogue tient en mémoire (≈ 50 Mo) — à invalider si on passe 200 k articles.
- Les fautes sont à distance 1 ou 2, pas davantage.

## Questions ouvertes
- Faut-il indexer la description ou seulement le titre ? → tranché en T003.

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| point d'entrée recherche | `api/recherche.ts` | 1 handler, 40 lignes |
| accès catalogue | `data/catalogue.ts` | chargé au boot, en mémoire |
| tests existants | `api/recherche.test.ts` | 6 cas, tous en exact |
EOF

# ── plan ────────────────────────────────────────────────────────────────
cat > "$P/plan.md" <<'EOF'
---
projet: recherche-floue
titre: Recherche tolérante aux fautes
maj: 2026-10-04
---

# Plan — Recherche tolérante aux fautes

## Découpage

| ID | Rôle | Livrable | Dépend de | Parallélisable avec |
|---|---|---|---|---|
| T001 | eclaireur | carte de la recherche actuelle | — | T002 |
| T002 | eclaireur | volume, forme et distribution du catalogue | — | T001 |
| T003 | architecte | contrat d'index + seuil de distance | T001, T002 | — |
| T004 | implementeur | index trigramme en mémoire | T003 | T005 |
| T005 | implementeur | branchement de l'API | T003 | T004 |
| T006 | verificateur | tentative de casse de l'index | T004 | T007 |
| T007 | verificateur | attaque des bords de l'API | T005 | T006 |
| T008 | implementeur | correction des défauts | T006, T007 | — |
| T009 | scribe | notes + gabarits corrigés | T008 | — |

## Vagues d'exécution
- **Vague 1** : T001, T002 (parallèle)
- **Vague 2** : T003
- **Vague 3** : T004, T005 (parallèle — fichiers disjoints)
- **Vague 4** : T006, T007 (parallèle)
- **Vague 5** : T008
- **Vague 6** : T009

## Points de synchronisation
- Après la vague 2 : le contrat d'index est recopié dans les packs T004 et T005.
  Sans ça les deux implémentations ne s'emboîtent pas.

## Risques
| Risque | Signal précoce | Parade |
|---|---|---|
| index trop lourd en mémoire | > 120 Mo au boot | passer en trigrammes tronqués |
| seuil trop permissif | résultats hors sujet en tête | remonter le seuil, test de non-régression |
EOF

cat > "$P/decisions.md" <<'EOF'
# Decisions — Recherche tolérante aux fautes

Une décision = un bloc. Jamais de réécriture, on ajoute.

## 2026-10-04 — Index trigramme en mémoire plutôt que Levenshtein à la volée
- **Contexte** : 50 000 titres, budget 80 ms p95. Levenshtein sur tout le catalogue
  à chaque requête coûte ~400 ms — la contrainte qui décide est le temps, pas la qualité.
- **Choix** : index trigramme inversé construit au boot, Levenshtein appliqué
  seulement aux 200 meilleurs candidats.
- **Écarté** : Levenshtein pur (trop lent) ; moteur externe (interdit par le brief).
- **Conséquence** : rend le reclassement facile, rend la mise à jour à chaud difficile.
- **À revoir si** : le catalogue dépasse 200 000 articles.
EOF
echo "projet monté"
