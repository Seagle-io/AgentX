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
