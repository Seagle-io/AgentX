---
tache: T030
statut: fait
---
## Livré
- vault/connaissances/geolens-serveur-test.md — +3 sections : API redéployée, Caddy/S3, 30 VUs (68 l)
- vault/connaissances/geolens-route-tuile-charge.md — créée : coûts CPU, caches, SigV4, mesures, pièges (56 l)
- liens croisés [[geolens-route-tuile-charge]] ↔ [[geolens-serveur-test]] ; INDEX ∅
## Vérifié comment
wc -l geolens-serveur-test.md geolens-route-tuile-charge.md → 68 · 56 (≤ 80 · ≤ 60)
secrets : aucune clé/mot de passe/.env écrit (relecture) → OK
index/doctor : NV — Bash hors outils autorisés du pack
## Écarts
- ∅
## Pour la suite
- Environnement · « chemins config/env/compose lus par le code E (ex. config.ts parsing `bool()`/`intIn`, `.env*`) » · T014, T017, T028
- Environnement · « comptes seed de test + projets accessibles (admin/member/rival → projets) et table d'accès » · T016, T017, T028
- Contrats · « types de ligne DB/API consommés, 1 ligne (ex. ProjectRow.storage_prefix: string) » · T024, T025
- Contrats · « sémantique abort/erreur/état global (writable, inflight) du code async touché » · T026, T028
- Fichiers autorisés · « n° de ligne d'un point d'insertion = ancre rg + ±N, recompter sur HEAD » · T027 (:141≠:142), T023 (D6/D7 décalés)
- Environnement · « make -n : préciser si cibles `+`/check exécutées ; image k6 uid ≠ hôte → --user $(id -u) » · T015, T019
- Environnement · « serveur de test = HTTP ⇒ pas de secure context/Cache Storage ; GEOLENS_ENV jamais production » · T024, T013
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
